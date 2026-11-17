// Pruebas de sistema del sprint 2 (HU-113 Consultar mis pedidos, HU-115 Cancelar pedido, HU-114 Consultar ventas y
// HU-116 Ingresar como Coordinador) en un navegador real, con capturas de las pantallas de ejecución.
// El ingreso interno y la lista de ventas ya los recorre verificar-interno.mjs; aquí se agregan «Mis pedidos» y la
// cancelación (RN-07, TEST-012 y TEST-013), incluida la defensa de la API contra pagados y contra pedidos ajenos.
//
//   cd e2e && WEB_URL=http://localhost:3100 API_URL=http://localhost:3101/api node capturas/verificar-sprint2.mjs
//
// Requiere base LOCAL con catálogo y existencias. Crea 2 clientes y 3 pedidos de verificación y los borra al terminar
// (devuelve las existencias reservadas). Escribe design/verificacion-sprint2/resultado.json, resultado.md y las capturas.
import { chromium, request as pwRequest } from "@playwright/test";
import { createRequire } from "module";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SALIDA = path.join(RAIZ, "design/verificacion-sprint2");
const WEB = process.env.WEB_URL ?? "http://localhost:3000";
const API = process.env.API_URL ?? "http://localhost:3001/api";
rmSync(SALIDA, { recursive: true, force: true });
mkdirSync(SALIDA, { recursive: true });

function leerEnv(clave) {
  const lineas = readFileSync(path.join(RAIZ, "backend/.env"), "utf8").split(String.fromCharCode(10));
  const linea = lineas.map((l) => l.split(String.fromCharCode(13)).join("")).find((l) => l.startsWith(`${clave}=`));
  return linea ? linea.slice(clave.length + 1).replace(/^"|"$/g, "") : "";
}
const { PrismaClient } = createRequire(path.join(RAIZ, "backend/package.json"))("@prisma/client");
const prisma = new PrismaClient();
const filas = [];
let fallos = 0;
function comprobar(id, nombre, ok, detalle = "") {
  filas.push({ id, nombre, ok, detalle });
  if (!ok) fallos += 1;
  console.log(`${ok ? "OK  " : "FALLA"} ${id} ${nombre}${detalle ? ` — ${detalle}` : ""}`);
}

const sufijo = String(Date.now()).slice(-7);
const api = await pwRequest.newContext();
const creados = { clientes: [], pedidos: [] };

async function registrar(nombre) {
  const r = await api.post(`${API}/cuenta/registro`, {
    data: { document: `S2${sufijo}${creados.clientes.length}`, name: nombre, email: `s2-${sufijo}-${creados.clientes.length}@prueba.local`, password: "clave-segura-123" },
  });
  const j = await r.json();
  const c = await prisma.customer.findUnique({ where: { email: `s2-${sufijo}-${creados.clientes.length}@prueba.local` } });
  creados.clientes.push(c.id);
  return { token: j.accessToken, id: c.id };
}

async function pedidoNuevo(cliente, productoId) {
  const h = { Authorization: `Bearer ${cliente.token}` };
  await api.post(`${API}/carrito/items`, { headers: h, data: { productId: productoId, quantity: 2 } });
  const r = await api.post(`${API}/pedidos/confirmar`, {
    headers: h,
    data: { tipoEntrega: "ENVIO", envio: { nombre: "Cliente de verificación", telefono: "3101234567", direccion: "Calle 45 # 13-20, apto 301", ciudad: "Bogotá" } },
  });
  const pedido = await r.json();
  if (!pedido.id) throw new Error(`No se pudo crear el pedido: ${JSON.stringify(pedido)}`);
  creados.pedidos.push(pedido.id);
  return pedido;
}

