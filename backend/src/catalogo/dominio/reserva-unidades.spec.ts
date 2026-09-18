import { Test } from "@nestjs/testing";
import { PrismaService } from "../../prisma/prisma.service";
import { resetDb } from "../../test-utils/reset-db";
import { CatalogoService } from "../catalogo.service";
import { AdaptadorErpSimulado } from "../puertos/adaptador-erp-simulado";
import { ReservaUnidades } from "./reserva-unidades";

describe("ReservaUnidades (PR-06)", () => {
  let prisma: PrismaService;
  let reservaUnidades: ReservaUnidades;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [CatalogoService, AdaptadorErpSimulado, PrismaService, ReservaUnidades],
    }).compile();
    prisma = moduleRef.get(PrismaService);
    reservaUnidades = moduleRef.get(ReservaUnidades);
  });

  beforeEach(async () => resetDb(prisma));
  afterAll(async () => prisma.$disconnect());

  it("PR-06: cantidad solicitada mayor a las unidades disponibles (RN-03) -> reservar() devuelve falso, sin bloquear el cobro", async () => {
    const category = await prisma.category.create({ data: { name: "Cat" } });
    const product = await prisma.product.create({
      data: { homologatedCode: "RU-000001", name: "P", categoryId: category.id, cost: 1, digitalPrice: 2 },
    });
    const branch = await prisma.branch.create({ data: { name: "Sucursal", city: "Bogotá" } });
    // RN-03: unidades disponibles = 20 - 5 - 0 = 15.
    await prisma.availability.create({
      data: { productId: product.id, branchId: branch.id, erpUnits: 20, safetyThreshold: 5, reservedUnits: 0, syncedAt: new Date() },
    });

    const resultado = await reservaUnidades.reservar(product.id, branch.id, 999);

    expect(resultado).toBe(false); // no lanza excepción: el llamador decide notificar E-1 sin bloquear el cobro
    const disponibilidad = await prisma.availability.findFirst({ where: { productId: product.id } });
    expect(disponibilidad?.reservedUnits).toBe(0); // no se reservó nada
  });

  it("reservar() devuelve el id de disponibilidad cuando sí hay unidades suficientes", async () => {
    const category = await prisma.category.create({ data: { name: "Cat2" } });
    const product = await prisma.product.create({
      data: { homologatedCode: "RU-000002", name: "P2", categoryId: category.id, cost: 1, digitalPrice: 2 },
    });
    const branch = await prisma.branch.create({ data: { name: "Sucursal2", city: "Bogotá" } });
    await prisma.availability.create({
      data: { productId: product.id, branchId: branch.id, erpUnits: 20, safetyThreshold: 5, reservedUnits: 0, syncedAt: new Date() },
    });

    const resultado = await reservaUnidades.reservar(product.id, branch.id, 3);

    expect(resultado).not.toBe(false);
    const disponibilidad = await prisma.availability.findFirst({ where: { productId: product.id } });
    expect(disponibilidad?.reservedUnits).toBe(3);
  });
});
