// Verifica /pedido/confirmar rediseñada: sin desplazamiento horizontal a 390 y 1440 px, y
// los estados de error con Notice. Guarda capturas en design/verificacion-rediseno/.
//
//   cd e2e && node capturas/verificar-confirmar-pedido.mjs
//
// Requiere base local, backend en :3001 y frontend en :3000 (ver capturar-estado-actual.mjs).
import { chromium, request as pwRequest } from "@playwright/test";
import { mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SALIDA = path.resolve(AQUI, "../../design/verificacion-rediseno");
const WEB = "http://localhost:3000";
const API = "http://localhost:3001/api";
const ID_TV = 2405;
const ID_SILLA = 209;
const SUC_SYNC = 6;
const SUC_STALE = 3;

mkdirSync(SALIDA, { recursive: true });
const api = await pwRequest.newContext();
await api.post(`${API}/catalogo/sucursales/${SUC_SYNC}/sincronizar`);

const sufijo = Date.now().toString().slice(-8);
const reg = await (await api.post(`${API}/cuenta/registro`, {
  data: { document: `VER${sufijo}`, name: `Cliente Verificacion ${sufijo}`, email: `ver${sufijo}@comproya-test.local`, password: "claveClave1" },
})).json();
const auth = { Authorization: `Bearer ${reg.accessToken}` };
await api.post(`${API}/cuenta/consentimiento`, { headers: auth, data: { activo: true } });
await api.post(`${API}/carrito/items`, { headers: auth, data: { productId: ID_TV, quantity: 1 } });
await api.post(`${API}/carrito/items`, { headers: auth, data: { productId: ID_SILLA, quantity: 2 } });

const navegador = await chromium.launch();
const resultados = [];

for (const ancho of [390, 1440]) {
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: ancho === 390 ? 844 : 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(({ token, id, name }) => {
    localStorage.setItem("comproya_token", token);
    localStorage.setItem("comproya_customer", JSON.stringify({ id, name }));
  }, { token: reg.accessToken, id: reg.customer.id, name: reg.customer.name });

  const medir = async (estado) => {
    await page.waitForLoadState("networkidle").catch(() => undefined);
    const m = await page.evaluate(() => ({
      anchoVentana: window.innerWidth,
      anchoContenido: document.documentElement.scrollWidth,
      titulo: document.querySelector("h1")?.textContent,
      paso: document.querySelector(".cy-steps-mobile")?.textContent,
    }));
    await page.screenshot({ path: path.join(SALIDA, `confirmar-${estado}-${ancho}.png`), fullPage: true });
    resultados.push({ ancho, estado, ...m, sinDesborde: m.anchoContenido <= m.anchoVentana });
  };

  await page.goto(`${WEB}/pedido/confirmar`);
  await page.waitForSelector("h1");
  await page.waitForSelector(".confirmar-grid");
  await medir("normal");

  // Sucursal sin sincronizar -> aviso en lenguaje de cliente, junto al botón.
  await page.locator("select").selectOption(String(SUC_STALE));
  await page.getByRole("button", { name: "Confirmar pedido" }).click();
  await page.waitForSelector(".cy-notice-danger");
  await medir("error-sucursal");

  // Cupón inválido -> un solo aviso, junto al cupón, con "Quitar cupón".
  await page.locator("select").selectOption(String(SUC_SYNC));
  await page.getByLabel("Cupón de lealtad").fill("FALSO99");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await page.getByRole("button", { name: "Confirmar pedido" }).click();
  await page.waitForSelector(".cupon .cy-notice-danger");
  const avisosJuntos = await page.locator(".cy-notice").count();
  resultados.push({ ancho, estado: "cupon-invalido: avisos visibles (info + danger no deben convivir)", avisos: avisosJuntos });
  await medir("error-cupon");
  await ctx.close();
}
await navegador.close();
console.table(resultados.map((r) => ({ ...r })));
const fallos = resultados.filter((r) => r.sinDesborde === false);
if (fallos.length) {
  console.error("Hay desplazamiento horizontal en:", fallos.map((f) => `${f.estado} @${f.ancho}`).join(", "));
  process.exit(1);
}
