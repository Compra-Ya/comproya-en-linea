/**
 * Siembra del módulo carrito (SP-03 — sprint 3): carritos, ítems y
 * productos complementarios (C-05, tope de 4 por producto).
 *
 * Uso:
 *   npm run seed:cart               → siembra la base de datos
 *   npm run seed:cart -- --dry-run  → genera y valida sin tocar la BD
 *
 * Requiere `npm run seed` (catálogo) y `npm run seed:account` ya corridos.
 */

import { generateCarts, generateComplementaryLinks } from "./lib/generate-cart";

const CART_COUNT = Number(process.env.CART_COUNT ?? 60);
const DRY_RUN = process.argv.includes("--dry-run") || process.env.DRY_RUN === "1";
const SIMULATED_CUSTOMERS = Array.from({ length: 30 }, (_, i) => String(1000000000 + i));
const SIMULATED_PRODUCTS = Array.from({ length: 50 }, (_, i) => `CATA-${String(i + 1).padStart(6, "0")}`);

async function seedCart() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const customersDb = await prisma.customer.findMany({ select: { id: true, document: true } });
    const productsDb = await prisma.product.findMany({ select: { id: true, homologatedCode: true } });
    if (customersDb.length === 0 || productsDb.length === 0) {
      throw new Error("No hay clientes o productos en la base de datos — corre seed y seed:account primero");
    }

    const idByDocument = new Map(customersDb.map((c: { document: string; id: number }) => [c.document, c.id]));
    const idByCode = new Map(productsDb.map((p: { homologatedCode: string; id: number }) => [p.homologatedCode, p.id]));

    const carts = generateCarts(
      customersDb.map((c: { document: string }) => c.document),
      productsDb.map((p: { homologatedCode: string }) => p.homologatedCode),
      CART_COUNT
    );

    console.log("→ Insertando carritos...");
    for (const cart of carts) {
      const created = await prisma.cart.create({
        data: {
          customerId: cart.customerDocument ? idByDocument.get(cart.customerDocument) : null,
        },
      });
      await prisma.cartItem.createMany({
        data: cart.items.map((item) => ({
          cartId: created.id,
          productId: idByCode.get(item.productHomologatedCode)!,
          quantity: item.quantity,
        })),
        skipDuplicates: true,
      });
    }

    console.log("→ Generando productos complementarios (tope 4 por producto, C-05)...");
    const links = generateComplementaryLinks(
      productsDb.map((p: { homologatedCode: string }) => p.homologatedCode)
    );
    const BATCH_SIZE = 500;
    for (let i = 0; i < links.length; i += BATCH_SIZE) {
      const batch = links.slice(i, i + BATCH_SIZE);
      await prisma.complementaryProduct.createMany({
        data: batch.map((link) => ({
          productId: idByCode.get(link.productCode)!,
          suggestedProductId: idByCode.get(link.suggestedCode)!,
          position: link.position,
        })),
        skipDuplicates: true,
      });
    }

    console.log(`✓ Siembra de carrito completa: ${carts.length} carritos, ${links.length} sugerencias`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  if (DRY_RUN) {
    const carts = generateCarts(SIMULATED_CUSTOMERS, SIMULATED_PRODUCTS, CART_COUNT);
    const links = generateComplementaryLinks(SIMULATED_PRODUCTS);
    const maxLinksPerProduct = Math.max(
      ...SIMULATED_PRODUCTS.map((code) => links.filter((l) => l.productCode === code).length)
    );
    if (maxLinksPerProduct > 4) throw new Error("C-05 violada: más de 4 complementarios para un producto");
    console.log(`→ --dry-run: ${carts.length} carritos y ${links.length} sugerencias generados (máx. ${maxLinksPerProduct}/producto, OK ≤ 4)`);
    console.log("  Muestra de 1 carrito:", carts[0]);
    return;
  }

  await seedCart();
}

main().catch((err) => {
  console.error("✗ Falló la siembra de carrito:", err);
  process.exit(1);
});
