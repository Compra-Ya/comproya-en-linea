// Asignación de imágenes locales a productos (Tarea B del handoff de diseño).
//
// Las fotos viven en frontend/public/productos/ y se describen en
// prisma/data/imagenes-manifest.json (con su origen). Como los ids de producto
// cambian entre bases (la siembra usa datos aleatorios), la asignación se
// recalcula a partir del contenido del producto — no del id — y es idempotente:
// correrla dos veces produce el mismo resultado y la segunda no escribe nada.
import type { PrismaClient } from "@prisma/client";

export interface FuenteImagen {
  /** Ruta pública (la que se guarda en Product.imageUrl), p. ej. /productos/retail/silla-01.webp */
  imageUrl: string;
  tienda: string;
  paginaUrl: string;
  imagenUrl: string;
  descargadoEn: string;
}

export interface ManifiestoImagenes {
  generadoEn: string;
  /** Grupo de producto (silla, mesa…) -> fotos reales de ese tipo. */
  grupos: Record<string, FuenteImagen[]>;
  /** Título de DummyJSON -> su foto. */
  dummyjson: Record<string, FuenteImagen>;
  /** Código homologado de los productos curados -> su foto. */
  curados: Record<string, FuenteImagen>;
}

/**
 * Los nombres sintéticos (Faker) terminan en un sustantivo inglés de lista
 * cerrada. Solo los que tienen equivalente en el retail colombiano llevan
 * foto; el resto (comida, "Car"…) conserva el placeholder por categoría.
 */
const SUSTANTIVO_A_GRUPO: Record<string, string> = {
  Chair: "silla",
  Computer: "computador",
  Table: "mesa",
  Gloves: "guantes",
  Hat: "gorra",
  Shoes: "tenis",
  Shirt: "camiseta",
  Towels: "toallas",
  Mouse: "mouse",
  Bike: "bicicleta",
  Ball: "balon",
  Keyboard: "teclado",
};

export function grupoPorNombre(nombre: string): string | null {
  const ultimo = nombre.trim().split(/\s+/).pop() ?? "";
  return SUSTANTIVO_A_GRUPO[ultimo] ?? null;
}

export interface ProductoParaImagen {
  id: number;
  name: string;
  homologatedCode: string;
  source: "DUMMYJSON" | "SYNTHETIC";
}

/** Decide la foto de un producto, o null si no hay una fiable (→ placeholder). */
export function elegirImagen(p: ProductoParaImagen, m: ManifiestoImagenes): FuenteImagen | null {
  if (m.curados[p.homologatedCode]) return m.curados[p.homologatedCode];
  if (p.source === "DUMMYJSON") return m.dummyjson[p.name] ?? null;
  const grupo = grupoPorNombre(p.name);
  const pool = grupo ? m.grupos[grupo] : undefined;
  if (!pool || pool.length === 0) return null;
  return pool[p.id % pool.length];
}

export interface ResultadoAplicacion {
  evaluados: number;
  actualizados: number;
  sinCambio: number;
  sinImagen: number;
  filasOrigen: Array<{ producto: ProductoParaImagen; fuente: FuenteImagen }>;
}

/**
 * Actualiza Product.imageUrl. `dryRun` calcula sin escribir. Nunca borra una
 * imagen existente: un producto sin foto fiable queda como está.
 */
export async function aplicarImagenes(
  prisma: Pick<PrismaClient, "product">,
  manifiesto: ManifiestoImagenes,
  dryRun = false
): Promise<ResultadoAplicacion> {
  const productos = await prisma.product.findMany({
    select: { id: true, name: true, homologatedCode: true, source: true, imageUrl: true },
    orderBy: { id: "asc" },
  });
  const res: ResultadoAplicacion = {
    evaluados: productos.length,
    actualizados: 0,
    sinCambio: 0,
    sinImagen: 0,
    filasOrigen: [],
  };
  for (const p of productos) {
    const fuente = elegirImagen(p, manifiesto);
    if (!fuente) {
      res.sinImagen++;
      continue;
    }
    res.filasOrigen.push({ producto: p, fuente });
    if (p.imageUrl === fuente.imageUrl) {
      res.sinCambio++;
      continue;
    }
    if (!dryRun) {
      await prisma.product.update({ where: { id: p.id }, data: { imageUrl: fuente.imageUrl } });
    }
    res.actualizados++;
  }
  return res;
}

function csv(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Trazabilidad: una fila por producto con imagen (design/imagenes-origen.csv). */
export function filasACsv(filas: ResultadoAplicacion["filasOrigen"]): string {
  const cab = "productId,nombreProducto,tiendaOrigen,urlPaginaProducto,urlImagenOriginal,fechaDescarga,imagenLocal";
  const lineas = filas.map(({ producto: p, fuente: f }) =>
    [p.id, p.name, f.tienda, f.paginaUrl, f.imagenUrl, f.descargadoEn, f.imageUrl].map(csv).join(",")
  );
  return [cab, ...lineas].join("\n") + "\n";
}
