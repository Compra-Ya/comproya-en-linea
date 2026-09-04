// Cliente mínimo para DummyJSON (https://dummyjson.com), usado como fuente
// de productos "reales" (nombres, categorías e imágenes coherentes) para
// sembrar el catálogo. DummyJSON expone ~194 productos fijos — no requiere
// autenticación ni scraping, y su uso está pensado explícitamente para
// proyectos de práctica como este.

export interface DummyProduct {
  id: number;
  title: string;
  category: string;
  price: number;
  brand?: string;
}

interface DummyProductsResponse {
  products: DummyProduct[];
  total: number;
  skip: number;
  limit: number;
}

const BASE_URL = "https://dummyjson.com";

/**
 * Trae todos los productos de DummyJSON paginando en bloques de 100
 * (evita depender de que "limit=0" siga soportado en el futuro).
 */
export async function fetchAllDummyProducts(): Promise<DummyProduct[]> {
  const products: DummyProduct[] = [];
  const pageSize = 100;
  let skip = 0;
  let total = Infinity;

  while (skip < total) {
    const url = `${BASE_URL}/products?limit=${pageSize}&skip=${skip}&select=id,title,category,price,brand`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `DummyJSON respondió ${response.status} al pedir productos (skip=${skip})`
      );
    }
    const data = (await response.json()) as DummyProductsResponse;
    products.push(...data.products);
    total = data.total;
    skip += pageSize;
  }

  return products;
}

/** Categorías reales de DummyJSON, usadas también para generar productos sintéticos coherentes. */
export async function fetchDummyCategories(): Promise<string[]> {
  const response = await fetch(`${BASE_URL}/products/categories`);
  if (!response.ok) {
    throw new Error(`DummyJSON respondió ${response.status} al pedir categorías`);
  }
  const data = (await response.json()) as Array<string | { slug: string; name: string }>;
  return data.map((c) => (typeof c === "string" ? c : c.slug));
}
