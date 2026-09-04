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

import { fetchTodosLosProductosDummy, fetchCategoriasDummy } from "./lib/dummyjson";
import { construirDesdeDummy, completarCatalogo } from "./lib/generar-catalogo";
import { SUCURSALES, generarDisponibilidad } from "./lib/generar-sucursales";
import type { ProductoSemilla } from "./lib/tipos";

const OBJETIVO_PRODUCTOS = Number(process.env.TARGET_PRODUCTS ?? 1200);
const DRY_RUN = process.argv.includes("--dry-run") || process.env.DRY_RUN === "1";

function validarInvariantes(catalogo: ProductoSemilla[]) {
  const codigos = new Set<string>();
  for (const p of catalogo) {
    if (codigos.has(p.codigoHomologado)) {
      throw new Error(`Código homologado duplicado: ${p.codigoHomologado}`);
    }
    codigos.add(p.codigoHomologado);

    if (p.costo >= p.precioDigital) {
      throw new Error(
        `RN-02 violada: costo (${p.costo}) >= precio digital (${p.precioDigital}) en ${p.codigoHomologado}`
      );
    }
  }
  if (catalogo.length < OBJETIVO_PRODUCTOS) {
    throw new Error(
      `Catálogo insuficiente: ${catalogo.length} < objetivo ${OBJETIVO_PRODUCTOS}`
    );
  }
}

async function construirCatalogo(): Promise<ProductoSemilla[]> {
  console.log("→ Descargando catálogo base real (DummyJSON)...");
  const [productosDummy, categorias] = await Promise.all([
    fetchTodosLosProductosDummy(),
    fetchCategoriasDummy(),
  ]);
  console.log(`  ${productosDummy.length} productos reales, ${categorias.length} categorías`);

  const base = construirDesdeDummy(productosDummy);
  const catalogo = completarCatalogo(base, categorias, OBJETIVO_PRODUCTOS);
  console.log(
    `→ Catálogo final: ${catalogo.length} productos ` +
      `(${base.length} reales + ${catalogo.length - base.length} sintéticos)`
  );

  validarInvariantes(catalogo);
  console.log("→ Invariantes OK: sin códigos duplicados, RN-02 respetada en todos los productos");

  return catalogo;
}

async function sembrarBaseDeDatos(catalogo: ProductoSemilla[]) {
  // Import diferido: en modo --dry-run no hace falta que exista @prisma/client
  // generado ni una DATABASE_URL configurada.
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    console.log("→ Creando categorías...");
    const nombresCategoria = [...new Set(catalogo.map((p) => p.categoria))];
    for (const nombre of nombresCategoria) {
      await prisma.categoria.upsert({
        where: { nombre },
        update: {},
        create: { nombre },
      });
    }
    const categoriasDb = await prisma.categoria.findMany();
    const idPorCategoria = new Map(
      categoriasDb.map((c: { nombre: string; id: number }) => [c.nombre, c.id])
    );

    console.log("→ Insertando productos en lotes de 500...");
    const TAMANO_LOTE = 500;
    for (let i = 0; i < catalogo.length; i += TAMANO_LOTE) {
      const lote = catalogo.slice(i, i + TAMANO_LOTE);
      await prisma.producto.createMany({
        data: lote.map((p) => ({
          codigoHomologado: p.codigoHomologado,
          nombre: p.nombre,
          categoriaId: idPorCategoria.get(p.categoria)!,
          costo: p.costo,
          precioDigital: p.precioDigital,
          publicado: p.publicado,
          fuente: p.fuente,
        })),
        skipDuplicates: true,
      });
      console.log(`  ${Math.min(i + TAMANO_LOTE, catalogo.length)}/${catalogo.length}`);
    }

    console.log("→ Creando sucursales...");
    for (const s of SUCURSALES) {
      await prisma.sucursal.upsert({
        where: { nombre: s.nombre },
        update: {},
        create: s,
      });
    }
    const sucursalesDb = await prisma.sucursal.findMany();
    const productosDb = await prisma.producto.findMany({ select: { id: true } });

    console.log(
      `→ Generando disponibilidad (${productosDb.length} productos × ${sucursalesDb.length} sucursales)...`
    );
    const TAMANO_LOTE_DISPONIBILIDAD = 1000;
    let filas: {
      productoId: number;
      sucursalId: number;
      existenciasErp: number;
      umbralSeguridad: number;
      unidadesReservadas: number;
      sincronizadoEn: Date;
    }[] = [];

    for (const producto of productosDb) {
      for (const sucursal of sucursalesDb) {
        filas.push({ productoId: producto.id, sucursalId: sucursal.id, ...generarDisponibilidad() });
      }
      if (filas.length >= TAMANO_LOTE_DISPONIBILIDAD) {
        await prisma.disponibilidad.createMany({ data: filas, skipDuplicates: true });
        filas = [];
      }
    }
    if (filas.length > 0) {
      await prisma.disponibilidad.createMany({ data: filas, skipDuplicates: true });
    }

    const totalDisponibilidad = await prisma.disponibilidad.count();
    console.log(`✓ Siembra completa: ${productosDb.length} productos, ${totalDisponibilidad} filas de disponibilidad`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const catalogo = await construirCatalogo();

  if (DRY_RUN) {
    console.log("→ --dry-run: no se escribió nada en la base de datos.");
    console.log("  Muestra de 3 productos:", catalogo.slice(0, 3));
    return;
  }

  await sembrarBaseDeDatos(catalogo);
}

main().catch((err) => {
  console.error("✗ Falló la siembra:", err);
  process.exit(1);
});
