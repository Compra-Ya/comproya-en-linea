// Siembra de productos complementarios (CU-08, hasta 4 por producto, C-05). En producción los curaría el
// Analista de Marketing; para la demo y la prueba de usabilidad se sugieren, de forma determinística, productos
// publicados de la misma categoría (y, si la categoría es chica, de otras). Solo agrega a los productos que
// todavía no tienen 4: no pisa lo que ya se haya curado. Idempotente.
import type { PrismaClient } from "@prisma/client";

const POR_PRODUCTO = 4;

function mezclar(id: number): number {
  return Math.imul(id + 31, 2654435761) >>> 0;
}

export interface ResultadoComplementarios {
  productos: number;
  conSugerencias: number;
  filasNuevas: number;
}

export async function sembrarComplementarios(
  prisma: Pick<PrismaClient, "product" | "complementaryProduct">,
  dryRun = false
): Promise<ResultadoComplementarios> {
  const publicados = await prisma.product.findMany({ where: { published: true }, select: { id: true, categoryId: true }, orderBy: { id: "asc" } });
  // Lo ya curado se respeta: no se vuelve a sugerir el mismo producto (la clave única lo descartaría en silencio y
  // el producto quedaría con menos de 4) y las posiciones nuevas siguen a la última existente.
  const existentes = await prisma.complementaryProduct.findMany({ select: { productId: true, suggestedProductId: true, position: true } });
  const yaSugeridos = new Map<number, Set<number>>();
  const siguientePosicion = new Map<number, number>();
  for (const e of existentes) {
    yaSugeridos.set(e.productId, (yaSugeridos.get(e.productId) ?? new Set<number>()).add(e.suggestedProductId));
    siguientePosicion.set(e.productId, Math.max(siguientePosicion.get(e.productId) ?? 0, e.position + 1));
  }

  const porCategoria = new Map<number, number[]>();
  for (const p of publicados) porCategoria.set(p.categoryId, [...(porCategoria.get(p.categoryId) ?? []), p.id]);

  const filas: Array<{ productId: number; suggestedProductId: number; position: number }> = [];
  let conSugerencias = 0;
  for (const p of publicados) {
    const ya = yaSugeridos.get(p.id) ?? new Set<number>();
    const tiene = ya.size;
    if (tiene >= POR_PRODUCTO) {
      conSugerencias++;
      continue;
    }
    const mismaCategoria = (porCategoria.get(p.categoryId) ?? []).filter((id) => id !== p.id);
    const otras = publicados.filter((o) => o.categoryId !== p.categoryId).map((o) => o.id);
    // Las de otras categorías se recorren en círculo desde un punto que depende del producto (sin descartar ninguna).
    const desde = otras.length ? mezclar(p.id) % otras.length : 0;
    const candidatos = [...mismaCategoria, ...otras.slice(desde), ...otras.slice(0, desde)];
    const inicio = mismaCategoria.length ? mezclar(p.id) % mismaCategoria.length : 0;
    const elegidos: number[] = [];
    for (let i = 0; i < candidatos.length && elegidos.length < POR_PRODUCTO - tiene; i++) {
      const id = i < mismaCategoria.length ? mismaCategoria[(inicio + i) % mismaCategoria.length] : candidatos[i];
      if (!elegidos.includes(id) && !ya.has(id)) elegidos.push(id);
    }
    const primeraPosicion = siguientePosicion.get(p.id) ?? 0;
    elegidos.forEach((suggestedProductId, i) => filas.push({ productId: p.id, suggestedProductId, position: primeraPosicion + i }));
    if (elegidos.length + tiene > 0) conSugerencias++;
  }

  if (!dryRun && filas.length) {
    for (let i = 0; i < filas.length; i += 1000) {
      await prisma.complementaryProduct.createMany({ data: filas.slice(i, i + 1000), skipDuplicates: true });
    }
  }
  return { productos: publicados.length, conSugerencias, filasNuevas: filas.length };
}
