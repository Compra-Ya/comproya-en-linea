// Cliente mínimo para DummyJSON (https://dummyjson.com), usado como fuente
// de productos "reales" (nombres, categorías e imágenes coherentes) para
// sembrar el catálogo. DummyJSON expone ~194 productos fijos — no requiere
// autenticación ni scraping, y su uso está pensado explícitamente para
// proyectos de práctica como este.

export interface DummyProducto {
  id: number;
  title: string;
  category: string;
  price: number;
}

interface DummyProductosResponse {
  products: DummyProducto[];
  total: number;
  skip: number;
  limit: number;
}

const BASE_URL = "https://dummyjson.com";

/**
 * Trae todos los productos de DummyJSON paginando en bloques de 100
 * (evita depender de que "limit=0" siga soportado en el futuro).
 */
export async function fetchTodosLosProductosDummy(): Promise<DummyProducto[]> {
  const productos: DummyProducto[] = [];
  const tamanoPagina = 100;
  let skip = 0;
  let total = Infinity;

  while (skip < total) {
    const url = `${BASE_URL}/products?limit=${tamanoPagina}&skip=${skip}&select=id,title,category,price`;
    const respuesta = await fetch(url);
    if (!respuesta.ok) {
      throw new Error(
        `DummyJSON respondió ${respuesta.status} al pedir productos (skip=${skip})`
      );
    }
    const datos = (await respuesta.json()) as DummyProductosResponse;
    productos.push(...datos.products);
    total = datos.total;
    skip += tamanoPagina;
  }

  return productos;
}

/** Categorías reales de DummyJSON, usadas también para generar productos sintéticos coherentes. */
export async function fetchCategoriasDummy(): Promise<string[]> {
  const respuesta = await fetch(`${BASE_URL}/products/categories`);
  if (!respuesta.ok) {
    throw new Error(`DummyJSON respondió ${respuesta.status} al pedir categorías`);
  }
  const datos = (await respuesta.json()) as Array<string | { slug: string; name: string }>;
  return datos.map((c) => (typeof c === "string" ? c : c.slug));
}
