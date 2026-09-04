/**
 * Siembra del módulo cuenta (SP-07, SP-08 — sprint 2): clientes, consentimiento.
 *
 * Uso:
 *   npm run seed:account                    → siembra la base de datos
 *   npm run seed:account -- --dry-run       → genera y valida sin tocar la BD
 *   CUSTOMER_COUNT=300 npm run seed:account → cambia la cantidad de clientes
 *
 * Requiere que `npm run seed` (catálogo) ya se haya corrido, aunque no
 * depende de sus datos directamente — solo del orden de FK del schema.
 */

import { generateCustomers } from "./lib/generate-account";
import type { CustomerSeed } from "./lib/types";

const CUSTOMER_COUNT = Number(process.env.CUSTOMER_COUNT ?? 200);
const DRY_RUN = process.argv.includes("--dry-run") || process.env.DRY_RUN === "1";

function validateInvariants(customers: CustomerSeed[]) {
  const documents = new Set(customers.map((c) => c.document));
  if (documents.size !== customers.length) {
    throw new Error("Hay documentos de cliente duplicados");
  }
  const withLoyalty = customers.filter((c) => c.loyaltyId !== null).length;
  const withoutLoyaltyPct = Math.round(((customers.length - withLoyalty) / customers.length) * 100);
  console.log(`→ ${customers.length - withLoyalty}/${customers.length} sin identificador de lealtad (~${withoutLoyaltyPct}%, esperado 8-12%)`);
}

async function seedAccount(customers: CustomerSeed[]) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    console.log("→ Insertando clientes...");
    for (const c of customers) {
      await prisma.customer.upsert({
        where: { document: c.document },
        update: {},
        create: {
          document: c.document,
          name: c.name,
          email: c.email,
          passwordHash: c.passwordHash,
          loyaltyId: c.loyaltyId,
        },
      });
    }

    console.log("→ Creando consentimiento por cliente...");
    const customersDb = await prisma.customer.findMany({ select: { id: true, document: true } });
    const consentByDocument = new Map(customers.map((c) => [c.document, c.consentActive]));
    for (const customer of customersDb) {
      await prisma.consent.upsert({
        where: { customerId: customer.id },
        update: {},
        create: {
          customerId: customer.id,
          active: consentByDocument.get(customer.document) ?? true,
        },
      });
    }

    console.log(`✓ Siembra de cuenta completa: ${customersDb.length} clientes`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const customers = generateCustomers(CUSTOMER_COUNT);
  validateInvariants(customers);

  if (DRY_RUN) {
    console.log("→ --dry-run: no se escribió nada en la base de datos.");
    console.log("  Muestra de 2 clientes:", customers.slice(0, 2));
    return;
  }

  await seedAccount(customers);
}

main().catch((err) => {
  console.error("✗ Falló la siembra de cuenta:", err);
  process.exit(1);
});
