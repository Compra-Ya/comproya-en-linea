/**
 * Orquesta la siembra completa de la base de datos, módulo por módulo, en
 * el orden que exigen las llaves foráneas: catálogo → cuenta → carrito →
 * pedido → pago. Cada paso es el mismo script que se puede correr suelto
 * (`npm run seed`, `npm run seed:account`, etc.) — este script solo los
 * encadena.
 *
 * Uso: npm run seed:all
 */

import { execFileSync } from "node:child_process";

const STEPS = [
  ["seed.ts", "catálogo (categorías, productos, sucursales, disponibilidad)"],
  ["seed-account.ts", "cuenta (clientes, consentimiento)"],
  ["seed-cart.ts", "carrito (carritos, ítems, complementarios)"],
  ["seed-order.ts", "pedido (pedidos, reservas, historial, cupones)"],
  ["seed-payment.ts", "pago (pagos)"],
] as const;

for (const [script, label] of STEPS) {
  console.log(`\n=== Sembrando ${label} ===`);
  execFileSync("npx", ["ts-node", `prisma/${script}`], { stdio: "inherit", shell: true });
}

console.log("\n✓ Base de datos sembrada por completo.");
