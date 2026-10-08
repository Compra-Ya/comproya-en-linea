// Deja los precios del catálogo en COP: DummyJSON (USD) a una tasa fija y los sintéticos con un
// precio plausible por tipo. Idempotente; --dry-run para ensayar. Cambia products.digital_price y
// products.cost: contra una base desplegada solo con confirmación explícita y respaldo previo.
//   npx ts-node scripts/normalizar-precios-cop.ts [--dry-run]
// Lee los precios originales de DummyJSON (una solicitud, con caché y las reglas del scraper).
import "dotenv/config";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { normalizarPreciosCop, TASA_USD_COP } from "../prisma/lib/precios-cop";
import { traducirNombre } from "../prisma/lib/traducir-nombres";
import { ClienteEtico } from "./lib/cliente-etico";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const cliente = new ClienteEtico(join(__dirname, ".cache/http"));
  const respuesta = JSON.parse(
    (await cliente.obtener("https://dummyjson.com/products?limit=0&select=title,category,price")).toString("utf8")
  ) as { products: Array<{ title: string; category: string; price: number }> };
  const usd = new Map<string, number>();
  for (const p of respuesta.products) usd.set(`${traducirNombre(p.title)}|${p.category}`, p.price);

  const prisma = new PrismaClient();
  try {
    console.log(`Tasa: 1 USD = ${TASA_USD_COP} COP`);
    console.log(dryRun ? "[dry-run]" : "[aplicado]", await normalizarPreciosCop(prisma, usd, dryRun));
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