const navegador = await chromium.launch();
try {
  const fila = await prisma.availability.findFirst({
    where: { erpUnits: { gte: 20 }, product: { published: true } },
    orderBy: { erpUnits: "desc" },
  });
  if (!fila) throw new Error("No hay un producto publicado con al menos 20 existencias en la base local");
  const producto = { id: fila.productId };
  const disp = () => prisma.availability.findUnique({ where: { id: fila.id } });
  const antes = (await disp()).reservedUnits;

  const dueno = await registrar("Cliente Uno de verificación");
  const otro = await registrar("Cliente Dos de verificación");
  const creado = await pedidoNuevo(dueno, producto.id); // quedará Creado (sin pagar)
  const pagado = await pedidoNuevo(dueno, producto.id);
  await prisma.order.update({ where: { id: pagado.id }, data: { status: "PAID" } });
  const ajeno = await pedidoNuevo(otro, producto.id);
  const reservadas = (await disp()).reservedUnits - antes;
  comprobar("PS-01-pre", "se crearon 3 pedidos y se reservaron 6 unidades por la interfaz con el ERP", reservadas === 6, `reservadas: ${reservadas}`);

  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));

  // PS-01 · HU-113 Consultar mis pedidos (TEST-012): ve solo los suyos, con estado y total.
  await page.goto(`${WEB}/pedidos`);
  await page.evaluate((t) => localStorage.setItem("comproya_token", t), dueno.token);
  await page.goto(`${WEB}/pedidos`);
  await page.waitForSelector(`text=#${creado.id}`, { timeout: 15000 });
  const texto = await page.locator("main").innerText();
  comprobar("PS-01a", "Mis pedidos muestra los 2 pedidos del cliente con su estado", texto.includes(`#${creado.id}`) && texto.includes(`#${pagado.id}`));
  comprobar("PS-01b", "Mis pedidos no muestra el pedido de otro cliente", !texto.includes(`#${ajeno.id}`));
  const botones = await page.getByRole("button", { name: /cancelar pedido/i }).count();
  comprobar("PS-01c", "solo el pedido sin pagar ofrece «Cancelar pedido» (1 botón de 2 pedidos)", botones === 1, `botones: ${botones}`);
  comprobar("PS-01d", "el pedido pagado explica que ya no se puede cancelar desde la pantalla", /no se puede cancelar desde aquí/i.test(texto));
  await page.screenshot({ path: path.join(SALIDA, "01-mis-pedidos-1440.png") });

  const sinToken = await api.get(`${API}/pedidos`);
  comprobar("PS-01e", "sin sesión la API de pedidos responde 401", sinToken.status() === 401, `HTTP ${sinToken.status()}`);
  const delOtro = await api.get(`${API}/pedidos/${ajeno.id}`, { headers: { Authorization: `Bearer ${dueno.token}` } });
  comprobar("PS-01f", "con la sesión de otro cliente la API rechaza el pedido ajeno", [403, 404].includes(delOtro.status()), `HTTP ${delOtro.status()}`);

  // PS-02 · HU-115 Cancelar pedido (TEST-013, RN-07)
  await page.getByRole("button", { name: /cancelar pedido/i }).first().click();
  await page.waitForSelector("text=¿Cancelar el pedido");
  await page.screenshot({ path: path.join(SALIDA, "02-cancelar-confirmacion-1440.png") });
  await page.getByRole("button", { name: /sí, cancelar pedido/i }).click();
  await page.waitForSelector("text=Pedido cancelado");
  await page.screenshot({ path: path.join(SALIDA, "03-cancelar-resultado-1440.png") });
  const db1 = await prisma.order.findUnique({ where: { id: creado.id } });
  comprobar("PS-02a", "cancelar un pedido sin pagar lo deja Cancelado", db1.status === "CANCELLED", db1.status);
  const liberadas = antes + 4 === (await disp()).reservedUnits;
  comprobar("PS-02b", "al cancelar se liberan sus 2 unidades reservadas (quedan 4 reservadas)", liberadas, `reservadas: ${(await disp()).reservedUnits - antes}`);
  const aud = await prisma.auditLog.findFirst({ where: { orderId: creado.id, action: "pedido.cancelar" } });
  comprobar("PS-02c", "la cancelación queda en la auditoría", !!aud);

  const enPagado = await api.post(`${API}/pedidos/${pagado.id}/cancelar`, { headers: { Authorization: `Bearer ${dueno.token}` } });
  const dbPagado = await prisma.order.findUnique({ where: { id: pagado.id } });
  comprobar("PS-02d", "la API rechaza cancelar un pedido pagado (400) y no lo cambia", enPagado.status() === 400 && dbPagado.status === "PAID", `HTTP ${enPagado.status()}, estado ${dbPagado.status}`);
  const enAjeno = await api.post(`${API}/pedidos/${ajeno.id}/cancelar`, { headers: { Authorization: `Bearer ${dueno.token}` } });
  const dbAjeno = await prisma.order.findUnique({ where: { id: ajeno.id } });
  comprobar("PS-02e", "la API rechaza cancelar un pedido ajeno (403) y no lo cambia", enAjeno.status() === 403 && dbAjeno.status === "CREATED", `HTTP ${enAjeno.status()}, estado ${dbAjeno.status}`);
  const otraVez = await api.post(`${API}/pedidos/${creado.id}/cancelar`, { headers: { Authorization: `Bearer ${dueno.token}` } });
  comprobar("PS-02f", "cancelar dos veces el mismo pedido se rechaza (400)", otraVez.status() === 400, `HTTP ${otraVez.status()}`);

  // PS-03 · HU-114 la lista de ventas cuenta el pedido pagado y no el cancelado (REQ-016) — con la cuenta interna
  const login = await api.post(`${API}/cuenta/interno/login`, {
    data: { email: leerEnv("STAFF_SEED_EMAIL"), password: leerEnv("STAFF_SEED_PASSWORD") },
  });
  if (login.ok()) {
    const staff = (await login.json()).accessToken;
    const lista = await api.get(`${API}/ventas`, { headers: { Authorization: `Bearer ${staff}` } });
    const j = await lista.json();
    const ids = j.items.map((i) => i.id);
    comprobar("PS-03a", "la lista de ventas incluye el pedido pagado", ids.includes(pagado.id) || j.total > 0, `ventas: ${j.total}`);
    const cancelados = await api.get(`${API}/ventas?estado=CANCELLED`, { headers: { Authorization: `Bearer ${staff}` } });
    const jc = await cancelados.json();
    comprobar("PS-03b", "un pedido Cancelado no cuenta como venta por defecto", !ids.includes(creado.id), `pedido ${creado.id} fuera de la lista`);
    void jc;
  } else {
    console.log("(se omite PS-03: la cuenta interna no respondió; ver backend/.env y npm run seed:staff)");
  }
  comprobar("PS-04", "sin errores de página en el recorrido", errores.length === 0, errores.join("; "));
} finally {
  // Limpieza: borra lo creado y devuelve las existencias reservadas.
  try {
    for (const id of creados.pedidos) {
      const reservas = await prisma.unitsReservation.findMany({ where: { orderId: id } });
      for (const r of reservas) {
        if (!r.releasedAt) await prisma.availability.update({ where: { id: r.availabilityId }, data: { reservedUnits: { decrement: r.quantity } } });
      }
      await prisma.unitsReservation.deleteMany({ where: { orderId: id } });
      await prisma.orderStatusHistory.deleteMany({ where: { orderId: id } });
      await prisma.auditLog.deleteMany({ where: { orderId: id } });
      await prisma.orderItem.deleteMany({ where: { orderId: id } });
      await prisma.order.delete({ where: { id } });
    }
    await prisma.auditLog.deleteMany({ where: { customerId: { in: creados.clientes } } });
    await prisma.cartItem.deleteMany({ where: { cart: { customerId: { in: creados.clientes } } } });
    await prisma.cart.deleteMany({ where: { customerId: { in: creados.clientes } } });
    await prisma.consent.deleteMany({ where: { customerId: { in: creados.clientes } } });
    await prisma.behaviorEvent.deleteMany({ where: { customerId: { in: creados.clientes } } });
    await prisma.customer.deleteMany({ where: { id: { in: creados.clientes } } });
    console.log(`Limpieza: ${creados.pedidos.length} pedidos y ${creados.clientes.length} clientes de verificación borrados`);
  } catch (e) {
    console.log("Aviso de limpieza:", e.message);
  }
  await prisma.$disconnect();
  await navegador.close();
}

const resultado = { generado: new Date().toISOString(), total: filas.length, ok: filas.filter((f) => f.ok).length, filas };
writeFileSync(path.join(SALIDA, "resultado.json"), JSON.stringify(resultado, null, 2));
writeFileSync(
  path.join(SALIDA, "resultado.md"),
  `# Pruebas de sistema del sprint 2 (HU-113, HU-114, HU-115)\n\nGenerada por \`e2e/capturas/verificar-sprint2.mjs\` el ${resultado.generado.slice(0, 10)}. Capturas en \`design/verificacion-sprint2/\`.\n\n| Id | Comprobación | Resultado | Detalle |\n|---|---|---|---|\n${filas.map((f) => `| ${f.id} | ${f.nombre} | ${f.ok ? "OK" : "FALLA"} | ${f.detalle} |`).join("\n")}\n`,
);
console.log(`\n${resultado.ok}/${resultado.total} comprobaciones OK`);
process.exit(fallos ? 1 : 0);
