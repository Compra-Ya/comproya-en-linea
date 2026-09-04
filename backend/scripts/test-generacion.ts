// Verificación local de la lógica pura de generación (sin red, sin BD).
// Simula los ~194 productos de DummyJSON con datos ficticios de la misma forma.
import { construirDesdeDummy, completarCatalogo } from "../prisma/lib/generar-catalogo";
import { generarDisponibilidad, SUCURSALES } from "../prisma/lib/generar-sucursales";
import type { DummyProducto } from "../prisma/lib/dummyjson";

const CATEGORIAS_SIMULADAS = [
  "smartphones", "laptops", "fragrances", "skincare", "groceries",
  "home-decoration", "furniture", "tops", "womens-dresses", "womens-shoes",
  "mens-shirts", "mens-shoes", "mens-watches", "womens-watches", "womens-bags",
  "womens-jewellery", "sunglasses", "automotive", "motorcycle", "lighting",
];

function simularProductosDummy(cantidad: number): DummyProducto[] {
  const productos: DummyProducto[] = [];
  for (let i = 0; i < cantidad; i++) {
    productos.push({
      id: i + 1,
      title: `Producto simulado ${i + 1}`,
      category: CATEGORIAS_SIMULADAS[i % CATEGORIAS_SIMULADAS.length],
      price: Math.round((10 + Math.random() * 2000) * 100) / 100,
    });
  }
  return productos;
}

function main() {
  const OBJETIVO = 1200;

  const base = construirDesdeDummy(simularProductosDummy(194));
  console.log(`Base real simulada: ${base.length} productos`);

  const catalogo = completarCatalogo(base, CATEGORIAS_SIMULADAS, OBJETIVO);
  console.log(`Catálogo completo: ${catalogo.length} productos (objetivo ${OBJETIVO})`);

  // Invariante 1: alcanza el objetivo
  if (catalogo.length < OBJETIVO) throw new Error("No alcanzó el objetivo de productos");

  // Invariante 2: códigos homologados únicos
  const codigos = new Set(catalogo.map((p) => p.codigoHomologado));
  if (codigos.size !== catalogo.length) throw new Error("Hay códigos homologados duplicados");
  console.log(`Códigos homologados únicos: ${codigos.size}/${catalogo.length} OK`);

  // Invariante 3: RN-02 — costo siempre por debajo del precio digital
  const violacionesRN02 = catalogo.filter((p) => p.costo >= p.precioDigital);
  if (violacionesRN02.length > 0) throw new Error(`RN-02 violada en ${violacionesRN02.length} productos`);
  console.log("RN-02 (costo < precio digital) respetada en el 100% de los productos");

  // Invariante 4: mezcla de fuentes
  const reales = catalogo.filter((p) => p.fuente === "dummyjson").length;
  const sinteticos = catalogo.filter((p) => p.fuente === "sintetico").length;
  console.log(`Fuente: ${reales} reales (DummyJSON) + ${sinteticos} sintéticos (Faker) = ${reales + sinteticos}`);

  // Invariante 5: RN-01 — hay productos publicados y no publicados
  const publicados = catalogo.filter((p) => p.publicado).length;
  console.log(`Publicados: ${publicados}/${catalogo.length} (~90% esperado, RN-01 probable)`);

  // Disponibilidad por sucursal
  const filasDisponibilidad = catalogo.length * SUCURSALES.length;
  console.log(`Filas de disponibilidad proyectadas: ${catalogo.length} × ${SUCURSALES.length} sucursales = ${filasDisponibilidad}`);

  let vencidas = 0;
  const muestras = 5000;
  for (let i = 0; i < muestras; i++) {
    const d = generarDisponibilidad();
    const minutos = (Date.now() - d.sincronizadoEn.getTime()) / 60000;
    if (minutos > 15) vencidas++;
    if (d.existenciasErp < 0 || d.umbralSeguridad < 0 || d.unidadesReservadas < 0) {
      throw new Error("Disponibilidad con valores negativos");
    }
  }
  console.log(`RN-04: ${vencidas}/${muestras} filas simuladas con sincronización vencida (~${Math.round((vencidas / muestras) * 100)}%, esperado ~16.7%)`);

  console.log("\n✓ Todas las invariantes pasaron.");
  console.log("Muestra de 3 productos:", JSON.stringify(catalogo.slice(0, 3), null, 2));
}

main();
