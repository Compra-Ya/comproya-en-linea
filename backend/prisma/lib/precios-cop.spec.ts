import { PrismaClient } from "@prisma/client";
import { resetDb } from "../../src/test-utils/reset-db";
import {
  costoDe,
  normalizarPreciosCop,
  precioCopDeUsd,
  precioSintetico,
  RANGOS_PRECIO,
  TASA_USD_COP,
} from "./precios-cop";
import { CATEGORIA_POR_GRUPO } from "./categorizar-sinteticos";

describe("precioCopDeUsd", () => {
  it("convierte con la tasa fija y redondea a la centena", () => {
    expect(TASA_USD_COP).toBe(4000);
    expect(precioCopDeUsd(8.99)).toBe(36_000);
    expect(precioCopDeUsd(1999.99)).toBe(8_000_000);
    expect(precioCopDeUsd(0.79)).toBe(3_200);
  });
});

describe("precioSintetico y costoDe", () => {
  it("es determinístico y cae dentro del rango y del paso de su tipo", () => {
    for (const [grupo, r] of Object.entries(RANGOS_PRECIO)) {
      for (const id of [1, 2, 99, 1234, 2403]) {
        const p = precioSintetico(id, grupo)!;
        expect(p).toBe(precioSintetico(id, grupo));
        expect(p).toBeGreaterThanOrEqual(r.min);
        expect(p).toBeLessThanOrEqual(r.max);
        expect((p - r.min) % r.paso).toBe(0);
      }
    }
  });

  it("hay rango de precio para todos los tipos con categoría asignada", () => {
    for (const grupo of Object.keys(CATEGORIA_POR_GRUPO)) expect(RANGOS_PRECIO[grupo]).toBeDefined();
  });

  it("RN-02: el costo nunca supera el precio y ronda entre el 55 % y el 80 %", () => {
    for (let id = 1; id <= 500; id++) {
      const precio = precioSintetico(id, "silla")!;
      const costo = costoDe(precio, id);
      expect(costo).toBeLessThanOrEqual(precio);
      expect(costo / precio).toBeGreaterThanOrEqual(0.549);
      expect(costo / precio).toBeLessThanOrEqual(0.801);
    }
  });

  it("devuelve null para un tipo desconocido", () => {
    expect(precioSintetico(1, "inexistente")).toBeNull();
  });
});

describe("normalizarPreciosCop (base de pruebas)", () => {
  const prisma = new PrismaClient();
  const usd = new Map([["Labial rojo|beauty", 12.99]]);
  beforeEach(async () => {
    await resetDb(prisma);
    const beauty = await prisma.category.create({ data: { name: "beauty" } });
    const muebles = await prisma.category.create({ data: { name: "furniture" } });
    await prisma.product.createMany({
      data: [
        { categoryId: beauty.id, homologatedCode: "P-1", name: "Labial rojo", source: "DUMMYJSON", cost: 5, digitalPrice: 12.99 },
        { categoryId: muebles.id, homologatedCode: "P-2", name: "Silla de madera suave", source: "SYNTHETIC", cost: 1, digitalPrice: 3_000_000 },
        { categoryId: muebles.id, homologatedCode: "CURA-1", name: "Silla curada", source: "SYNTHETIC", cost: 1, digitalPrice: 999_000 },
        { categoryId: beauty.id, homologatedCode: "P-4", name: "Producto de prueba", source: "DUMMYJSON", cost: 1, digitalPrice: 2 },
        { categoryId: beauty.id, homologatedCode: "P-5", name: "Sin fuente conocida", source: "DUMMYJSON", cost: 1, digitalPrice: 5 },
      ],
    });
  });
  afterAll(async () => {
    await resetDb(prisma);
    await prisma.$disconnect();
  });

  it("convierte a COP, no toca curados ni de prueba y es idempotente", async () => {
    const r = await normalizarPreciosCop(prisma, usd);
    expect(r).toEqual({ evaluados: 3, actualizados: 2, sinCambio: 0, sinFuente: 1 });
    const por = Object.fromEntries((await prisma.product.findMany()).map((p) => [p.homologatedCode, p]));
    expect(Number(por["P-1"].digitalPrice)).toBe(precioCopDeUsd(12.99));
    expect(Number(por["P-2"].digitalPrice)).toBeLessThanOrEqual(RANGOS_PRECIO.silla.max);
    expect(Number(por["P-2"].cost)).toBeLessThanOrEqual(Number(por["P-2"].digitalPrice));
    expect(Number(por["CURA-1"].digitalPrice)).toBe(999_000);
    expect(Number(por["P-4"].digitalPrice)).toBe(2);
    expect(await normalizarPreciosCop(prisma, usd)).toMatchObject({ actualizados: 0, sinCambio: 2 });
  });

  it("dryRun no escribe", async () => {
    expect((await normalizarPreciosCop(prisma, usd, true)).actualizados).toBe(2);
    expect(Number((await prisma.product.findUniqueOrThrow({ where: { homologatedCode: "P-1" } })).digitalPrice)).toBe(12.99);
  });
});
