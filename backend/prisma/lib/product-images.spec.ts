import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { resetDb } from "../../src/test-utils/reset-db";
import {
  aplicarImagenes,
  elegirImagen,
  filasACsv,
  grupoPorNombre,
  publicarSoloConImagen,
  ManifiestoImagenes,
  FuenteImagen,
} from "./product-images";

const fuente = (imageUrl: string, tienda = "Alkosto"): FuenteImagen => ({
  imageUrl,
  tienda,
  paginaUrl: `https://tienda.test/${imageUrl}`,
  imagenUrl: `https://cdn.test/${imageUrl}`,
  descargadoEn: "2026-10-08T00:00:00.000Z",
});

const manifiesto: ManifiestoImagenes = {
  generadoEn: "2026-10-08T00:00:00.000Z",
  grupos: { silla: [fuente("/productos/retail/silla-01.webp"), fuente("/productos/retail/silla-02.webp")] },
  dummyjson: { "Red Lipstick": fuente("/productos/dummyjson/9.webp", "DummyJSON") },
  curados: { "CURA-000001": fuente("/productos/curados/refrigerador.webp", "Unsplash") },
};

describe("grupoPorNombre", () => {
  it("usa el sustantivo final del nombre sintético", () => {
    expect(grupoPorNombre("Soft Wooden Chair")).toBe("silla");
  });
  it("asigna grupo a Car y Pants", () => {
    expect(grupoPorNombre("Rustic Steel Car")).toBe("carro");
    expect(grupoPorNombre("Sleek Cotton Pants")).toBe("pantalon");
  });
  it("asigna grupo a la comida y a Soap", () => {
    expect(grupoPorNombre("Fresh Ceramic Chips")).toBe("papas");
    expect(grupoPorNombre("Tasty Metal Tuna")).toBe("atun");
    expect(grupoPorNombre("Handmade Soap")).toBe("jabon");
  });
  it("devuelve null para sustantivos desconocidos", () => {
    expect(grupoPorNombre("Producto de prueba")).toBeNull();
  });
});

describe("elegirImagen", () => {
  it("prioriza curados, luego DummyJSON por título, luego el grupo por id", () => {
    expect(elegirImagen({ id: 1, name: "X", homologatedCode: "CURA-000001", source: "SYNTHETIC" }, manifiesto)?.tienda).toBe("Unsplash");
    expect(elegirImagen({ id: 2, name: "Red Lipstick", homologatedCode: "B-1", source: "DUMMYJSON" }, manifiesto)?.tienda).toBe("DummyJSON");
    expect(elegirImagen({ id: 4, name: "Soft Chair", homologatedCode: "C-1", source: "SYNTHETIC" }, manifiesto)?.imageUrl).toBe("/productos/retail/silla-01.webp");
    expect(elegirImagen({ id: 5, name: "Soft Chair", homologatedCode: "C-2", source: "SYNTHETIC" }, manifiesto)?.imageUrl).toBe("/productos/retail/silla-02.webp");
  });
  it("sin foto fiable devuelve null (el frontend muestra el placeholder)", () => {
    expect(elegirImagen({ id: 6, name: "Tasty Metal Tuna", homologatedCode: "D-1", source: "SYNTHETIC" }, manifiesto)).toBeNull();
    expect(elegirImagen({ id: 7, name: "Otro", homologatedCode: "D-2", source: "DUMMYJSON" }, manifiesto)).toBeNull();
  });
});

