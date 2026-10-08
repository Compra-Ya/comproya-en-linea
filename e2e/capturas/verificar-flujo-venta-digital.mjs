// Recorre la venta digital completa en el navegador, a 1440 y 390 px: producto con cantidad, carrito,
// datos y envío (con errores de validación), pago (llega a la pasarela de Stripe en modo de prueba),
// pedido confirmado y mis pedidos. Mide el desborde horizontal en cada paso y guarda capturas en
// design/verificacion-rediseno/flujo-*.png.
//
//   cd e2e && node capturas/verificar-flujo-venta-digital.mjs
//
// Requiere base local, backend en :3001 y frontend en :3000. El webhook de Stripe no está disponible
// aquí: para ver la pantalla "Pedido confirmado" se marca el pago como confirmado en la base LOCAL.
import { chromium, request as pwRequest } from "@playwright/test";
import { execFileSync } from "child_process";
import { mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const SALIDA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../design/verificacion-rediseno");
mkdirSync(SALIDA, { recursive: true });
const WEB = "http://localhost:3000";
const API = "http://localhost:3001/api";
const ID_PRODUCTO = 209;
const api = await pwRequest.newContext();
const filas = [];

function sql(consulta) {
  execFileSync("docker", ["exec", "comproya-en-linea-db-1", "psql", "-U", "postgres", "-d", "comproya", "-c", consulta], { stdio: "pipe" });
}

const navegador = await chromium.launch();
for (const ancho of [1440, 390]) {
  const sufijo = `${ancho}${Date.now().toString().slice(-6)}`;
  const reg = await (await api.post(`${API}/cuenta/registro`, {
    data: { document: `FLU${sufijo}`, name: `Cliente Flujo ${sufijo}`, email: `flu${sufijo}@comproya-test.local`, password: "claveClave1" },
  })).json();

  const ctx = await navegador.newContext({ viewport: { width: ancho, height: ancho === 390 ? 844 : 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(({ token, id, name }) => {
    localStorage.setItem("comproya_token", token);
    localStorage.setItem("comproya_customer", JSON.stringify({ id, name }));
  }, { token: reg.accessToken, id: reg.customer.id, name: reg.customer.name });

  const paso = async (nombre, extra = {}) => {
    await page.waitForLoadState("networkidle").catch(() => undefined);
    const m = await page.evaluate(() => ({ ventana: window.innerWidth, contenido: document.documentElement.scrollWidth, h1: document.querySelector("h1")?.textContent ?? "" }));
    await page.screenshot({ path: path.join(SALIDA, `flujo-${nombre}-${ancho}.png`), fullPage: true });
    filas.push({ ancho, paso: nombre, h1: m.h1.slice(0, 32), sinDesborde: m.contenido <= m.ventana, ...extra });
  };

  // 1. Producto: cantidad 2 y agregar
  await page.goto(`${WEB}/producto/${ID_PRODUCTO}`);
  await page.waitForSelector(".detalle-compra");
  await page.getByRole("button", { name: "Aumentar cantidad" }).click();
  await paso("1-producto");
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await page.waitForSelector(".cy-notice-ok");
  await paso("2-producto-agregado");

  // 2. Carrito
  await page.goto(`${WEB}/carrito`);
  await page.waitForSelector(".linea-carrito");
  await paso("3-carrito", { cantidad: await page.locator(".cy-stepper span").first().textContent() });

  // 3. Datos y envío: primero vacío (errores), luego completo
  await page.getByRole("button", { name: "Continuar con tus datos de envío" }).click();
  await page.waitForURL(/\/pedido\/confirmar/);
  await page.waitForSelector("#envio-telefono");
  await page.getByLabel("Nombre completo").fill("");
  await page.getByRole("button", { name: "Continuar al pago" }).click();
  await page.waitForSelector(".error-campo");
  await paso("4-datos-errores", { errores: await page.locator(".error-campo").count() });
  await page.getByLabel("Nombre completo").fill("Ana Pérez");
  await page.getByLabel("Teléfono de contacto").fill("300 123 4567");
  await page.getByLabel("Dirección de envío").fill("Calle 10 # 5-20, apto 301");
  await page.getByLabel("Ciudad").fill("Bogotá");
  await page.getByLabel(/Indicaciones/).fill("Portería, piso 3");
  await paso("5-datos-completos");
  await page.getByRole("button", { name: "Continuar al pago" }).click();
  await page.waitForURL(/\/pago\/\d+/);
  const orderId = Number(page.url().match(/\/pago\/(\d+)/)[1]);
  await page.waitForSelector(".detalle-compra, .confirmar-grid");
  await paso("6-pago", { pedido: orderId });

  // 4. Pasarela: se espera la redirección a Stripe (no se paga aquí)
  await page.getByRole("button", { name: "Pagar con tarjeta" }).click();
  let pasarela = "no redirigió";
  try {
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 25_000 });
    pasarela = new URL(page.url()).host;
  } catch {
    pasarela = (await page.locator(".cy-notice-danger").first().textContent().catch(() => "sin aviso")) ?? "sin aviso";
  }
  filas.push({ ancho, paso: "7-pasarela", h1: pasarela.slice(0, 60) });

  // 5. Pedido confirmado (pago marcado como confirmado en la base local)
  sql(`update payments set status = 'CONFIRMED', confirmed_at = now() where order_id = ${orderId}; update orders set status = 'PAID' where id = ${orderId};`);
  await page.goto(`${WEB}/comprobante/${orderId}`);
  await page.waitForSelector(".confirmado-cabecera", { timeout: 20_000 });
  const textoConfirmado = await page.locator("main").innerText();
  await paso("8-pedido-confirmado", {
    muestraDireccion: textoConfirmado.includes("Calle 10 # 5-20"),
    sinCodigoDeRetiro: !/código de retiro/i.test(textoConfirmado),
  });

  await page.goto(`${WEB}/pedidos`);
  await page.waitForSelector(".pedido-fila");
  await paso("9-mis-pedidos");
  await ctx.close();
}
await navegador.close();
console.table(filas);
if (filas.some((f) => f.sinDesborde === false)) {
  console.error("Hay desplazamiento horizontal en algún paso");
  process.exit(1);
}
