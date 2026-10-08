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
 * foto; un tipo sin fotos en el manifiesto conserva el placeholder por categoría.
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
  Pants: "pantalon",
  Sausages: "salchichas",
  Salad: "ensalada",
  Tuna: "atun",
  Fish: "pescado",
  Pizza: "pizza",
  Bacon: "tocino",
  Chicken: "pollo",
  Chips: "papas",
  Cheese: "queso",
  Soap: "jabon",
  Car: "carro",
};

// Primera palabra de los nombres ya traducidos al español (traducir-nombres.ts).
const PRIMERA_PALABRA_A_GRUPO: Record<string, string> = {
  Silla: "silla",
  Computador: "computador",
  Mesa: "mesa",
  Guantes: "guantes",
  Pantalón: "pantalon",
  Gorra: "gorra",
  Zapatos: "tenis",
  Camisa: "camiseta",
  Toallas: "toallas",
  Mouse: "mouse",
  Bicicleta: "bicicleta",
  Balón: "balon",
  Teclado: "teclado",
  Jabón: "jabon",
  Carro: "carro",
  Salchichas: "salchichas",
  Ensalada: "ensalada",
  Atún: "atun",
  Pescado: "pescado",
  Pizza: "pizza",
  Tocino: "tocino",
  Pollo: "pollo",
  Papas: "papas",
  Queso: "queso",
};

/** Grupo de foto de un nombre sintético, en inglés ("... Chair") o ya traducido ("Silla de ..."). */
export function grupoPorNombre(nombre: string): string | null {
  const palabras = nombre.trim().split(/\s+/);
  const ultimo = palabras[palabras.length - 1] ?? "";
  if (SUSTANTIVO_A_GRUPO[ultimo]) return SUSTANTIVO_A_GRUPO[ultimo];
  // Los nombres traducidos llevan el sustantivo primero y "de" en segundo lugar.
  return palabras[1] === "de" || palabras[1] === "fritas" ? (PRIMERA_PALABRA_A_GRUPO[palabras[0]] ?? null) : null;
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

export interface ResultadoPublicacion {
  total: number;
  publicadosAhora: number;
  despublicadosAhora: number;
  publicadosFinal: number;
}

/**
 * Catálogo de pruebas: publica los productos con foto y despublica los que no
 * la tienen (RN-01: la publicación es explícita). Las categorías siguen solas:
 * el servicio solo lista las que tienen productos publicados. Idempotente.
 */
export async function publicarSoloConImagen(
  prisma: Pick<PrismaClient, "product">,
  dryRun = false
): Promise<ResultadoPublicacion> {
  const conImagen = { imageUrl: { not: null } };
  const sinImagen = { imageUrl: null };
  const total = await prisma.product.count();
  const porPublicar = await prisma.product.count({ where: { ...conImagen, published: false } });
  const porDespublicar = await prisma.product.count({ where: { ...sinImagen, published: true } });
  if (!dryRun) {
    await prisma.product.updateMany({ where: { ...conImagen, published: false }, data: { published: true } });
    await prisma.product.updateMany({ where: { ...sinImagen, published: true }, data: { published: false } });
  }
  const publicadosFinal = dryRun
    ? (await prisma.product.count({ where: { published: true } })) + porPublicar - porDespublicar
    : await prisma.product.count({ where: { published: true } });
  return { total, publicadosAhora: porPublicar, despublicadosAhora: porDespublicar, publicadosFinal };
}
