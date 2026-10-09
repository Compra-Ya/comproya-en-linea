// Fase 4 del rediseño: recorre con teclado (solo Tab, Shift+Tab, Enter, Esc y escribir) el flujo completo de
// compra: producto → agregar → carrito → datos y envío (con cupón) → pago. En cada parada de Tab comprueba:
//   · que el control tenga un indicador de foco visible (contorno de 2 px o el anillo del campo del diseño),
//   · que tenga nombre accesible,
//   · que mida al menos 44 px en su lado menor (objetivo táctil), salvo enlaces dentro de un párrafo.
// También prueba que un tooltip se abre con el foco y se cierra con Esc, y que la ruta nunca queda atrapada.
//
//   cd e2e && node capturas/verificar-teclado.mjs
//
// Requiere base LOCAL, backend en :3001 y frontend en :3000. Escribe design/verificacion-rediseno/teclado.md y
// teclado.json, y capturas con el foco en design/verificacion-rediseno/teclado/*.png.
import { chromium, request as pwRequest } from "@playwright/test";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SALIDA = path.join(RAIZ, "design/verificacion-rediseno/teclado");
const WEB = "http://localhost:3000";
const API = "http://localhost:3001/api";
rmSync(SALIDA, { recursive: true, force: true });
mkdirSync(SALIDA, { recursive: true });

const api = await pwRequest.newContext();
const lista = await (await api.get(`${API}/catalogo/productos?page=1`)).json();
const producto = lista.items.find((p) => p.unidadesDisponibles >= 6);
const sufijo = Date.now().toString().slice(-7);

