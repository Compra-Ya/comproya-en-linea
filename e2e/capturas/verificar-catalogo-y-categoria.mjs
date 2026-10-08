// Verifica el catálogo (carrusel de categorías) y la página de categoría: sin desplazamiento
// horizontal de la página, carrusel en movimiento, enlaces a /categoria/[id] y productos visibles.
// Capturas en design/verificacion-rediseno/.   cd e2e && node capturas/verificar-catalogo-y-categoria.mjs
import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const SALIDA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../design/verificacion-rediseno");
mkdirSync(SALIDA, { recursive: true });
const WEB = "http://localhost:3000";
const navegador = await chromium.launch();
const filas = [];

for (const ancho of [1440, 390]) {
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: ancho === 390 ? 844 : 900 } });
  const page = await ctx.newPage();
  const medir = async (estado, extra = {}) => {
    await page.waitForLoadState("networkidle").catch(() => undefined);
    const m = await page.evaluate(() => ({ ventana: window.innerWidth, contenido: document.documentElement.scrollWidth }));
    await page.screenshot({ path: path.join(SALIDA, `${estado}-${ancho}.png`), fullPage: false });
    filas.push({ ancho, estado, ...m, sinDesborde: m.contenido <= m.ventana, ...extra });
  };

  await page.goto(WEB + "/");
  await page.waitForSelector(".carrusel-item");
  const antes = await page.locator(".carrusel-pista").evaluate((el) => el.scrollLeft);
  await page.waitForTimeout(1500);
  const despues = await page.locator(".carrusel-pista").evaluate((el) => el.scrollLeft);
  const primerosProductosY = await page.locator(".product-card").first().evaluate((el) => Math.round(el.getBoundingClientRect().top));
  await medir("catalogo", { carruselSeMueve: despues !== antes, primerProductoY: primerosProductosY, alturaVentana: page.viewportSize().height });

  const enlace = page.locator(".carrusel-item:not([aria-hidden])").nth(3);
  const destino = await enlace.getAttribute("href");
  await enlace.click({ force: true });
  await page.waitForURL(/\/categoria\/\d+/);
  await page.waitForSelector(".product-card");
  await medir("categoria", { destino, titulo: await page.locator("h1").first().textContent(), productos: await page.locator(".product-card").count() });
  await ctx.close();
}
await navegador.close();
console.table(filas);
if (filas.some((f) => f.sinDesborde === false || f.carruselSeMueve === false)) process.exit(1);
