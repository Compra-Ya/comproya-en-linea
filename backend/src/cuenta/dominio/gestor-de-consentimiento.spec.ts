import { Test } from "@nestjs/testing";
import { JwtModule } from "@nestjs/jwt";
import { ConsentStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { resetDb } from "../../test-utils/reset-db";
import { CuentaService } from "../cuenta.service";
import { AdaptadorLealtadSimulado } from "../puertos/adaptador-lealtad-simulado";
import { GestorDeConsentimiento } from "./gestor-de-consentimiento";
import { POLITICA_DATOS_VIGENTE } from "./politica-datos";

describe("GestorDeConsentimiento (PR-02, PR-03, PR-04, PE-01..05, PI-03)", () => {
  let prisma: PrismaService;
  let cuentaService: CuentaService;
  let gestor: GestorDeConsentimiento;
  let contador = 0;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: "test" })],
      providers: [CuentaService, AdaptadorLealtadSimulado, PrismaService, GestorDeConsentimiento],
    }).compile();
    prisma = moduleRef.get(PrismaService);
    cuentaService = moduleRef.get(CuentaService);
    gestor = moduleRef.get(GestorDeConsentimiento);
  });

  beforeEach(async () => {
    await resetDb(prisma);
    contador = 0;
  });
  afterAll(async () => prisma.$disconnect());

  // Documento nuevo, listo para decidir sobre la política — el registro
  // (CU-04) siempre deja el consentimiento en Pendiente (RN-10 por defecto).
  async function clienteNuevo(): Promise<number> {
    contador++;
    const { customer } = await cuentaService.registrar({
      document: `CC30${contador.toString().padStart(2, "0")}`,
      name: `Cliente ${contador}`,
      email: `cliente${contador}@test.com`,
      password: "claveClave1",
    });
    return customer.id;
  }

  it("PR-02 / PE-... : documento nuevo, cliente rechaza la política — Consentimiento queda inactivo y RN-10 anonimiza", async () => {
    const customerId = await clienteNuevo();

    const consentimiento = await gestor.revocarConsentimiento(customerId);
    expect(consentimiento.status).toBe(ConsentStatus.REVOCADO);

    const evento = await cuentaService.registrarEvento(customerId, { type: "vio_producto", payload: {} });
    expect(evento.customerId).toBeNull(); // RN-10: sin consentimiento activo, sin id_cliente
  });

  it("PR-03 / PI-03: documento nuevo, acepta política y trae identificador de lealtad válido", async () => {
    const customerId = await clienteNuevo();

    const consentimiento = await gestor.otorgarConsentimiento(customerId, "LEALTAD-123456");

    expect(consentimiento.status).toBe(ConsentStatus.ACTIVO);
    expect(consentimiento.politicaDatosVersion).toBe(POLITICA_DATOS_VIGENTE.version); // PI-03
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    expect(customer?.loyaltyId).toBe("LEALTAD-123456"); // IdentificadorLealtad vinculado
  });

  it("PR-04: documento nuevo, acepta política sin identificador de lealtad", async () => {
    const customerId = await clienteNuevo();

    const consentimiento = await gestor.otorgarConsentimiento(customerId);

    expect(consentimiento.status).toBe(ConsentStatus.ACTIVO);
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    expect(customer?.loyaltyId).toBeNull(); // no se crea IdentificadorLealtad
  });

  it("PE-01: Pendiente + otorgar() -> Activo", async () => {
    const customerId = await clienteNuevo();
    const inicial = await gestor.consultarConsentimiento(customerId);
    expect(inicial?.status).toBe(ConsentStatus.PENDIENTE);

    const resultado = await gestor.otorgarConsentimiento(customerId);
    expect(resultado.status).toBe(ConsentStatus.ACTIVO);
  });

  it("PE-02: Activo + revocar() -> Revocado", async () => {
    const customerId = await clienteNuevo();
    await gestor.otorgarConsentimiento(customerId);

    const resultado = await gestor.revocarConsentimiento(customerId);
    expect(resultado.status).toBe(ConsentStatus.REVOCADO);
  });

  it("PE-03: Revocado + ejecutar supresión dentro de 72h (RN-11) -> Suprimido", async () => {
    const customerId = await clienteNuevo();
    await gestor.revocarConsentimiento(customerId);

    const solicitud = await gestor.solicitarSupresion(customerId);
    expect(solicitud.estaDentroDePlazo()).toBe(true);
    await gestor.ejecutarSupresionesPendientes();

    const resultado = await gestor.consultarConsentimiento(customerId);
    expect(resultado?.status).toBe(ConsentStatus.SUPRIMIDO);
  });

  it("PE-04: Activo + solicitud directa de supresión dentro de 72h (RN-11) -> Suprimido", async () => {
    const customerId = await clienteNuevo();
    await gestor.otorgarConsentimiento(customerId);

    await gestor.solicitarSupresion(customerId);
    await gestor.ejecutarSupresionesPendientes();

    const resultado = await gestor.consultarConsentimiento(customerId);
    expect(resultado?.status).toBe(ConsentStatus.SUPRIMIDO);
  });

  it("PE-05: Suprimido + otorgar() (transición no declarada) -> el sistema rechaza, sin cambio de estado", async () => {
    const customerId = await clienteNuevo();
    await gestor.otorgarConsentimiento(customerId);
    await gestor.solicitarSupresion(customerId);
    await gestor.ejecutarSupresionesPendientes();
    const suprimido = await gestor.consultarConsentimiento(customerId);
    expect(suprimido?.status).toBe(ConsentStatus.SUPRIMIDO);
    expect(suprimido?.puedeTransicionarA(ConsentStatus.ACTIVO)).toBe(false);

    await expect(gestor.otorgarConsentimiento(customerId)).rejects.toThrow(/ya suprimido/);

    const final = await gestor.consultarConsentimiento(customerId);
    expect(final?.status).toBe(ConsentStatus.SUPRIMIDO); // sin cambio de estado
  });
});