describe("aplicarImagenes (base de pruebas)", () => {
  const prisma = new PrismaClient();
  beforeEach(async () => {
    await resetDb(prisma);
    const cat = await prisma.category.create({ data: { name: "furniture" } });
    const base = { categoryId: cat.id, cost: 10, digitalPrice: 20 };
    await prisma.product.createMany({
      data: [
        { ...base, homologatedCode: "F-1", name: "Soft Wooden Chair", source: "SYNTHETIC" },
        { ...base, homologatedCode: "F-2", name: "Tasty Metal Tuna", source: "SYNTHETIC" },
        { ...base, homologatedCode: "F-3", name: "Red Lipstick", source: "DUMMYJSON" },
      ],
    });
  });
  afterAll(async () => {
    await resetDb(prisma);
    await prisma.$disconnect();
  });

  it("es idempotente: la segunda corrida no actualiza nada y deja sin tocar al producto sin foto", async () => {
    const primera = await aplicarImagenes(prisma, manifiesto);
    expect(primera).toMatchObject({ evaluados: 3, actualizados: 2, sinImagen: 1 });
    const segunda = await aplicarImagenes(prisma, manifiesto);
    expect(segunda).toMatchObject({ actualizados: 0, sinCambio: 2, sinImagen: 1 });
    const atun = await prisma.product.findUnique({ where: { homologatedCode: "F-2" } });
    expect(atun?.imageUrl).toBeNull();
  });

  it("dryRun no escribe", async () => {
    const r = await aplicarImagenes(prisma, manifiesto, true);
    expect(r.actualizados).toBe(2);
    expect(await prisma.product.count({ where: { imageUrl: { not: null } } })).toBe(0);
  });

  it("cada producto con imagen produce una fila de trazabilidad en el CSV", async () => {
    const r = await aplicarImagenes(prisma, manifiesto);
    const lineas = filasACsv(r.filasOrigen).trim().split("\n");
    expect(lineas).toHaveLength(1 + r.filasOrigen.length);
    expect(lineas[0]).toContain("tiendaOrigen");
  });
});

describe("publicarSoloConImagen (base de pruebas)", () => {
  const prisma = new PrismaClient();
  beforeEach(async () => {
    await resetDb(prisma);
    const cat = await prisma.category.create({ data: { name: "furniture" } });
    const base = { categoryId: cat.id, cost: 10, digitalPrice: 20 };
    await prisma.product.createMany({
      data: [
        { ...base, homologatedCode: "P-1", name: "Con foto despublicado", imageUrl: "/productos/a.webp", published: false },
        { ...base, homologatedCode: "P-2", name: "Con foto publicado", imageUrl: "/productos/b.webp", published: true },
        { ...base, homologatedCode: "P-3", name: "Sin foto publicado", published: true },
      ],
    });
  });
  afterAll(async () => {
    await resetDb(prisma);
    await prisma.$disconnect();
  });

  it("publica los que tienen foto, despublica los que no y es idempotente", async () => {
    const r = await publicarSoloConImagen(prisma);
    expect(r).toEqual({ total: 3, publicadosAhora: 1, despublicadosAhora: 1, publicadosFinal: 2 });
    expect((await prisma.product.findMany({ where: { published: true } })).every((p) => p.imageUrl)).toBe(true);
    expect(await publicarSoloConImagen(prisma)).toMatchObject({ publicadosAhora: 0, despublicadosAhora: 0, publicadosFinal: 2 });
  });

  it("dryRun informa el resultado sin escribir", async () => {
    const r = await publicarSoloConImagen(prisma, true);
    expect(r.publicadosFinal).toBe(2);
    expect(await prisma.product.count({ where: { published: true } })).toBe(2); // sin cambios
  });
});

describe("manifiesto real", () => {
  const ruta = join(__dirname, "../data/imagenes-manifest.json");
  const real: ManifiestoImagenes = JSON.parse(readFileSync(ruta, "utf8"));
  const todas = [...Object.values(real.grupos).flat(), ...Object.values(real.dummyjson), ...Object.values(real.curados)];

  it("cada imagen del manifiesto existe en frontend/public y tiene origen completo", () => {
    expect(todas.length).toBeGreaterThan(0);
    for (const f of todas) {
      expect(existsSync(join(__dirname, "../../../frontend/public", f.imageUrl))).toBe(true);
      expect(f.tienda && f.paginaUrl && f.imagenUrl && f.descargadoEn).toBeTruthy();
    }
  });
});
