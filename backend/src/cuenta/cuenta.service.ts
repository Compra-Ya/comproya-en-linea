import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConsentStatus } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import { Customer, StaffUser } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { AdaptadorLealtadSimulado } from "./puertos/adaptador-lealtad-simulado";
import { RegistrarClienteDto } from "./dto/registrar-cliente.dto";
import { LoginDto } from "./dto/login.dto";
import { DecidirConsentimientoDto } from "./dto/decidir-consentimiento.dto";
import { RegistrarEventoDto } from "./dto/registrar-evento.dto";

// Hash de una contraseña que nadie conoce: se compara cuando el correo no existe para que responder "credenciales
// inválidas" tarde lo mismo exista o no la cuenta interna.
const HASH_SIN_CUENTA = bcrypt.hashSync("sin-cuenta-interna", 10);
const VIGENCIA_SESION_INTERNA = "12h";

// Módulo cuenta: sub-problemas SP-07 (identidad del comprador digital) y
// SP-08 (consentimiento y registro del comportamiento) — sprint 2.
@Injectable()
export class CuentaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly lealtad: AdaptadorLealtadSimulado,
  ) {}

  private emitirToken(customerId: number, email: string) {
    return this.jwt.sign({ sub: customerId, email });
  }

  // CU-04 Registro de cuenta.
  async registrar(dto: RegistrarClienteDto) {
    const existente = await this.prisma.customer.findUnique({ where: { document: dto.document } });
    if (existente) {
      // E-1: documento duplicado.
      throw new ConflictException("Ya existe una cuenta registrada con ese documento");
    }
    // El correo también es único: sin esta revisión el segundo registro con el mismo correo fallaba con un error interno.
    const correoEnUso = await this.prisma.customer.findUnique({ where: { email: dto.email } });
    if (correoEnUso) {
      throw new ConflictException("Ya existe una cuenta registrada con ese correo electrónico");
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const customer = await this.prisma.$transaction(async (tx) => {
      const created = await tx.customer.create({
        data: { document: dto.document, name: dto.name, email: dto.email, passwordHash },
      });
      // Consentimiento pendiente hasta que el cliente decida en CU-05.
      await tx.consent.create({ data: { customerId: created.id, active: false } });
      return created;
    });

    return {
      customer: this.sinCredenciales(customer),
      accessToken: this.emitirToken(customer.id, customer.email),
    };
  }

  async login(dto: LoginDto) {
    const customer = await this.prisma.customer.findUnique({ where: { email: dto.email } });
    if (!customer || !(await bcrypt.compare(dto.password, customer.passwordHash))) {
      throw new UnauthorizedException("Credenciales inválidas");
    }
    return {
      customer: this.sinCredenciales(customer),
      accessToken: this.emitirToken(customer.id, customer.email),
    };
  }

  // Inicio de sesión de la cuenta interna (Coordinador de Canal Digital), separado del de los clientes (REQ-017):
  // la sesión dura 12 horas y su token lleva tipo "staff", que las rutas del Cliente digital rechazan.
  async loginInterno(dto: LoginDto) {
    const staff = await this.prisma.staffUser.findUnique({ where: { email: dto.email.trim().toLowerCase() } });
    const coincide = await bcrypt.compare(dto.password, staff?.passwordHash ?? HASH_SIN_CUENTA);
    if (!staff || !staff.active || !coincide) {
      throw new UnauthorizedException("Credenciales inválidas");
    }
    return {
      staff: this.perfilInternoPublico(staff),
      accessToken: this.jwt.sign(
        { sub: staff.id, email: staff.email, tipo: "staff", rol: staff.role },
        { expiresIn: VIGENCIA_SESION_INTERNA },
      ),
    };
  }

  async perfilInterno(staffId: number) {
    const staff = await this.prisma.staffUser.findUniqueOrThrow({ where: { id: staffId } });
    return this.perfilInternoPublico(staff);
  }

  private perfilInternoPublico(staff: StaffUser) {
    return { id: staff.id, name: staff.name, email: staff.email, role: staff.role };
  }

  // CU-05 Administración del consentimiento — activar/revocar en ≤ 2
  // interacciones (canon, sección 10): una sola llamada a este endpoint.
  // PE-01/PE-02/PE-05 (Plan_Pruebas_ComproYa.docx, sección 9.2): la máquina
  // de estados de Consentimiento es Pendiente -> Activo/Revocado -> Suprimido
  // (terminal); desde Suprimido ninguna decisión del cliente cambia el estado.
  async decidirConsentimiento(customerId: number, dto: DecidirConsentimientoDto) {
    const actual = await this.prisma.consent.findUnique({ where: { customerId } });
    if (actual?.status === ConsentStatus.SUPRIMIDO) {
      throw new ConflictException("No se puede otorgar ni revocar un consentimiento ya suprimido");
    }

    if (dto.activo && dto.loyaltyId) {
      const encontrado = this.lealtad.resolverIdentificador(dto.loyaltyId);
      if (!encontrado) {
        throw new BadRequestException("El identificador de lealtad no fue encontrado en el programa de lealtad");
      }
      const enUso = await this.prisma.customer.findUnique({ where: { loyaltyId: dto.loyaltyId } });
      if (enUso && enUso.id !== customerId) {
        throw new ConflictException("Ese identificador de lealtad ya está vinculado a otra cuenta");
      }
    }

    const status = dto.activo ? ConsentStatus.ACTIVO : ConsentStatus.REVOCADO;
    return this.prisma.$transaction(async (tx) => {
      const consent = await tx.consent.upsert({
        where: { customerId },
        update: { active: dto.activo, status },
        create: { customerId, active: dto.activo, status },
      });
      if (dto.activo && dto.loyaltyId) {
        await tx.customer.update({ where: { id: customerId }, data: { loyaltyId: dto.loyaltyId } });
      }
      return consent;
    });
  }

  async consultarConsentimiento(customerId: number) {
    return this.prisma.consent.findUnique({ where: { customerId } });
  }

  // RN-11: la solicitud debe ejecutarse dentro de las 72 horas siguientes.
  // El cumplimiento del plazo lo garantiza `procesarSolicitudesPendientes`
  // (job programado, docs/arquitectura.md sección 8), no esta pantalla.
  async solicitarSupresion(customerId: number) {
    return this.prisma.deletionRequest.create({ data: { customerId } });
  }

  async listarSolicitudesSupresion(customerId: number) {
    return this.prisma.deletionRequest.findMany({ where: { customerId }, orderBy: { requestedAt: "desc" } });
  }

  // RN-11: ejecuta toda solicitud de supresión pendiente. Anonimiza el
  // registro de comportamiento ya escrito (RN-10 ya evita nuevos eventos con
  // identificador si el consentimiento no está activo) y revoca el
  // consentimiento vigente.
  async procesarSolicitudesPendientes(ahora = new Date()) {
    const pendientes = await this.prisma.deletionRequest.findMany({ where: { fulfilledAt: null } });
    for (const solicitud of pendientes) {
      await this.prisma.$transaction([
        this.prisma.behaviorEvent.updateMany({
          where: { customerId: solicitud.customerId },
          data: { customerId: null },
        }),
        // PE-03/PE-04: revocado o activo, la supresión dentro de 72h (RN-11)
        // siempre termina en el estado terminal Suprimido.
        this.prisma.consent.updateMany({
          where: { customerId: solicitud.customerId },
          data: { active: false, status: ConsentStatus.SUPRIMIDO },
        }),
        this.prisma.deletionRequest.update({ where: { id: solicitud.id }, data: { fulfilledAt: ahora } }),
      ]);
    }
    return pendientes.length;
  }

  // CU-06 Registro del comportamiento del cliente.
  async registrarEvento(customerId: number | null, dto: RegistrarEventoDto) {
    let idParaGuardar: number | null = null;
    if (customerId) {
      const consent = await this.prisma.consent.findUnique({ where: { customerId } });
      // RN-10: sin consentimiento activo, se registra sin identificador.
      idParaGuardar = consent?.active ? customerId : null;
    }
    return this.prisma.behaviorEvent.create({
      data: { customerId: idParaGuardar, type: dto.type, payload: dto.payload as any },
    });
  }

  private sinCredenciales(customer: Customer): Omit<Customer, "passwordHash"> {
    const { passwordHash, ...resto } = customer;
    return resto;
  }
}
