// Verificación local de la lógica pura de generación (sin red, sin BD).
// Simula los ~194 productos de DummyJSON con datos ficticios de la misma forma.
import { buildFromDummy, completeCatalog } from "../prisma/lib/generate-catalog";
import { generateAvailability, BRANCHES } from "../prisma/lib/generate-branches";
import { generateCustomers } from "../prisma/lib/generate-account";
import { generateCarts, generateComplementaryLinks } from "../prisma/lib/generate-cart";
import { generateOrders } from "../prisma/lib/generate-order";
import { generatePayments, generateLoyaltyCoupons } from "../prisma/lib/generate-payment";
import type { DummyProduct } from "../prisma/lib/dummyjson";

const SIMULATED_CATEGORIES = [
  "smartphones", "laptops", "fragrances", "skincare", "groceries",
  "home-decoration", "furniture", "tops", "womens-dresses", "womens-shoes",
  "mens-shirts", "mens-shoes", "mens-watches", "womens-watches", "womens-bags",
  "womens-jewellery", "sunglasses", "automotive", "motorcycle", "lighting",
];

function simulateDummyProducts(count: number): DummyProduct[] {
  const products: DummyProduct[] = [];
  for (let i = 0; i < count; i++) {
    products.push({
      id: i + 1,
      title: `Producto simulado ${i + 1}`,
      category: SIMULATED_CATEGORIES[i % SIMULATED_CATEGORIES.length],
      price: Math.round((10 + Math.random() * 2000) * 100) / 100,
      brand: `Marca ${i % 12}`,
    });
  }
  return products;
}

function testCatalog(): string[] {
  const TARGET = 1200;

  const base = buildFromDummy(simulateDummyProducts(194));
  console.log(`Base real simulada: ${base.length} productos`);

  const catalog = completeCatalog(base, SIMULATED_CATEGORIES, TARGET);
  console.log(`Catálogo completo: ${catalog.length} productos (objetivo ${TARGET})`);

  if (catalog.length < TARGET) throw new Error("No alcanzó el objetivo de productos");

  const codes = new Set(catalog.map((p) => p.homologatedCode));
  if (codes.size !== catalog.length) throw new Error("Hay códigos homologados duplicados");
  console.log(`Códigos homologados únicos: ${codes.size}/${catalog.length} OK`);

  const rn02Violations = catalog.filter((p) => p.cost >= p.digitalPrice);
  if (rn02Violations.length > 0) throw new Error(`RN-02 violada en ${rn02Violations.length} productos`);
  console.log("RN-02 (costo < precio digital) respetada en el 100% de los productos");

  const real = catalog.filter((p) => p.source === "DUMMYJSON").length;
  const synthetic = catalog.filter((p) => p.source === "SYNTHETIC").length;
  console.log(`Fuente: ${real} reales (DummyJSON) + ${synthetic} sintéticos (Faker) = ${real + synthetic}`);

  const published = catalog.filter((p) => p.published).length;
  console.log(`Publicados: ${published}/${catalog.length} (~90% esperado, RN-01 probable)`);

  const missingBrand = catalog.filter((p) => !p.brand).length;
  if (missingBrand === catalog.length) throw new Error("Ningún producto trae marca");

  const branchCount = BRANCHES.length;
  if (branchCount !== 8) throw new Error(`Se esperaban 8 sucursales (canon, sección 10); hay ${branchCount}`);
  console.log(`Sucursales: ${branchCount} (coincide con la cifra oficial del canon)`);

  let stale = 0;
  const samples = 5000;
  for (let i = 0; i < samples; i++) {
    const a = generateAvailability();
    const minutes = (Date.now() - a.syncedAt.getTime()) / 60000;
    if (minutes > 15) stale++;
    if (a.erpUnits < 0 || a.safetyThreshold < 0 || a.reservedUnits < 0) {
      throw new Error("Disponibilidad con valores negativos");
    }
  }
  console.log(`RN-04: ${stale}/${samples} filas simuladas con sincronización vencida (~${Math.round((stale / samples) * 100)}%, esperado ~16.7%)`);

  return catalog.slice(0, 30).map((p) => p.homologatedCode);
}

function testAccount(): string[] {
  const customers = generateCustomers(100);
  const documents = new Set(customers.map((c) => c.document));
  if (documents.size !== customers.length) throw new Error("Documentos de cliente duplicados");

  const withoutLoyalty = customers.filter((c) => c.loyaltyId === null).length;
  const pct = Math.round((withoutLoyalty / customers.length) * 100);
  console.log(`Cuenta: ${withoutLoyalty}/${customers.length} sin identificador de lealtad (~${pct}%, esperado 8-12%)`);

  const activeConsent = customers.filter((c) => c.consentActive).length;
  console.log(`Consentimiento activo: ${activeConsent}/${customers.length}`);

  return customers.map((c) => c.document);
}

function testCartAndOrder(customerDocuments: string[], productCodes: string[]) {
  const carts = generateCarts(customerDocuments, productCodes, 60);
  console.log(`Carrito: ${carts.length} carritos generados`);

  const links = generateComplementaryLinks(productCodes);
  const maxPerProduct = Math.max(...productCodes.map((code) => links.filter((l) => l.productCode === code).length));
  if (maxPerProduct > 4) throw new Error("C-05 violada: más de 4 complementarios para un producto");
  console.log(`Carrito: complementarios generados, máximo ${maxPerProduct}/producto (C-05, tope 4) OK`);

  const orders = generateOrders(customerDocuments, ["ComproYa Bogotá Centro", "ComproYa Medellín"], productCodes, 20);
  const pickupCodes = new Set(orders.map((o) => o.pickupCode));
  if (pickupCodes.size !== orders.length) throw new Error("RN-08 violada: códigos de retiro duplicados");

  const atRisk = orders.filter((o) => {
    if (o.status !== "PREPARING") return false;
    const last = o.statusHistory[o.statusHistory.length - 1]?.occurredAt ?? o.createdAt;
    return (Date.now() - last.getTime()) / (1000 * 60 * 60) > 4;
  });
  if (atRisk.length === 0) throw new Error("Ningún pedido en riesgo (C-13) — falla el escenario que necesita P-14");
  console.log(`Pedido: ${atRisk.length} pedido(s) en riesgo (C-13) OK`);

  const cancellable = orders.filter((o) => o.status === "CREATED" || o.status === "PAID");
  if (cancellable.length === 0) throw new Error("Ningún pedido cancelable (RN-09) — falla el escenario que necesita P-13");
  console.log(`Pedido: ${cancellable.length} pedido(s) cancelable(s) (RN-09) OK`);

  const payments = generatePayments(orders);
  console.log(`Pago: ${payments.length} pagos generados para ${orders.length} pedidos`);

  const coupons = generateLoyaltyCoupons();
  console.log(`Pago: ${coupons.length} cupones de lealtad de prueba (C-07)`);
}

function main() {
  const productCodes = testCatalog();
  const customerDocuments = testAccount();
  testCartAndOrder(customerDocuments, productCodes);

  console.log("\n✓ Todas las invariantes pasaron (catálogo, cuenta, carrito, pedido, pago).");
}

main();
