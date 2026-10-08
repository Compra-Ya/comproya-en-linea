import { PrismaClient } from "@prisma/client";
import { resetDb } from "../../src/test-utils/reset-db";
import { categoriaDeProducto, categorizarSinteticos } from "./categorizar-sinteticos";

describe("categoriaDeProducto", () => {
  it("usa el tipo del producto, en inglés o ya traducido", () => {
    expect(categoriaDeProducto("Soft Wooden Chair")).toBe("furniture");
    expect(categoriaDeProducto("Silla de madera suave")).toBe("furniture");
    expect(categoriaDeProducto("Atún de bronce reciclado")).toBe("groceries");
    expect(categoriaDeProducto("Balón de algodón artesanal")).toBe("sports-accessories");
    expect(categoriaDeProducto("Papas fritas de caucho deliciosas")).toBe("groceries");
  });
  it("devuelve null si no reconoce el tipo", () => {
    expect(categoriaDeProducto("Labial rojo")).toBeNull();
  });
});

describe("categorizarSinteticos (base de pruebas)", () => {
  const prisma = new PrismaClient();
  let muebles: number;
  let alimentos: number;
  beforeEach(async () => {
    await resetDb(prisma);
    muebles = (await prisma.category.create({ data: { name: "furniture" } })).id;
    alimentos = (await prisma.category.create({ data: { name: "groceries" } })).id;
    const base = { cost: 10, digitalPrice: 20 };
    await prisma.product.createMany({
      data: [
        { ...base, categoryId: muebles, homologatedCode: "C-1", name: "Atún de bronce reciclado", source: "SYNTHETIC" },
        { ...base, categoryId: alimentos, homologatedCode: "C-2", name: "Silla de madera suave", source: "SYNTHETIC" },
        { ...base, categoryId: muebles, homologatedCode: "C-3", name: "Mesa de madera suave", source: "SYNTHETIC" },
        { ...base, categoryId: alimentos, homologatedCode: "CURA-9", name: "Silla curada", source: "SYNTHETIC" },
        { ...base, categoryId: alimentos, homologatedCode: "C-5", name: "Silla de DummyJSON", source: "DUMMYJSON" },
      ],
    });
  });
  afterAll(async () => {
    await resetDb(prisma);
    await prisma.$disconnect();
  });

  it("reasigna solo sintéticos no curados y es idempotente", async () => {
    expect(await categorizarSinteticos(prisma)).toMatchObject({ evaluados: 3, reasignados: 2, sinCambio: 1 });
    const porCodigo = Object.fromEntries((await prisma.product.findMany()).map((p) => [p.homologatedCode, p.categoryId]));
    expect(porCodigo).toEqual({ "C-1": alimentos, "C-2": muebles, "C-3": muebles, "CURA-9": alimentos, "C-5": alimentos });
    expect(await categorizarSinteticos(prisma)).toMatchObject({ reasignados: 0, sinCambio: 3 });
  });

  it("dryRun no escribe", async () => {
    expect((await categorizarSinteticos(prisma, true)).reasignados).toBe(2);
    expect((await prisma.product.findUniqueOrThrow({ where: { homologatedCode: "C-1" } })).categoryId).toBe(muebles);
  });
});
