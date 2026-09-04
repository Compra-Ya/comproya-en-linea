import { faker } from "@faker-js/faker";
import type { DummyProduct } from "./dummyjson";
import type { ProductSeed } from "./types";

/**
 * RN-02: el precio digital nunca puede ser inferior al costo registrado en
 * el ERP sin aprobación de gerencia comercial. Para la siembra, el costo
 * siempre se genera por debajo del precio digital (factor entre 0.55 y 0.80),
 * simulando un margen comercial válido sin necesitar esa aprobación.
 */
function computeCost(digitalPrice: number): number {
  const factor = 0.55 + Math.random() * 0.25;
  return Math.round(digitalPrice * factor * 100) / 100;
}

function categoryPrefix(category: string): string {
  return category
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 4)
    .padEnd(4, "X");
}

/**
 * Construye el código homologado del maestro (RN-01). Determinístico a
 * partir de categoría + índice, para que la siembra sea reproducible.
 */
export function buildHomologatedCode(category: string, index: number): string {
  return `${categoryPrefix(category)}-${String(index).padStart(6, "0")}`;
}

/**
 * Convierte los productos reales de DummyJSON en semillas del catálogo.
 * ~10% queda sin publicar a propósito, para poder probar RN-01 (un producto
 * no vendible aunque exista en el maestro).
 */
export function buildFromDummy(dummyProducts: DummyProduct[]): ProductSeed[] {
  return dummyProducts.map((p, i) => {
    const digitalPrice = Math.round(p.price * 100) / 100;
    return {
      homologatedCode: buildHomologatedCode(p.category, i + 1),
      name: p.title,
      category: p.category,
      brand: p.brand ?? null,
      cost: computeCost(digitalPrice),
      digitalPrice,
      published: Math.random() > 0.1,
      source: "DUMMYJSON",
    };
  });
}

/**
 * Genera productos sintéticos adicionales (Faker) dentro de las categorías
 * reales de DummyJSON, para no introducir taxonomías inventadas.
 */
export function generateSynthetic(
  categories: string[],
  count: number,
  startingIndex: number
): ProductSeed[] {
  const result: ProductSeed[] = [];
  for (let i = 0; i < count; i++) {
    const category = faker.helpers.arrayElement(categories);
    const digitalPrice = Number(
      faker.commerce.price({ min: 8000, max: 3500000, dec: 0 })
    );
    result.push({
      homologatedCode: buildHomologatedCode(category, startingIndex + i),
      name: faker.commerce.productName(),
      category,
      brand: faker.company.name(),
      cost: computeCost(digitalPrice),
      digitalPrice,
      published: Math.random() > 0.1,
      source: "SYNTHETIC",
    });
  }
  return result;
}

/**
 * Completa el catálogo hasta alcanzar `target` productos, combinando la base
 * real (DummyJSON) con productos sintéticos. Si la base ya supera el
 * objetivo, se devuelve tal cual (no se recorta).
 */
export function completeCatalog(
  base: ProductSeed[],
  categories: string[],
  target: number
): ProductSeed[] {
  if (base.length >= target) return base;
  const missing = target - base.length;
  const synthetic = generateSynthetic(categories, missing, base.length + 1);
  return [...base, ...synthetic];
}
