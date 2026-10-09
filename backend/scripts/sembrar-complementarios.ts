// Siembra productos complementarios (hasta 4 por producto). Idempotente; --dry-run para ensayar.
//   npx ts-node scripts/sembrar-complementarios.ts [--dry-run]
// Agrega filas a complementary_products: contra una base desplegada solo con confirmación explícita.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { sembrarComplementarios } from "../prisma/lib/complementarios";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const prisma = new PrismaClient();
  try {
    console.log(dryRun ? "[dry-run]" : "[aplicado]", await sembrarComplementarios(prisma, dryRun));
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