// Se ejecuta dentro de la página: describe el control que tiene el foco.
function describirFoco() {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const nombre = (() => {
    const aria = el.getAttribute("aria-label");
    if (aria) return aria.trim();
    const por = el.getAttribute("aria-labelledby");
    if (por) return por.split(" ").map((i) => document.getElementById(i)?.innerText ?? "").join(" ").trim();
    if (el.labels && el.labels.length) return [...el.labels].map((l) => l.innerText).join(" ").replace(/\s+/g, " ").trim();
    return (el.innerText || el.value || el.getAttribute("title") || el.getAttribute("placeholder") || "").replace(/\s+/g, " ").trim();
  })();
  const focoRgb = (() => {
    const t = document.createElement("span");
    t.style.color = getComputedStyle(document.documentElement).getPropertyValue("--focus").trim();
    document.body.appendChild(t);
    const c = getComputedStyle(t).color;
    t.remove();
    return c;
  })();
  // Indicador: contorno de ≥ 2 px, o el anillo/borde de foco de los campos (en el control o en sus 3 ancestros).
  let indicador = null;
  let cursor = el;
  for (let i = 0; i < 4 && cursor && !indicador; i += 1, cursor = cursor.parentElement) {
    const cs = getComputedStyle(cursor);
    if (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2 && cs.outlineColor !== "rgba(0, 0, 0, 0)") indicador = `contorno ${cs.outlineWidth}`;
    else if (cs.boxShadow !== "none" && /rgba?\(22, 61, 109/.test(cs.boxShadow)) indicador = "anillo de campo";
    else if (i > 0 ? false : cs.borderTopColor === focoRgb && cs.borderTopWidth !== "0px") indicador = "borde de foco";
  }
  const r = el.getBoundingClientRect();
  // Área de toque efectiva: la del control o la del pseudo-elemento invisible que la amplía (globals.css).
  const pa = getComputedStyle(el, "::after");
  const ampliada = pa.content !== "none" && pa.position === "absolute";
  const ancho = Math.max(r.width, ampliada ? parseFloat(pa.width) || 0 : 0);
  const alto = Math.max(r.height, ampliada ? parseFloat(pa.height) || 0 : 0);
  const enParrafo = !!el.closest("p, li") && el.tagName === "A" && getComputedStyle(el).display === "inline";
  return {
    etiqueta: el.tagName.toLowerCase(),
    clase: String(el.className || "").split(" ").filter(Boolean).slice(0, 2).join("."),
    nombre,
    indicador,
    ancho: Math.round(ancho),
    alto: Math.round(alto),
    enParrafo,
    visible: r.width > 0 && r.height > 0,
  };
}

async function recorrer(ancho, alto) {
  const reg = await (await api.post(`${API}/cuenta/registro`, {
    data: { document: `TEC${ancho}${sufijo}`, name: "Marta Prieto", email: `tec${ancho}${sufijo}@comproya-test.local`, password: "claveClave1" },
  })).json();
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: alto }, locale: "es-CO" });
  const page = await ctx.newPage();
  await page.addInitScript(({ token, customer }) => {
    localStorage.setItem("comproya_token", token);
    localStorage.setItem("comproya_customer", JSON.stringify(customer));
  }, { token: reg.accessToken, customer: { id: reg.customer.id, name: reg.customer.name } });

  const paradas = [];
  const pasos = [];
  const hallazgos = [];
  let capturas = 0;

  const registrar = (info, donde) => {
    if (!info) return;
    paradas.push({ ...info, donde });
    if (!info.indicador) hallazgos.push(`sin indicador de foco visible: ${info.etiqueta}.${info.clase} «${info.nombre}» (${donde})`);
    if (!info.nombre) hallazgos.push(`sin nombre accesible: ${info.etiqueta} (${donde})`);
    if (!info.enParrafo && Math.min(info.ancho, info.alto) < 44 && info.etiqueta !== "input") hallazgos.push(`objetivo menor a 44 px (${info.ancho}×${info.alto}): ${info.etiqueta}.${info.clase} «${info.nombre}» (${donde})`);
    if (info.etiqueta === "input" && info.alto < 44) hallazgos.push(`campo menor a 44 px de alto (${info.alto}): «${info.nombre}» (${donde})`);
  };

  // Tab hasta que el nombre accesible del foco coincida; registra cada parada. Falla si da la vuelta sin hallarlo.
  async function tabHasta(patron, donde, max = 160) {
    for (let i = 0; i < max; i += 1) {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(260); // deja terminar las transiciones del anillo de foco antes de medir
      const info = await page.evaluate(describirFoco);
      registrar(info, donde);
      if (info && patron.test(info.nombre)) return info;
    }
    pasos.push({ paso: `${donde}: llegar a ${patron}`, ok: false, detalle: `no se alcanzó con Tab en ${max} paradas` });
    throw new Error(`no se alcanzó ${patron} en ${donde}`);
  }
  const paso = (nombre, ok, detalle = "") => pasos.push({ paso: nombre, ok, detalle });
  const captura = async (nombre) => { capturas += 1; await page.screenshot({ path: path.join(SALIDA, `${ancho}-${String(capturas).padStart(2, "0")}-${nombre}.png`) }); };
  const esperaTexto = (texto, ms = 15_000) => page.waitForSelector(`text=${texto}`, { timeout: ms });

  try {
    // 1. Producto: tooltip con foco y Esc, cantidad, agregar, ver carrito
    await page.goto(`${WEB}/producto/${producto.id}`);
    await page.waitForSelector("role=button[name='Agregar al carrito']");
    await page.locator("body").click({ position: { x: 1, y: 1 } }); // el foco parte desde el inicio de la página
    await tabHasta(/^Aumentar cantidad$/, "Detalle");
    const abierto = await page.evaluate(() => getComputedStyle(document.activeElement.closest(".cy-tip-wrap").querySelector("[role=tooltip]")).display !== "none");
    paso("Tooltip se abre al enfocar «Aumentar cantidad»", abierto);
    await captura("tooltip-abierto");
    await page.keyboard.press("Escape");
    const cerrado = await page.evaluate(() => getComputedStyle(document.activeElement.closest(".cy-tip-wrap").querySelector("[role=tooltip]")).display === "none");
    paso("Esc cierra el tooltip y el foco se queda en el control", cerrado);
    await page.keyboard.press("Enter");
    const cant = await page.evaluate(() => document.querySelector(".cy-stepper-value")?.textContent?.trim());
    paso("Enter en «Aumentar cantidad» sube la cantidad a 2", cant === "2", `cantidad mostrada: ${cant}`);
    await tabHasta(/^Agregar al carrito$/, "Detalle");
    await captura("foco-agregar");
    await page.keyboard.press("Enter");
    await esperaTexto("Agregamos 2 unidades a tu carrito");
    paso("Enter en «Agregar al carrito» confirma «Agregamos 2 unidades a tu carrito»", true);
    await tabHasta(/^Ver carrito$/, "Detalle");
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/carrito$/);
    paso("«Ver carrito» lleva a /carrito con Enter", true);

    // 2. Carrito
    await page.waitForSelector("[aria-label='Productos en tu carrito']");
    await tabHasta(/^Aumentar cantidad/, "Carrito");
    await page.keyboard.press("Escape");
    await tabHasta(/^Continuar con tus datos de envío$/, "Carrito");
    await captura("foco-continuar-carrito");
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/pedido\/confirmar/);
    paso("«Continuar con tus datos de envío» lleva a Datos y envío con Enter", true);

    // 3. Datos y envío: se escribe con teclado y se aplica el cupón
    await page.waitForSelector("text=¿Quién recibe el pedido?");
    await tabHasta(/^Teléfono/, "Datos y envío");
    await page.keyboard.type("3001234567");
    await tabHasta(/^Dirección/, "Datos y envío");
    await page.keyboard.type("Calle 45 # 13-20, apto 301");
    await tabHasta(/^Ciudad/, "Datos y envío");
    await page.keyboard.type("Bogotá");
    await captura("foco-ciudad");
    await tabHasta(/Cupón de lealtad|Escribe tu código/, "Datos y envío");
    await page.keyboard.type("lealtad10");
    await tabHasta(/^Aplicar$/, "Datos y envío");
    await page.keyboard.press("Enter");
    await esperaTexto("Cupón LEALTAD10 aplicado");
    paso("Cupón LEALTAD10 se aplica con Enter y el resumen muestra el descuento", await page.locator("text=Descuento por cupón LEALTAD10").count() > 0);
    await tabHasta(/^Continuar al pago$/, "Datos y envío");
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/pago\/\d+/, { timeout: 20_000 });
    paso("«Continuar al pago» crea el pedido y lleva a Pago con Enter", true, page.url().replace(WEB, ""));

    // 4. Pago
    await page.waitForSelector("role=button[name='Pagar con tarjeta']");
    await tabHasta(/^Pagar con tarjeta$/, "Pago");
    await captura("foco-pagar");
    await page.keyboard.press("Enter");
    let destino = "";
    try {
      await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 });
      destino = new URL(page.url()).host;
    } catch {
      destino = (await page.locator("[role=alert], .cy-notice-danger").first().innerText().catch(() => "sin aviso")).replace(/\s+/g, " ").slice(0, 80);
    }
    paso("«Pagar con tarjeta» con Enter abre la pasarela de pagos", destino === "checkout.stripe.com", destino);

    // 5. Shift+Tab y atrapamiento: de vuelta en el catálogo, Tab y Shift+Tab avanzan y retroceden
    await page.goto(`${WEB}/`);
    await page.waitForSelector("role=button[name=/Agregar .* al carrito/]");
    await page.locator("body").click({ position: { x: 1, y: 1 } });
    const a = [];
    for (let i = 0; i < 6; i += 1) { await page.keyboard.press("Tab"); a.push((await page.evaluate(describirFoco))?.nombre); }
    for (let i = 0; i < 3; i += 1) await page.keyboard.press("Shift+Tab");
    const vuelta = (await page.evaluate(describirFoco))?.nombre;
    paso("Shift+Tab regresa por el mismo orden (sin atrapar el foco)", vuelta === a[2], `esperado «${a[2]}», quedó en «${vuelta}»`);
  } catch (e) {
    paso("el recorrido se interrumpió", false, String(e.message).split("\n")[0].slice(0, 200));
    await captura("interrupcion").catch(() => undefined);
  }
  await ctx.close();
  return { ancho, paradas, pasos, hallazgos: [...new Set(hallazgos)] };
}

