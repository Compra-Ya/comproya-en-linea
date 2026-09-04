/**
 * Siembra del módulo pago (SP-05 — sprint 5): un pago por cada pedido que
 * ya alcanzó a pagarse. RN-06: nunca se guarda número de tarjeta, solo un
 * token simulado de la pasarela.
 *
 * Uso:
 *   npm run seed:payment               → siembra la base de datos
 *   npm run seed:payment -- --dry-run  → genera y valida sin tocar la BD
 *
 * Requiere `npm run seed:order` ya corrido.
 */

import { generatePayments } from "./lib/generate-payment";
import type { OrderSeed } from "./lib/types";

const DRY_RUN = process.argv.includes("--dry-run") || process.env.DRY_RUN === "1";

async function seedPayments() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const ordersDb = await prisma.order.findMany({
      select: { id: true, pickupCode: true, status: true, createdAt: true },
    });
    if (ordersDb.length === 0) {
      throw new Error("No hay pedidos en la base de datos — corre seed:order primero");
    }

    const orderSeeds: OrderSeed[] = ordersDb.map((o: { pickupCode: string; status: OrderSeed["status"]; createdAt: Date }) => ({
      customerDocument: "",
      branchName: "",
      status: o.status,
      committedAt: o.createdAt,
      pickupCode: o.pickupCode,
      pickupCodeExpiresAt: o.createdAt,
      correlationId: "",
      createdAt: o.createdAt,
      statusHistory: [],
      items: [],
    }));

    const payments = generatePayments(orderSeeds);
    const idByPickupCode = new Map(ordersDb.map((o: { pickupCode: string; id: number }) => [o.pickupCode, o.id]));

    console.log("→ Insertando pagos...");
    for (const payment of payments) {
      const orderId = idByPickupCode.get(payment.orderPickupCode);
      if (!orderId) continue;
      await prisma.payment.upsert({
        where: { orderId },
        update: {},
        create: {
          orderId,
          method: payment.method,
          status: payment.status,
          gatewayToken: payment.gatewayToken,
          confirmedAt: payment.confirmedAt,
        },
      });
    }

    console.log(`✓ Siembra de pago completa: ${payments.length} pagos`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  if (DRY_RUN) {
    console.log("→ --dry-run: la generación de pagos depende de pedidos reales de la base de datos (usa `npm run seed:order -- --dry-run` para validar esa parte sin BD).");
    return;
  }

  await seedPayments();
}

main().catch((err) => {
  console.error("✗ Falló la siembra de pago:", err);
  process.exit(1);
});
