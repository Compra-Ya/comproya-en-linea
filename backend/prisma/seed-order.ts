/**
 * Siembra del módulo pedido (SP-04 confirmación, SP-06 operación —
 * sprints 4 y 6): pedidos, ítems, reservas de unidades, historial de
 * estado y cupones de lealtad.
 *
 * Uso:
 *   npm run seed:order               → siembra la base de datos
 *   npm run seed:order -- --dry-run  → genera y valida sin tocar la BD
 *
 * Requiere `npm run seed`, `npm run seed:account` y `npm run seed:cart`
 * ya corridos (usa clientes, sucursales, productos y disponibilidad reales).
 */

import { generateOrders } from "./lib/generate-order";
import { generateLoyaltyCoupons } from "./lib/generate-payment";
import type { OrderSeed } from "./lib/types";

const EXTRA_ORDER_COUNT = Number(process.env.EXTRA_ORDER_COUNT ?? 20);
const DRY_RUN = process.argv.includes("--dry-run") || process.env.DRY_RUN === "1";

const SIMULATED_CUSTOMERS = Array.from({ length: 30 }, (_, i) => String(1000000000 + i));
const SIMULATED_BRANCHES = ["ComproYa Bogotá Centro", "ComproYa Medellín"];
const SIMULATED_PRODUCTS = Array.from({ length: 20 }, (_, i) => `CATA-${String(i + 1).padStart(6, "0")}`);

function validateInvariants(orders: OrderSeed[]) {
  const pickupCodes = new Set(orders.map((o) => o.pickupCode));
  if (pickupCodes.size !== orders.length) throw new Error("RN-08 violada: hay códigos de retiro duplicados");

  const correlationIds = new Set(orders.map((o) => o.correlationId));
  if (correlationIds.size !== orders.length) throw new Error("Hay identificadores de correlación duplicados");

  const atRisk = orders.filter((o) => {
    if (o.status !== "PREPARING") return false;
    const lastChange = o.statusHistory[o.statusHistory.length - 1]?.occurredAt ?? o.createdAt;
    return (Date.now() - lastChange.getTime()) / (1000 * 60 * 60) > 4;
  });
  console.log(`→ ${atRisk.length} pedido(s) en riesgo generado(s) (C-13, > 4 horas sin avanzar) — se necesita al menos 1 para P-14`);
  if (atRisk.length === 0) throw new Error("No se generó ningún pedido en riesgo (C-13) para poder probar P-14");

  const cancellable = orders.filter((o) => o.status === "CREATED" || o.status === "PAID");
  console.log(`→ ${cancellable.length} pedido(s) cancelable(s) (RN-09) — se necesita al menos 1 para P-13`);
  if (cancellable.length === 0) throw new Error("No se generó ningún pedido cancelable (RN-09) para poder probar P-13");
}

