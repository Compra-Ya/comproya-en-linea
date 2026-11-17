/**
 * Deja la base de datos con UNA sola sucursal y existencias unificadas (alcance reducido, docs/alcance; REQ-023).
 *
 * Qué hace, dentro de una sola transacción:
 *   1. Elige como destino la sucursal de menor id.
 *   2. Pasa todos los pedidos al destino.
 *   3. Por cada producto, deja UNA fila de disponibilidad en el destino con: existencias = suma de todas las sucursales,
 *      reservas = suma de las reservas, umbral de seguridad = el mayor, última sincronización = la más reciente.
 *   4. Reapunta las reservas de unidades a esa fila, borra las filas y las sucursales sobrantes y renombra el destino.
 *
 * Uso (desde backend/):
 *   npm run sucursal-unica -- --dry-run   → hace todo, muestra los conteos y DESHACE la transacción
 *   npm run sucursal-unica                → aplica el cambio
 *
 * Hace falta un respaldo antes de aplicarlo: el cambio no se puede deshacer sin él. Solo toca la base a la que apunta
 * DATABASE_URL; no se corre contra una base desplegada sin confirmación.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { BRANCHES } from "./lib/generate-branches";

const DRY_RUN = process.argv.includes("--dry-run") || process.env.DRY_RUN === "1";

class SimulacroTerminado extends Error {}

async function main() {
  const prisma = new PrismaClient();
  try {
    await prisma.$transaction(
      async (tx) => {
        const sucursales = await tx.branch.findMany({ orderBy: { id: "asc" } });
        console.log(`Sucursales antes: ${sucursales.length} (${sucursales.map((s) => s.name).join(", ")})`);
        const antes = await tx.availability.count();
        console.log(`Filas de disponibilidad antes: ${antes}`);
        if (sucursales.length === 0) throw new Error("No hay sucursales: siembra el catálogo primero (npm run seed)");

        const destino = sucursales[0];
        const nombreFinal = BRANCHES[0].name;
        if (sucursales.length === 1 && destino.name === nombreFinal) {
          console.log("Ya hay una sola sucursal; no hay nada que consolidar.");
          return;
        }

        const pedidos = await tx.$executeRaw`UPDATE orders SET branch_id = ${destino.id} WHERE branch_id <> ${destino.id}`;
        console.log(`Pedidos pasados a la sucursal destino: ${pedidos}`);

        const nuevas = await tx.$executeRaw`
          INSERT INTO availability (product_id, branch_id, erp_units, safety_threshold, reserved_units, synced_at)
          SELECT DISTINCT product_id, ${destino.id}, 0, 5, 0, now() FROM availability
          WHERE product_id NOT IN (SELECT product_id FROM availability WHERE branch_id = ${destino.id})`;
        console.log(`Filas creadas en el destino para productos que solo estaban en otras sucursales: ${nuevas}`);

        const unificadas = await tx.$executeRaw`
          UPDATE availability a
          SET erp_units = s.existencias, reserved_units = s.reservas, safety_threshold = s.umbral, synced_at = s.sincronizado
          FROM (
            SELECT product_id, SUM(erp_units)::int AS existencias, SUM(reserved_units)::int AS reservas,
                   MAX(safety_threshold) AS umbral, MAX(synced_at) AS sincronizado
            FROM availability GROUP BY product_id
          ) s
          WHERE a.product_id = s.product_id AND a.branch_id = ${destino.id}`;
        console.log(`Productos con existencias unificadas: ${unificadas}`);

        const reservas = await tx.$executeRaw`
          UPDATE units_reservations r SET availability_id = t.id
          FROM availability o, availability t
          WHERE r.availability_id = o.id AND o.branch_id <> ${destino.id}
            AND t.product_id = o.product_id AND t.branch_id = ${destino.id}`;
        console.log(`Reservas de unidades reapuntadas: ${reservas}`);

        const borradas = await tx.$executeRaw`DELETE FROM availability WHERE branch_id <> ${destino.id}`;
        console.log(`Filas de disponibilidad sobrantes borradas: ${borradas}`);
        const sucursalesBorradas = await tx.$executeRaw`DELETE FROM branches WHERE id <> ${destino.id}`;
        console.log(`Sucursales borradas: ${sucursalesBorradas}`);
        await tx.branch.update({ where: { id: destino.id }, data: { name: nombreFinal, city: BRANCHES[0].city } });

        // Comprobaciones de que no quedó nada colgando ni con unidades negativas.
        const [quedan] = await tx.$queryRaw<Array<{ sucursales: bigint; filas: bigint; huerfanas: bigint; negativas: bigint }>>`
          SELECT (SELECT COUNT(*) FROM branches) AS sucursales,
                 (SELECT COUNT(*) FROM availability) AS filas,
                 (SELECT COUNT(*) FROM units_reservations r WHERE NOT EXISTS (SELECT 1 FROM availability a WHERE a.id = r.availability_id)) AS huerfanas,
                 (SELECT COUNT(*) FROM availability WHERE erp_units - safety_threshold - reserved_units < 0) AS negativas`;
        console.log(`Después: ${quedan.sucursales} sucursal, ${quedan.filas} filas de disponibilidad, ${quedan.huerfanas} reservas huérfanas, ${quedan.negativas} filas con unidades negativas`);
        if (Number(quedan.sucursales) !== 1 || Number(quedan.huerfanas) !== 0) {
          throw new Error("La consolidación no dejó la base consistente; se deshace");
        }
        if (DRY_RUN) throw new SimulacroTerminado();
      },
      { timeout: 120_000, maxWait: 20_000 },
    );
    console.log(DRY_RUN ? "" : "✓ Consolidación aplicada.");
  } catch (e) {
    if (e instanceof SimulacroTerminado) {
      console.log("\n--dry-run: la transacción se deshizo; la base no cambió.");
    } else {
      throw e;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
