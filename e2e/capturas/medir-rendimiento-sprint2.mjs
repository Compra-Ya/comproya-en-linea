// Mide el tiempo de respuesta de las consultas del sprint 2 (lista de ventas y mis pedidos) en el entorno local:
// 30 solicitudes por consulta, promedio, P95 y máximo. No es la prueba TEST-016 (40.000 productos y 900 pedidos por hora):
// es una referencia del backend local con la base de desarrollo.
//   cd e2e && API_URL=http://localhost:3101/api node capturas/medir-rendimiento-sprint2.mjs
import { createRequire } from "module";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const API = process.env.API_URL ?? "http://localhost:3001/api";
const SALIDA = path.join(RAIZ, "docs/entrega-2/evidencia");
mkdirSync(SALIDA, { recursive: true });
const NL = String.fromCharCode(10);
const CR = String.fromCharCode(13);
function leerEnv(clave) {
  const l = readFileSync(path.join(RAIZ, "backend/.env"), "utf8").split(NL).map((x) => x.split(CR).join("")).find((x) => x.startsWith(`${clave}=`));
  return l ? l.slice(clave.length + 1).replace(/^"|"$/g, "") : "";
}
const { PrismaClient } = createRequire(path.join(RAIZ, "backend/package.json"))("@prisma/client");
const prisma = new PrismaClient();

const login = await fetch(`${API}/cuenta/interno/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: leerEnv("STAFF_SEED_EMAIL"), password: leerEnv("STAFF_SEED_PASSWORD") }) });
const staff = (await login.json()).accessToken;
const sufijo = String(Date.now()).slice(-7);
const reg = await fetch(`${API}/cuenta/registro`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ document: `RP${sufijo}`, name: "Cliente de medición", email: `rp-${sufijo}@prueba.local`, password: "clave-segura-123" }) });
const cliente = (await reg.json()).accessToken;

async function medir(nombre, url, token, n = 30) {
  const t = [];
  await fetch(url, { headers: { Authorization: `Bearer ${token}` } }); // calentamiento, no se cuenta
  for (let i = 0; i < n; i++) {
    const ini = performance.now();
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    await r.text();
    if (!r.ok) throw new Error(`${nombre}: HTTP ${r.status}`);
    t.push(performance.now() - ini);
  }
  t.sort((a, b) => a - b);
  const p95 = t[Math.ceil(0.95 * t.length) - 1];
  return { consulta: nombre, solicitudes: n, promedioMs: +(t.reduce((a, b) => a + b, 0) / n).toFixed(1), p95Ms: +p95.toFixed(1), maximoMs: +t[n - 1].toFixed(1) };
}
const resultado = {
  generado: new Date().toISOString(),
  entorno: "backend NestJS local, PostgreSQL en Docker, base de desarrollo (2117 productos, 121 pedidos)",
  mediciones: [await medir("GET /ventas (20 filas y total vendido)", `${API}/ventas`, staff), await medir("GET /pedidos (mis pedidos)", `${API}/pedidos`, cliente)],
};
const c = await prisma.customer.findUnique({ where: { email: `rp-${sufijo}@prueba.local` } });
if (c) { await prisma.cart.deleteMany({ where: { customerId: c.id } }); await prisma.consent.deleteMany({ where: { customerId: c.id } }); await prisma.behaviorEvent.deleteMany({ where: { customerId: c.id } }); await prisma.customer.delete({ where: { id: c.id } }); }
await prisma.$disconnect();
writeFileSync(path.join(SALIDA, "rendimiento-sprint2.json"), JSON.stringify(resultado, null, 2));
console.log(JSON.stringify(resultado.mediciones, null, 1));