async function seedOrders(orders: OrderSeed[]) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const customersDb = await prisma.customer.findMany({ select: { id: true, document: true } });
    const branchesDb = await prisma.branch.findMany({ select: { id: true, name: true } });
    const productsDb = await prisma.product.findMany({ select: { id: true, homologatedCode: true } });
    if (customersDb.length === 0 || branchesDb.length === 0 || productsDb.length === 0) {
      throw new Error("No hay clientes, sucursales o productos — corre seed, seed:account y seed:cart primero");
    }

    const customerIdByDocument = new Map(customersDb.map((c: { document: string; id: number }) => [c.document, c.id]));
    const branchIdByName = new Map(branchesDb.map((b: { name: string; id: number }) => [b.name, b.id]));
    const productIdByCode = new Map(productsDb.map((p: { homologatedCode: string; id: number }) => [p.homologatedCode, p.id]));

    console.log("→ Insertando pedidos...");
    for (const order of orders) {
      const branchId = branchIdByName.get(order.branchName);
      const customerId = customerIdByDocument.get(order.customerDocument);
      if (!branchId || !customerId) continue;

      const createdOrder = await prisma.order.create({
        data: {
          customerId,
          branchId,
          status: order.status,
          committedAt: order.committedAt,
          pickupCode: order.pickupCode,
          pickupCodeExpiresAt: order.pickupCodeExpiresAt,
          correlationId: order.correlationId,
          createdAt: order.createdAt,
        },
      });

      await prisma.orderItem.createMany({
        data: order.items
          .filter((item) => productIdByCode.has(item.productHomologatedCode))
          .map((item) => ({
            orderId: createdOrder.id,
            productId: productIdByCode.get(item.productHomologatedCode)!,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
      });

      await prisma.orderStatusHistory.createMany({
        data: order.statusHistory.map((h) => ({
          orderId: createdOrder.id,
          status: h.status,
          occurredAt: h.occurredAt,
        })),
      });

      // RN-05: reserva de unidades contra una fila de disponibilidad real de
      // esa sucursal, para el primer producto del pedido.
      const firstItem = order.items[0];
      if (firstItem && productIdByCode.has(firstItem.productHomologatedCode)) {
        const availability = await prisma.availability.findFirst({
          where: { productId: productIdByCode.get(firstItem.productHomologatedCode)!, branchId },
        });
        if (availability) {
          await prisma.unitsReservation.create({
            data: {
              orderId: createdOrder.id,
              availabilityId: availability.id,
              quantity: firstItem.quantity,
              releasedAt: order.status === "CANCELLED" || order.status === "PAYMENT_FAILED" ? new Date() : null,
            },
          });
        }
      }
    }

    console.log("→ Insertando cupones de lealtad (C-07)...");
    const coupons = generateLoyaltyCoupons();
    for (const coupon of coupons) {
      await prisma.loyaltyCoupon.upsert({
        where: { code: coupon.code },
        update: {},
        create: coupon,
      });
    }

    // RN-07: redención única, se ejercita sobre el primer pedido pagado o más avanzado.
    const paidOrder = await prisma.order.findFirst({ where: { status: { in: ["PAID", "PREPARING", "DELIVERED"] } } });
    const firstCoupon = await prisma.loyaltyCoupon.findFirst({ where: { code: coupons[0].code } });
    if (paidOrder && firstCoupon) {
      await prisma.couponRedemption.upsert({
        where: { orderId: paidOrder.id },
        update: {},
        create: { orderId: paidOrder.id, couponId: firstCoupon.id },
      });
    }

    console.log(`✓ Siembra de pedido completa: ${orders.length} pedidos, ${coupons.length} cupones`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const orders = DRY_RUN
    ? generateOrders(SIMULATED_CUSTOMERS, SIMULATED_BRANCHES, SIMULATED_PRODUCTS, EXTRA_ORDER_COUNT)
    : await buildOrdersFromDb();

  validateInvariants(orders);

  if (DRY_RUN) {
    console.log("→ --dry-run: no se escribió nada en la base de datos.");
    console.log("  Muestra de 1 pedido:", orders[0]);
    return;
  }

  await seedOrders(orders);
}

async function buildOrdersFromDb(): Promise<OrderSeed[]> {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const customersDb = await prisma.customer.findMany({ select: { document: true } });
    const branchesDb = await prisma.branch.findMany({ select: { name: true } });
    const productsDb = await prisma.product.findMany({ select: { homologatedCode: true }, take: 100 });
    if (customersDb.length === 0 || branchesDb.length === 0 || productsDb.length === 0) {
      throw new Error("No hay clientes, sucursales o productos — corre seed, seed:account y seed:cart primero");
    }
    return generateOrders(
      customersDb.map((c: { document: string }) => c.document),
      branchesDb.map((b: { name: string }) => b.name),
      productsDb.map((p: { homologatedCode: string }) => p.homologatedCode),
      EXTRA_ORDER_COUNT
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("✗ Falló la siembra de pedido:", err);
  process.exit(1);
});
