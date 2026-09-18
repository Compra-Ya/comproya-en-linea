import { Test } from "@nestjs/testing";
import { PrismaService } from "../../prisma/prisma.service";
import { resetDb } from "../../test-utils/reset-db";
import { CatalogoService } from "../catalogo.service";
import { AdaptadorErpSimulado } from "../puertos/adaptador-erp-simulado";
import { VerificadorDeDisponibilidad } from "./verificador-de-disponibilidad";

describe("VerificadorDeDisponibilidad (PR-05)", () => {
  let prisma: PrismaService;
  let verificador: VerificadorDeDisponibilidad;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [CatalogoService, AdaptadorErpSimulado, PrismaService, VerificadorDeDisponibilidad],
    }).compile();
    prisma = moduleRef.get(PrismaService);
    verificador = moduleRef.get(VerificadorDeDisponibilidad);
  });

  beforeEach(async () => resetDb(prisma));
  afterAll(async () => prisma.$disconnect());

  it("PR-05: sucursal sin sincronizar hace más de 15 minutos -> validarSincronizacion() falso, sin afectar otras sucursales", async () => {
    const category = await prisma.category.create({ data: { name: "Cat" } });
    const product = await prisma.product.create({
      data: { homologatedCode: "VDD-000001", name: "P", categoryId: category.id, cost: 1, digitalPrice: 2 },
    });
    const sucursalDesincronizada = await prisma.branch.create({ data: { name: "Desincronizada", city: "Bogotá" } });
    const sucursalSincronizada = await prisma.branch.create({ data: { name: "Sincronizada", city: "Bogotá" } });
    const haceVeinteMinutos = new Date(Date.now() - 20 * 60 * 1000);
    await prisma.availability.create({
      data: {
        productId: product.id,
        branchId: sucursalDesincronizada.id,
        erpUnits: 20,
        safetyThreshold: 5,
        reservedUnits: 0,
        syncedAt: haceVeinteMinutos,
      },
    });
    await prisma.availability.create({
      data: {
        productId: product.id,
        branchId: sucursalSincronizada.id,
        erpUnits: 20,
        safetyThreshold: 5,
        reservedUnits: 0,
        syncedAt: new Date(),
      },
    });

    await expect(verificador.validarSincronizacion(product.id, sucursalDesincronizada.id)).resolves.toBe(false);
    // El resto del flujo (otra sucursal) sigue disponible sin verse afectado.
    await expect(verificador.validarSincronizacion(product.id, sucursalSincronizada.id)).resolves.toBe(true);
  });
});
