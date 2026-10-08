// Precios del catálogo en pesos colombianos (COP).
//  - DummyJSON trae precios en dólares: se convierten con una tasa fija y documentada.
//  - Los productos sintéticos tenían un precio al azar (un atún a $3.498.823): se les asigna un
//    precio plausible dentro del rango de su tipo, calculado a partir del id (determinístico).
// Todo se recalcula desde la fuente (el precio en USD original o el id), así que correrlo dos veces
// da el mismo resultado. RN-02: el costo nunca supera el precio digital.
import type { PrismaClient } from "@prisma/client";
import { grupoPorNombre } from "./product-images";

/** Pesos por dólar, fijos para que la siembra sea reproducible. Cambiar aquí si se quiere otra tasa. */
export const TASA_USD_COP = 4000;

/** Convierte un precio en USD a COP redondeado a la centena. */
export function precioCopDeUsd(usd: number): number {
  return Math.round((usd * TASA_USD_COP) / 100) * 100;
}

interface RangoPrecio {
  min: number;
  max: number;
  paso: number;
}

/** Rango de precio (COP) por tipo de producto sintético. */
export const RANGOS_PRECIO: Record<string, RangoPrecio> = {
  silla: { min: 89_000, max: 650_000, paso: 10_000 },
  mesa: { min: 120_000, max: 900_000, paso: 10_000 },
  computador: { min: 1_400_000, max: 5_500_000, paso: 50_000 },
  teclado: { min: 45_000, max: 420_000, paso: 5_000 },
  mouse: { min: 25_000, max: 260_000, paso: 5_000 },
  guantes: { min: 15_000, max: 180_000, paso: 1_000 },
  bicicleta: { min: 450_000, max: 2_800_000, paso: 10_000 },
  balon: { min: 35_000, max: 220_000, paso: 1_000 },
  pantalon: { min: 120_000, max: 650_000, paso: 10_000 },
  gorra: { min: 40_000, max: 180_000, paso: 1_000 },
  camiseta: { min: 30_000, max: 150_000, paso: 1_000 },
  tenis: { min: 120_000, max: 550_000, paso: 10_000 },
  toallas: { min: 25_000, max: 120_000, paso: 1_000 },
  jabon: { min: 3_000, max: 18_000, paso: 500 },
  carro: { min: 60_000, max: 450_000, paso: 5_000 },
  salchichas: { min: 8_000, max: 28_000, paso: 500 },
  ensalada: { min: 6_000, max: 20_000, paso: 500 },
  atun: { min: 4_500, max: 16_000, paso: 500 },
  pescado: { min: 12_000, max: 48_000, paso: 500 },
  pizza: { min: 15_000, max: 60_000, paso: 500 },
  tocino: { min: 9_000, max: 32_000, paso: 500 },
  pollo: { min: 14_000, max: 45_000, paso: 500 },
  papas: { min: 3_000, max: 12_000, paso: 500 },
  queso: { min: 7_000, max: 38_000, paso: 500 },
};

/** Mezcla determinística del id (hash multiplicativo de Knuth) a un entero sin signo. */
function mezclar(id: number, sal: number): number {
  return Math.imul(id + sal, 2654435761) >>> 0;
}

export function precioSintetico(id: number, grupo: string): number | null {
  const r = RANGOS_PRECIO[grupo];
  if (!r) return null;
  const pasos = Math.floor((r.max - r.min) / r.paso);
  return r.min + (mezclar(id, 17) % (pasos + 1)) * r.paso;
}

/** Costo entre el 55 % y el 80 % del precio (margen comercial válido sin aprobación, RN-02). */
export function costoDe(precio: number, id: number): number {
  const factor = 0.55 + (mezclar(id, 91) % 26) / 100;
  return Math.round(precio * factor);
}

const clave = (nombre: string, categoria: string) => `${nombre}|${categoria}`;

export interface ResultadoPrecios {
  evaluados: number;
  actualizados: number;
  sinCambio: number;
  sinFuente: number;
}

/**
 * Deja el catálogo en COP. `usdPorProducto` es el precio original de DummyJSON por "nombre|categoría",
 * con el nombre ya traducido. Los productos curados y los de prueba no se tocan.
 */
export async function normalizarPreciosCop(
  prisma: Pick<PrismaClient, "product">,
  usdPorProducto: Map<string, number>,
  dryRun = false
): Promise<ResultadoPrecios> {
  const productos = await prisma.product.findMany({
    where: { NOT: [{ homologatedCode: { startsWith: "CURA" } }, { name: { startsWith: "Producto de prueba" } }] },
    select: { id: true, name: true, source: true, digitalPrice: true, cost: true, category: { select: { name: true } } },
    orderBy: { id: "asc" },
  });
  const res: ResultadoPrecios = { evaluados: productos.length, actualizados: 0, sinCambio: 0, sinFuente: 0 };
  for (const p of productos) {
    let precio: number | null = null;
    if (p.source === "DUMMYJSON") {
      const usd = usdPorProducto.get(clave(p.name, p.category.name));
      precio = usd == null ? null : precioCopDeUsd(usd);
    } else {
      const grupo = grupoPorNombre(p.name);
      precio = grupo ? precioSintetico(p.id, grupo) : null;
    }
    if (precio == null) {
      res.sinFuente++;
      continue;
    }
    const costo = costoDe(precio, p.id);
    if (Number(p.digitalPrice) === precio && Number(p.cost) === costo) {
      res.sinCambio++;
      continue;
    }
    if (!dryRun) await prisma.product.update({ where: { id: p.id }, data: { digitalPrice: precio, cost: costo } });
    res.actualizados++;
  }
  return res;
}
