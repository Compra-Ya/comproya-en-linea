/**
 * Siembra del catálogo digital de ComproYa en Línea.
 *
 * Combina productos reales de DummyJSON (~194, fijos y sin riesgo legal —
 * nada de scraping a Falabella/IKEA/MercadoLibre) con productos sintéticos
 * generados con Faker dentro de las mismas categorías, hasta superar el
 * objetivo (por defecto 1200, para quedar cómodamente sobre 1000).
 *
 * Uso:
 *   npm run seed                  → siembra la base de datos (usa DATABASE_URL)
 *   npm run seed -- --dry-run     → genera y valida los datos sin tocar la BD
 *   TARGET_PRODUCTS=1500 npm run seed → cambia el objetivo de productos
 */

import { fetchAllDummyProducts, fetchDummyCategories } from "./lib/dummyjson";
import { buildFromDummy, completeCatalog } from "./lib/generate-catalog";
import { BRANCHES, generateAvailability } from "./lib/generate-branches";
import type { ProductSeed } from "./lib/types";

const TARGET_PRODUCTS = Number(process.env.TARGET_PRODUCTS ?? 1200);
const DRY_RUN = process.argv.includes("--dry-run") || process.env.DRY_RUN === "1";

function validateInvariants(catalog: ProductSeed[]) {
  const codes = new Set<string>();
  for (const p of catalog) {
    if (codes.has(p.homologatedCode)) {
      throw new Error(`Código homologado duplicado: ${p.homologatedCode}`);
    }
    codes.add(p.homologatedCode);

    if (p.cost >= p.digitalPrice) {
      throw new Error(
        `RN-02 violada: costo (${p.cost}) >= precio digital (${p.digitalPrice}) en ${p.homologatedCode}`
      );
    }
  }
  if (catalog.length < TARGET_PRODUCTS) {
    throw new Error(
      `Catálogo insuficiente: ${catalog.length} < objetivo ${TARGET_PRODUCTS}`
    );
  }
}

async function buildCatalog(): Promise<ProductSeed[]> {
  console.log("→ Descargando catálogo base real (DummyJSON)...");
  const [dummyProducts, categories] = await Promise.all([
    fetchAllDummyProducts(),
    fetchDummyCategories(),
  ]);
  console.log(`  ${dummyProducts.length} productos reales, ${categories.length} categorías`);

  const base = buildFromDummy(dummyProducts);
  const catalog = completeCatalog(base, categories, TARGET_PRODUCTS);
  console.log(
    `→ Catálogo final: ${catalog.length} productos ` +
      `(${base.length} reales + ${catalog.length - base.length} sintéticos)`
  );

  validateInvariants(catalog);
  console.log("→ Invariantes OK: sin códigos duplicados, RN-02 respetada en todos los productos");

  return catalog;
}

async function seedCatalog(catalog: ProductSeed[]) {
  // Import diferido: en modo --dry-run no hace falta que exista @prisma/client
  // generado ni una DATABASE_URL configurada.
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    console.log("→ Creando categorías...");
    const categoryNames = [...new Set(catalog.map((p) => p.category))];
    for (const name of categoryNames) {
      await prisma.category.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }
    const categoriesDb = await prisma.category.findMany();
    const categoryIdByName = new Map(
      categoriesDb.map((c: { name: string; id: number }) => [c.name, c.id])
    );

    console.log("→ Insertando productos en lotes de 500...");
    const BATCH_SIZE = 500;
    for (let i = 0; i < catalog.length; i += BATCH_SIZE) {
      const batch = catalog.slice(i, i + BATCH_SIZE);
      await prisma.product.createMany({
        data: batch.map((p) => ({
          homologatedCode: p.homologatedCode,
          name: p.name,
          categoryId: categoryIdByName.get(p.category)!,
          brand: p.brand,
          cost: p.cost,
          digitalPrice: p.digitalPrice,
          published: p.published,
          source: p.source,
        })),
        skipDuplicates: true,
      });
      console.log(`  ${Math.min(i + BATCH_SIZE, catalog.length)}/${catalog.length}`);
    }

    console.log("→ Creando sucursales...");
    for (const b of BRANCHES) {
      await prisma.branch.upsert({
        where: { name: b.name },
        update: {},
        create: b,
      });
    }
    const branchesDb = await prisma.branch.findMany();
    const productsDb = await prisma.product.findMany({ select: { id: true } });

    console.log(
      `→ Generando disponibilidad (${productsDb.length} productos × ${branchesDb.length} sucursales)...`
    );
    const AVAILABILITY_BATCH_SIZE = 1000;
    let rows: {
      productId: number;
      branchId: number;
      erpUnits: number;
      safetyThreshold: number;
      reservedUnits: number;
      syncedAt: Date;
    }[] = [];

    for (const product of productsDb) {
      for (const branch of branchesDb) {
        rows.push({ productId: product.id, branchId: branch.id, ...generateAvailability() });
      }
      if (rows.length >= AVAILABILITY_BATCH_SIZE) {
        await prisma.availability.createMany({ data: rows, skipDuplicates: true });
        rows = [];
      }
    }
    if (rows.length > 0) {
      await prisma.availability.createMany({ data: rows, skipDuplicates: true });
    }

    const totalAvailability = await prisma.availability.count();
    console.log(`✓ Siembra completa: ${productsDb.length} productos, ${totalAvailability} filas de disponibilidad`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const catalog = await buildCatalog();

  if (DRY_RUN) {
    console.log("→ --dry-run: no se escribió nada en la base de datos.");
    console.log("  Muestra de 3 productos:", catalog.slice(0, 3));
    return;
  }

  await seedCatalog(catalog);
}

main().catch((err) => {
  console.error("✗ Falló la siembra:", err);
  process.exit(1);
});
