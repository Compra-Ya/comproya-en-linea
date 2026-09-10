import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Customer } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { AdaptadorLealtadSimulado } from "./puertos/adaptador-lealtad-simulado";
import { RegistrarClienteDto } from "./dto/registrar-cliente.dto";
import { LoginDto } from "./dto/login.dto";
import { DecidirConsentimientoDto } from "./dto/decidir-consentimiento.dto";
import { RegistrarEventoDto } from "./dto/registrar-evento.dto";

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

  // CU-05 Administración del consentimiento — activar/revocar en ≤ 2
  // interacciones (canon, sección 10): una sola llamada a este endpoint.
  async decidirConsentimiento(customerId: number, dto: DecidirConsentimientoDto) {
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

    return this.prisma.$transaction(async (tx) => {
      const consent = await tx.consent.upsert({
        where: { customerId },
        update: { active: dto.activo },
        create: { customerId, active: dto.activo },
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
        this.prisma.consent.updateMany({ where: { customerId: solicitud.customerId }, data: { active: false } }),
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
