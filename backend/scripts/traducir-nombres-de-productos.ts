// Traduce al español products.name (sintéticos y DummyJSON). Idempotente; --dry-run para ensayar.
//   npx ts-node scripts/traducir-nombres-de-productos.ts [--dry-run]
// Cambia datos visibles: contra una base desplegada solo con confirmación explícita. No hay
// reversión automática (el nombre en inglés no se guarda): respaldar `products` antes
// (ver design/plan-ejecucion-bd-desplegada.md).
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { traducirNombresDeProductos } from "../prisma/lib/traducir-nombres";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const prisma = new PrismaClient();
  try {
    console.log(dryRun ? "[dry-run]" : "[aplicado]", await traducirNombresDeProductos(prisma, dryRun));
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
