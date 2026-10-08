// Lleva cada producto sintético a la categoría que corresponde a su tipo. Idempotente; --dry-run
// para ensayar. Cambia datos de negocio (categoría de ~1900 productos): contra una base desplegada
// solo con confirmación explícita y con respaldo previo de `products`.
//   npx ts-node scripts/categorizar-sinteticos.ts [--dry-run]
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { categorizarSinteticos } from "../prisma/lib/categorizar-sinteticos";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const prisma = new PrismaClient();
  try {
    console.log(dryRun ? "[dry-run]" : "[aplicado]", await categorizarSinteticos(prisma, dryRun));
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
