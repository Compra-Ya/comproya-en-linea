import { faker } from "@faker-js/faker";
import type { DummyProducto } from "./dummyjson";
import type { ProductoSemilla } from "./tipos";

/**
 * RN-02: el precio digital nunca puede ser inferior al costo registrado en
 * el ERP sin aprobación de gerencia comercial. Para la siembra, el costo
 * siempre se genera por debajo del precio digital (factor entre 0.55 y 0.80),
 * simulando un margen comercial válido sin necesitar esa aprobación.
 */
function calcularCosto(precioDigital: number): number {
  const factor = 0.55 + Math.random() * 0.25;
  return Math.round(precioDigital * factor * 100) / 100;
}

function prefijoCategoria(categoria: string): string {
  return categoria
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 4)
    .padEnd(4, "X");
}

/**
 * Construye el código homologado del maestro (RN-01). Determinístico a
 * partir de categoría + índice, para que la siembra sea reproducible.
 */
export function construirCodigoHomologado(categoria: string, indice: number): string {
  return `${prefijoCategoria(categoria)}-${String(indice).padStart(6, "0")}`;
}

/**
 * Convierte los productos reales de DummyJSON en semillas del catálogo.
 * ~10% queda sin publicar a propósito, para poder probar RN-01 (un producto
 * no vendible aunque exista en el maestro).
 */
export function construirDesdeDummy(productosDummy: DummyProducto[]): ProductoSemilla[] {
  return productosDummy.map((p, i) => {
    const precioDigital = Math.round(p.price * 100) / 100;
    return {
      codigoHomologado: construirCodigoHomologado(p.category, i + 1),
      nombre: p.title,
      categoria: p.category,
      costo: calcularCosto(precioDigital),
      precioDigital,
      publicado: Math.random() > 0.1,
      fuente: "dummyjson",
    };
  });
}

/**
 * Genera productos sintéticos adicionales (Faker) dentro de las categorías
 * reales de DummyJSON, para no introducir taxonomías inventadas.
 */
export function generarSinteticos(
  categorias: string[],
  cantidad: number,
  indiceInicial: number
): ProductoSemilla[] {
  const resultado: ProductoSemilla[] = [];
  for (let i = 0; i < cantidad; i++) {
    const categoria = faker.helpers.arrayElement(categorias);
    const precioDigital = Number(
      faker.commerce.price({ min: 8000, max: 3500000, dec: 0 })
    );
    resultado.push({
      codigoHomologado: construirCodigoHomologado(categoria, indiceInicial + i),
      nombre: faker.commerce.productName(),
      categoria,
      costo: calcularCosto(precioDigital),
      precioDigital,
      publicado: Math.random() > 0.1,
      fuente: "sintetico",
    });
  }
  return resultado;
}

/**
 * Completa el catálogo hasta alcanzar `objetivo` productos, combinando la
 * base real (DummyJSON) con productos sintéticos. Si la base ya supera el
 * objetivo, se devuelve tal cual (no se recorta).
 */
export function completarCatalogo(
  base: ProductoSemilla[],
  categorias: string[],
  objetivo: number
): ProductoSemilla[] {
  if (base.length >= objetivo) return base;
  const faltantes = objetivo - base.length;
  const sinteticos = generarSinteticos(categorias, faltantes, base.length + 1);
  return [...base, ...sinteticos];
}
