// Aplica el manifiesto de imágenes a Product.imageUrl (idempotente) y escribe
// design/imagenes-origen.csv. Por defecto usa DATABASE_URL de backend/.env.
//
// Uso:  npx ts-node scripts/apply-product-images.ts [--dry-run] [--csv=<ruta>]
// Contra una base desplegada: SOLO con confirmación explícita (ver
// design/plan-ejecucion-bd-desplegada.md); empezar siempre con --dry-run.
import "dotenv/config";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { PrismaClient } from "@prisma/client";
import { aplicarImagenes, filasACsv, ManifiestoImagenes } from "../prisma/lib/product-images";
import { traducirNombre } from "../prisma/lib/traducir-nombres";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const csvRuta = resolve(process.argv.find((a) => a.startsWith("--csv="))?.split("=")[1] ?? join(__dirname, "../../design/imagenes-origen.csv"));
  const manifiesto: ManifiestoImagenes = JSON.parse(readFileSync(join(__dirname, "../prisma/data/imagenes-manifest.json"), "utf8"));
  // Los títulos de DummyJSON también valen con su nombre ya traducido (el script se puede correr antes o después).
  for (const titulo of Object.keys(manifiesto.dummyjson)) {
    manifiesto.dummyjson[traducirNombre(titulo)] ??= manifiesto.dummyjson[titulo];
  }
  const prisma = new PrismaClient();
  try {
    const r = await aplicarImagenes(prisma, manifiesto, dryRun);
    const { filasOrigen, ...resumen } = r;
    console.log(dryRun ? "[dry-run]" : "[aplicado]", resumen);
    const porTienda: Record<string, number> = {};
    for (const f of filasOrigen) porTienda[f.fuente.tienda] = (porTienda[f.fuente.tienda] ?? 0) + 1;
    console.log("Productos con imagen por tienda:", porTienda);
    if (!dryRun) {
      mkdirSync(dirname(csvRuta), { recursive: true });
      writeFileSync(csvRuta, filasACsv(filasOrigen));
      console.log("CSV:", csvRuta);
    }
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
