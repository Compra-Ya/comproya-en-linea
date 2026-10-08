// Deja publicados únicamente los productos con foto (catálogo de pruebas).
// Uso:  npx ts-node scripts/publicar-solo-con-imagen.ts [--dry-run]
// Cambia products.published; contra una base desplegada solo con confirmación
// explícita (ver design/plan-ejecucion-bd-desplegada.md). Reversible:
// UPDATE products SET published = true;  (o restaurar el respaldo).
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { publicarSoloConImagen } from "../prisma/lib/product-images";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const prisma = new PrismaClient();
  try {
    console.log(dryRun ? "[dry-run]" : "[aplicado]", await publicarSoloConImagen(prisma, dryRun));
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
