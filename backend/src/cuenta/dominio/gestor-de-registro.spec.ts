import { Test } from "@nestjs/testing";
import { JwtModule } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service";
import { resetDb } from "../../test-utils/reset-db";
import { CuentaService } from "../cuenta.service";
import { AdaptadorLealtadSimulado } from "../puertos/adaptador-lealtad-simulado";
import { GestorDeRegistro } from "./gestor-de-registro";

describe("GestorDeRegistro (PR-01, PI-02)", () => {
  let prisma: PrismaService;
  let gestor: GestorDeRegistro;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: "test" })],
      providers: [CuentaService, AdaptadorLealtadSimulado, PrismaService, GestorDeRegistro],
    }).compile();
    prisma = moduleRef.get(PrismaService);
    gestor = moduleRef.get(GestorDeRegistro);
  });

  beforeEach(async () => resetDb(prisma));
  afterAll(async () => prisma.$disconnect());

  it("PR-01: documento duplicado — validarDuplicado() es verdadero, no se crea Cuenta y se lanza E-1", async () => {
    await gestor.registrarCliente({
      document: "CC2001",
      name: "Original",
      email: "original@test.com",
      password: "claveClave1",
    });

    await expect(gestor.validarDuplicado("CC2001")).resolves.toBe(true);

    const clientesAntes = await prisma.customer.count();
    await expect(
      gestor.registrarCliente({
        document: "CC2001",
        name: "Duplicado",
        email: "duplicado@test.com",
        password: "claveClave1",
      }),
    ).rejects.toThrow(/Ya existe una cuenta/);
    const clientesDespues = await prisma.customer.count();
    expect(clientesDespues).toBe(clientesAntes); // no se creó ninguna Cuenta nueva
  });

  it("PI-02: registrarCliente() crea Cliente y Cuenta relacionados 1:1", async () => {
    await expect(gestor.validarDuplicado("CC2002")).resolves.toBe(false);

    const { cliente, cuenta, accessToken } = await gestor.registrarCliente({
      document: "CC2002",
      name: "Nueva Cuenta",
      email: "nuevacuenta@test.com",
      password: "claveClave1",
    });

    expect(cliente.document).toBe("CC2002");
    expect(cuenta.estado).toBe("activa");
    expect(accessToken).toEqual(expect.any(String));

    const customerEnBd = await prisma.customer.findUnique({ where: { document: "CC2002" } });
    expect(customerEnBd?.id).toBe(cliente.id);
  });
});
