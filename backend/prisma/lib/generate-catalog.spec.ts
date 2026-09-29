import { buildFromDummy, generateSynthetic } from "./generate-catalog";
import type { DummyProduct } from "./dummyjson";

// Corrección CU-2 #5: el esquema declara Decimal(12,2) para digitalPrice/cost
// (schema.prisma:48,49,270) — los dos orígenes de la siembra deben producir
// montos con máximo ese nivel de precisión, de forma consistente entre sí.
function tieneComoMuchoDosDecimales(monto: number): boolean {
  return Number.isInteger(Math.round(monto * 100));
}

describe("Siembra del catálogo — consistencia de decimales (Decimal(12,2))", () => {
  it("buildFromDummy() produce digitalPrice y cost con máximo 2 decimales", () => {
    const dummyProducts: DummyProduct[] = [
      { id: 1, title: "Producto A", category: "electronica", price: 19999.9 },
      { id: 2, title: "Producto B", category: "hogar", price: 45000 },
      { id: 3, title: "Producto C", category: "electronica", price: 123.456 },
    ];
    const seeds = buildFromDummy(dummyProducts);
    for (const seed of seeds) {
      expect(tieneComoMuchoDosDecimales(seed.digitalPrice)).toBe(true);
      expect(tieneComoMuchoDosDecimales(seed.cost)).toBe(true);
    }
  });

  it("Corrección CU-2 #5: generateSynthetic() ya no fuerza precios enteros — produce digitalPrice y cost con máximo 2 decimales, igual que buildFromDummy()", () => {
    const categorias = ["electronica", "hogar", "moda"];
    const seeds = generateSynthetic(categorias, 30, 1);
    expect(seeds).toHaveLength(30);
    for (const seed of seeds) {
      expect(tieneComoMuchoDosDecimales(seed.digitalPrice)).toBe(true);
      expect(tieneComoMuchoDosDecimales(seed.cost)).toBe(true);
    }
  });
});