const navegador = await chromium.launch();
const resultados = [];
for (const [ancho, alto] of [[1440, 900], [390, 844]]) {
  const r = await recorrer(ancho, alto);
  resultados.push(r);
  console.log(`\n=== ${ancho} px: ${r.paradas.length} paradas de Tab; ${r.hallazgos.length} hallazgos`);
  for (const p of r.pasos) console.log(`  ${p.ok ? "OK " : "FALLA"} ${p.paso}${p.detalle ? "  — " + p.detalle : ""}`);
  for (const h of r.hallazgos) console.log(`  · ${h}`);
}
await navegador.close();

const md = ["# Recorrido con teclado — flujo de compra", "",
  `Generado por \`e2e/capturas/verificar-teclado.mjs\` el ${new Date().toISOString().slice(0, 10)}. Solo teclado: Tab, Shift+Tab, Enter, Esc y escribir.`, ""];
for (const r of resultados) {
  const conIndicador = r.paradas.filter((p) => p.indicador).length;
  md.push(`## ${r.ancho} px`, "", `Paradas de Tab: **${r.paradas.length}** · con foco visible: **${conIndicador}** · con nombre accesible: **${r.paradas.filter((p) => p.nombre).length}**.`, "",
    "| Paso | Resultado | Detalle |", "|---|---|---|", ...r.pasos.map((p) => `| ${p.paso} | ${p.ok ? "OK" : "FALLA"} | ${p.detalle} |`), "");
  md.push(r.hallazgos.length ? "Hallazgos:" : "Sin hallazgos de foco visible, nombre accesible ni tamaño de objetivo.", "", ...r.hallazgos.map((h) => `- ${h}`), "");
}
writeFileSync(path.join(RAIZ, "design/verificacion-rediseno/teclado.md"), md.join("\n"), "utf8");
writeFileSync(path.join(RAIZ, "design/verificacion-rediseno/teclado.json"), JSON.stringify(resultados.map((r) => ({ ...r, paradas: r.paradas.length })), null, 2), "utf8");
process.exit(resultados.every((r) => r.pasos.every((p) => p.ok) && r.hallazgos.length === 0) ? 0 : 1);
