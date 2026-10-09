// Lista los controles que ve el participante en cada zona de la interfaz (nombre accesible, tipo y si es solo ícono),
// leídos del portal en ejecución. Sirve para fijar el denominador del caso de prueba 2 (comprensión de íconos y textos):
// el inventario del documento sale de aquí, no de memoria.
//
//   cd e2e && node usabilidad/inventario-controles.mjs
//
// Requiere base local, backend en :3001 y frontend en :3000.
import { chromium, request as pwRequest } from "@playwright/test";

const WEB = "http://localhost:3000";
const API = "http://localhost:3001/api";
const api = await pwRequest.newContext();
const sufijo = Date.now().toString().slice(-7);
const reg = await (await api.post(`${API}/cuenta/registro`, {
  data: { document: `INV${sufijo}`, name: "Inventario Controles", email: `inv${sufijo}@comproya-test.local`, password: "claveClave1" },
})).json();
const [licuadora] = (await (await api.get(`${API}/catalogo/productos?q=licuadora`)).json()).items;
await api.post(`${API}/carrito/items`, { headers: { Authorization: `Bearer ${reg.accessToken}` }, data: { productId: licuadora.id, quantity: 1 } });

// Se ejecuta dentro de la página: controles visibles dentro de un contenedor.
function controles(selector) {
  const raiz = document.querySelector(selector);
  if (!raiz) return null;
  const visible = (el) => el.getClientRects().length > 0;
  const nombre = (el) =>
    (el.getAttribute("aria-label") || el.innerText || el.getAttribute("title") || el.getAttribute("placeholder") || "").replace(/\s+/g, " ").trim();
  return [...raiz.querySelectorAll("a[href], button, input:not([type=hidden]), select, textarea, [role=tooltip]")]
    .filter((el) => el.getAttribute("role") === "tooltip" || visible(el))
    .map((el) => ({
      tipo: el.getAttribute("role") === "tooltip" ? "tooltip" : el.tagName.toLowerCase(),
      nombre: nombre(el),
      textoVisible: (el.innerText || "").replace(/\s+/g, " ").trim(),
      soloIcono: !(el.innerText || "").trim() && !!el.querySelector("svg"),
      tieneIcono: !!el.querySelector("svg"),
    }));
}

const navegador = await chromium.launch();
const salida = {};
for (const [nombre, sesion, ruta, zonas] of [
  ["invitado", false, "/", { cabecera: "header, .cy-header, [class*=utility]", tarjeta: ".cy-pcard", carrusel: ".cy-carousel" }],
  ["con-sesion", true, "/carrito", { cabeceraConSesion: "header, .cy-header", lineaCarrito: ".cy-li", resumen: ".cy-summary" }],
]) {
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 }, locale: "es-CO" });
  const page = await ctx.newPage();
  if (sesion) {
    await page.addInitScript(({ token, customer }) => {
      localStorage.setItem("comproya_token", token);
      localStorage.setItem("comproya_customer", JSON.stringify(customer));
    }, { token: reg.accessToken, customer: { id: reg.customer.id, name: reg.customer.name } });
  }
  await page.goto(WEB + ruta);
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(800);
  for (const [zona, selector] of Object.entries(zonas)) {
    salida[`${nombre}:${zona}`] = await page.evaluate(controles, selector);
  }
  if (nombre === "invitado") {
    salida["invitado:navegacion"] = await page.evaluate(controles, "nav");
    salida["invitado:barraSuperior"] = await page.evaluate(() => [...document.querySelectorAll("body > div:first-child > div:first-child, [class*=utility]")].slice(0, 1).map((e) => e.innerText.replace(/\s+/g, " ").trim()));
  }
  await ctx.close();
}
await navegador.close();
console.log(JSON.stringify(salida, null, 1));
