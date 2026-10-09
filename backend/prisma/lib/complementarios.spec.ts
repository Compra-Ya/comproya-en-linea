import { PrismaClient } from "@prisma/client";
import { resetDb } from "../../src/test-utils/reset-db";
import { sembrarComplementarios } from "./complementarios";

describe("sembrarComplementarios (base de pruebas)", () => {
  const prisma = new PrismaClient();
  beforeEach(async () => {
    await resetDb(prisma);
    const a = await prisma.category.create({ data: { name: "furniture" } });
    const b = await prisma.category.create({ data: { name: "laptops" } });
    const base = { cost: 10, digitalPrice: 20 };
    const filas = [];
    for (let i = 1; i <= 7; i++) filas.push({ ...base, categoryId: a.id, homologatedCode: `A-${i}`, name: `Mueble ${i}` });
    for (let i = 1; i <= 2; i++) filas.push({ ...base, categoryId: b.id, homologatedCode: `B-${i}`, name: `Portátil ${i}` });
    filas.push({ ...base, categoryId: a.id, homologatedCode: "A-OCULTO", name: "Oculto", published: false });
    await prisma.product.createMany({ data: filas });
  });
  afterAll(async () => {
    await resetDb(prisma);
    await prisma.$disconnect();
  });

  it("deja hasta 4 sugerencias por producto, sin sí mismo y solo con productos publicados", async () => {
    await sembrarComplementarios(prisma);
    const todos = await prisma.complementaryProduct.findMany({ include: { suggestedProduct: true } });
    const porProducto = new Map<number, number[]>();
    for (const c of todos) porProducto.set(c.productId, [...(porProducto.get(c.productId) ?? []), c.suggestedProductId]);
    expect(porProducto.size).toBe(9); // los 9 publicados; el oculto no recibe sugerencias
    for (const [productId, sugeridos] of porProducto) {
      expect(sugeridos).toHaveLength(4);
      expect(new Set(sugeridos).size).toBe(4);
      expect(sugeridos).not.toContain(productId);
    }
    expect(todos.every((c) => c.suggestedProduct.published)).toBe(true);
  });

  it("completa con otras categorías cuando la propia es chica", async () => {
    await sembrarComplementarios(prisma);
    const portatil = await prisma.product.findUniqueOrThrow({ where: { homologatedCode: "B-1" } });
    const sugeridos = await prisma.complementaryProduct.findMany({ where: { productId: portatil.id }, include: { suggestedProduct: true } });
    expect(sugeridos).toHaveLength(4);
    expect(sugeridos.filter((s) => s.suggestedProduct.homologatedCode.startsWith("B-"))).toHaveLength(1);
  });

  it("es idempotente y respeta lo que ya estaba curado", async () => {
    const [m1, m2] = await prisma.product.findMany({ where: { homologatedCode: { in: ["A-1", "A-2"] } }, orderBy: { homologatedCode: "asc" } });
    await prisma.complementaryProduct.create({ data: { productId: m1.id, suggestedProductId: m2.id, position: 0 } });
    const primera = await sembrarComplementarios(prisma);
    const total = await prisma.complementaryProduct.count();
    const segunda = await sembrarComplementarios(prisma);
    expect(segunda.filasNuevas).toBe(0);
    expect(await prisma.complementaryProduct.count()).toBe(total);
    expect(primera.filasNuevas).toBeGreaterThan(0);
    expect((await prisma.complementaryProduct.findFirstOrThrow({ where: { productId: m1.id, position: 0 } })).suggestedProductId).toBe(m2.id);
  });

  it("dryRun no escribe", async () => {
    expect((await sembrarComplementarios(prisma, true)).filasNuevas).toBeGreaterThan(0);
    expect(await prisma.complementaryProduct.count()).toBe(0);
  });
});
