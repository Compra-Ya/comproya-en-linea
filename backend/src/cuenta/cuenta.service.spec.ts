import { Test } from "@nestjs/testing";
import { JwtModule } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { resetDb } from "../test-utils/reset-db";
import { CuentaService } from "./cuenta.service";
import { AdaptadorLealtadSimulado } from "./puertos/adaptador-lealtad-simulado";

describe("CuentaService (E-1, RN-10, RN-11)", () => {
  let prisma: PrismaService;
  let cuenta: CuentaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: "test" })],
      providers: [CuentaService, AdaptadorLealtadSimulado, PrismaService],
    }).compile();
    prisma = moduleRef.get(PrismaService);
    cuenta = moduleRef.get(CuentaService);
  });

  beforeEach(async () => resetDb(prisma));
  afterAll(async () => prisma.$disconnect());

  it("E-1: rechaza el registro cuando el documento ya existe", async () => {
    await cuenta.registrar({ document: "CC999", name: "Uno", email: "uno@test.com", password: "claveClave1" });
    await expect(
      cuenta.registrar({ document: "CC999", name: "Dos", email: "dos@test.com", password: "claveClave1" }),
    ).rejects.toThrow(/Ya existe una cuenta/);
  });

  it("RN-10: sin consentimiento activo, el evento se registra sin identificador de cliente", async () => {
    const { customer } = await cuenta.registrar({
      document: "CC1000",
      name: "Sin consentimiento",
      email: "sinconsentimiento@test.com",
      password: "claveClave1",
    });
    // El registro deja el consentimiento pendiente (active: false) hasta que
    // CU-05 lo decida — aquí se simula que decide rechazarlo explícitamente.
    await cuenta.decidirConsentimiento(customer.id, { activo: false });

    const evento = await cuenta.registrarEvento(customer.id, { type: "vio_producto", payload: { productId: 1 } });
    expect(evento.customerId).toBeNull();
  });

  it("RN-10: con consentimiento activo, el evento se registra con el identificador del cliente", async () => {
    const { customer } = await cuenta.registrar({
      document: "CC1001",
      name: "Con consentimiento",
      email: "conconsentimiento@test.com",
      password: "claveClave1",
    });
    await cuenta.decidirConsentimiento(customer.id, { activo: true });

    const evento = await cuenta.registrarEvento(customer.id, { type: "vio_producto", payload: { productId: 1 } });
    expect(evento.customerId).toBe(customer.id);
  });

  it("RN-11: una solicitud de supresión se ejecuta y anonimiza el comportamiento ya registrado", async () => {
    const { customer } = await cuenta.registrar({
      document: "CC1002",
      name: "Pide supresión",
      email: "supresion@test.com",
      password: "claveClave1",
    });
    await cuenta.decidirConsentimiento(customer.id, { activo: true });
    const evento = await cuenta.registrarEvento(customer.id, { type: "vio_producto", payload: {} });
    expect(evento.customerId).toBe(customer.id);

    const solicitud = await cuenta.solicitarSupresion(customer.id);
    expect(solicitud.fulfilledAt).toBeNull();

    // El job (SupresionJob) llama a esto cada hora; en la prueba se invoca
    // directamente para no depender del reloj real, dentro del plazo de 72 h.
    const procesadas = await cuenta.procesarSolicitudesPendientes();
    expect(procesadas).toBe(1);

    const eventoActualizado = await prisma.behaviorEvent.findUnique({ where: { id: evento.id } });
    expect(eventoActualizado?.customerId).toBeNull();
    const solicitudFinal = await prisma.deletionRequest.findUnique({ where: { id: solicitud.id } });
    expect(solicitudFinal?.fulfilledAt).not.toBeNull();
  });
});
