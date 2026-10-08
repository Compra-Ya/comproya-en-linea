// La siembra asigna a cada producto sintético una categoría al azar, así que "Atún de bronce"
// quedaba en "Muebles". Este reasignador lleva cada producto a la categoría que le corresponde por
// su tipo (silla, atún, balón…), usando solo categorías que ya existen (las de DummyJSON): no se
// inventa taxonomía. Idempotente. Los productos curados y los de DummyJSON no se tocan.
// Nota: el código homologado conserva el prefijo de la categoría original (es solo un identificador).
import type { PrismaClient } from "@prisma/client";
import { grupoPorNombre } from "./product-images";

const COMIDA = "groceries";

/** Grupo de producto (de product-images.ts) -> nombre de categoría en la base. */
export const CATEGORIA_POR_GRUPO: Record<string, string> = {
  silla: "furniture",
  mesa: "furniture",
  computador: "laptops",
  teclado: "laptops",
  mouse: "laptops",
  guantes: "sports-accessories",
  bicicleta: "sports-accessories",
  balon: "sports-accessories",
  pantalon: "mens-shirts",
  gorra: "mens-shirts",
  camiseta: "mens-shirts",
  tenis: "mens-shoes",
  toallas: "home-decoration",
  jabon: "skin-care",
  carro: "vehicle",
  salchichas: COMIDA,
  ensalada: COMIDA,
  atun: COMIDA,
  pescado: COMIDA,
  pizza: COMIDA,
  tocino: COMIDA,
  pollo: COMIDA,
  papas: COMIDA,
  queso: COMIDA,
};

export function categoriaDeProducto(nombre: string): string | null {
  const grupo = grupoPorNombre(nombre);
  return grupo ? (CATEGORIA_POR_GRUPO[grupo] ?? null) : null;
}

export interface ResultadoCategorizacion {
  evaluados: number;
  reasignados: number;
  sinCambio: number;
  sinCategoriaDestino: number;
}

export async function categorizarSinteticos(
  prisma: Pick<PrismaClient, "product" | "category">,
  dryRun = false
): Promise<ResultadoCategorizacion> {
  const categorias = await prisma.category.findMany({ select: { id: true, name: true } });
  const idPorNombre = new Map(categorias.map((c) => [c.name, c.id]));
  const productos = await prisma.product.findMany({
    where: { source: "SYNTHETIC", NOT: { homologatedCode: { startsWith: "CURA" } } },
    select: { id: true, name: true, categoryId: true },
  });
  const res: ResultadoCategorizacion = { evaluados: productos.length, reasignados: 0, sinCambio: 0, sinCategoriaDestino: 0 };
  const idsPorDestino = new Map<number, number[]>();
  for (const p of productos) {
    const destino = categoriaDeProducto(p.name);
    if (!destino) {
      res.sinCambio++;
      continue;
    }
    const destinoId = idPorNombre.get(destino);
    if (destinoId == null) {
      res.sinCategoriaDestino++;
      continue;
    }
    if (p.categoryId === destinoId) {
      res.sinCambio++;
      continue;
    }
    res.reasignados++;
    idsPorDestino.set(destinoId, [...(idsPorDestino.get(destinoId) ?? []), p.id]);
  }
  if (!dryRun) {
    for (const [categoryId, ids] of idsPorDestino) {
      await prisma.product.updateMany({ where: { id: { in: ids } }, data: { categoryId } });
    }
  }
  return res;
}
