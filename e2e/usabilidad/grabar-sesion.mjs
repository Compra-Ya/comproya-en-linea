// Grabador de sesión de usabilidad: panel de tareas dentro de la página, clics contados por tarea, mapa de calor en vivo
// sobre la pantalla, video de la sesión y archivo de resultados (efectividad, eficiencia y satisfacción SEQ de 1 a 7).
//
//   cd e2e
//   node usabilidad/grabar-sesion.mjs --codigo=P01 --modo=participante --consentimiento
//   node usabilidad/grabar-sesion.mjs --codigo=EQ-GUION --modo=guionado        (corrida automatizada, NO es una persona)
//
// Opciones: --navegador=chrome|chromium (por defecto chrome)  --web=http://localhost:3000  --tareas=T2,T3,T4  (por defecto las tareas «hacer» de sesion.mjs)
//
// Modo participante: abre el navegador con la sesión de una PERSONA REAL que usa el portal con su mouse; ella lee la tarea
// en el panel, pulsa «Empezar tarea», la hace y pulsa «Terminé» o «No pude», y califica la dificultad de 1 a 7.
// Exige --consentimiento: confirma que la persona fue informada de que se graban pantalla, clics y tiempos (sin datos
// personales: solo el código de participante). El video NO se sube al repositorio (ver .gitignore).
// Modo guionado: una corrida automática con Playwright (línea base del equipo). El panel y los archivos la rotulan como
// «CORRIDA GUIONADA AUTOMATIZADA»; nunca se presenta como una persona.
//
// Salida (docs/usabilidad/sesiones): <codigo>-<fecha>.json, <codigo>-<fecha>/video.webm, mapa-calor-<tarea>.png y resumen.md.
import { chromium } from "@playwright/test";
import { mkdirSync, readdirSync, renameSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { TAREAS } from "./sesion.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SALIDA = path.resolve(AQUI, "../../docs/usabilidad/sesiones");

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, "").split("="); return [k, v ?? true]; }));
const codigo = String(args.codigo ?? "");
const modo = args.modo === "guionado" ? "guionado" : "participante";
const WEB = String(args.web ?? "http://localhost:3000");
if (!codigo) throw new Error("Falta --codigo=P01 (código del participante; no escribas nombres)");
if (modo === "participante" && !args.consentimiento) {
  throw new Error("Falta --consentimiento: confirma que la persona sabe que se graban pantalla, clics y tiempos y aceptó participar.");
}
const todas = TAREAS.filter((t) => t.tipo === "hacer" && t.seq);
const pedidas = args.tareas ? String(args.tareas).split(",") : modo === "guionado" ? ["T2", "T3", "T4"] : todas.map((t) => t.n);
const tareas = pedidas.map((n) => todas.find((t) => t.n === n)).filter(Boolean);
if (!tareas.length) throw new Error("Ninguna tarea válida en --tareas");

const fecha = new Date().toISOString().slice(0, 10);
const carpeta = path.join(SALIDA, `${codigo}-${fecha}`);
mkdirSync(carpeta, { recursive: true });

// ----------------------------------------------------------------------------- estado (autoridad en Node)
const estado = {
  modo, codigo, fase: "inicio", i: 0, t0: 0, clics: 0, teclas: 0,
  tareas: tareas.map((t) => ({ n: t.n, titulo: t.titulo, texto: t.texto })), clicks: [],
};
const resultados = tareas.map((t) => ({ id: t.n, nombre: t.titulo, duracionS: null, clics: 0, teclas: 0, completada: null, dificultad: null }));
const inicioSesion = new Date();
let terminada = false;

// Por defecto usa el Chrome instalado en el equipo (no exige descargar Chromium); --navegador=chromium usa el de Playwright.
const canal = args.navegador === "chromium" ? undefined : "chrome";
const navegador = await chromium.launch({ channel: canal, headless: modo === "guionado" ? !args.visible : false });
const ctx = await navegador.newContext({ viewport: { width: 1366, height: 800 }, recordVideo: { dir: carpeta, size: { width: 1366, height: 800 } }, locale: "es-CO" });

async function pintar() {
  for (const p of ctx.pages()) await p.evaluate((s) => window.__cy_render && window.__cy_render(s), estado).catch(() => {});
}
async function captura(page, nombre) {
  await page.screenshot({ path: path.join(carpeta, nombre) }).catch(() => {});
}
async function actuar(page, a) {
  const r = resultados[estado.i];
  if (a.tipo === "empezar-sesion") estado.fase = "tarea-inicio";
  else if (a.tipo === "empezar-tarea") { estado.fase = "haciendo"; estado.t0 = Date.now(); estado.clics = 0; estado.teclas = 0; }
  else if (a.tipo === "terminar" && estado.fase === "haciendo") {
    r.duracionS = +((Date.now() - estado.t0) / 1000).toFixed(1);
    r.clics = estado.clics; r.teclas = estado.teclas; r.completada = !!a.ok;
    await captura(page, `mapa-calor-${r.id}.png`); // pantalla final de la tarea con el mapa de calor encima
    estado.fase = "seq";
  } else if (a.tipo === "seq" && estado.fase === "seq") {
    r.dificultad = a.valor ?? null;
    estado.i += 1;
    estado.fase = estado.i < tareas.length ? "tarea-inicio" : "fin";
  } else if (a.tipo === "cerrar") await terminar();
  await pintar();
}
await ctx.exposeBinding("__cy_act", (src, a) => actuar(src.page, a));
await ctx.exposeBinding("__cy_click", (src, c) => {
  if (estado.fase !== "haciendo") return;
  estado.clics += 1;
  estado.clicks.push({ ...c, tarea: tareas[estado.i].n, t: +((Date.now() - estado.t0) / 1000).toFixed(2) });
  pintar();
});
await ctx.exposeBinding("__cy_tecla", () => { if (estado.fase === "haciendo") { estado.teclas += 1; } });

// ----------------------------------------------------------------------------- panel y mapa de calor (vista)
await ctx.addInitScript(() => {
  if (window.top !== window || window.__cy_montado) return;
  window.__cy_montado = true;
  const arrancar = () => {
  const host = document.createElement("div");
  host.style.cssText = "all:initial;position:fixed;inset:0;z-index:2147483647;pointer-events:none";
  const raiz = host.attachShadow({ mode: "open" });
  raiz.innerHTML = `<style>
    canvas{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;opacity:.7}
    .p{position:fixed;right:12px;bottom:12px;width:350px;background:#0f172a;color:#fff;font:14px/1.4 Arial,sans-serif;border-radius:12px;padding:14px;box-shadow:0 8px 30px rgba(0,0,0,.4);pointer-events:auto}
    .p h4{margin:0 0 6px;font-size:13px;color:#93c5fd;letter-spacing:.3px}
    .p .t{margin:6px 0 10px}
    .p button{font:600 14px Arial;border:0;border-radius:8px;padding:9px 12px;margin:3px 4px 0 0;cursor:pointer;background:#2563eb;color:#fff}
    .p button.s{background:#475569}
    .p .n{display:flex;gap:4px;flex-wrap:wrap}.p .n button{width:38px;padding:9px 0;margin:2px}
    .m{display:flex;gap:14px;margin-top:8px;font-size:13px;color:#cbd5e1}.m b{color:#fff;font-size:18px}
    .b{position:fixed;left:50%;top:8px;transform:translateX(-50%);background:#b91c1c;color:#fff;font:700 13px Arial;padding:6px 14px;border-radius:999px;pointer-events:none}
  </style><canvas></canvas><div class="p"></div>`;
  document.documentElement.appendChild(host);
  const cv = raiz.querySelector("canvas");
  const panel = raiz.querySelector(".p");
  let S = null;
  const act = (a) => window.__cy_act(a);
  function calor() {
    cv.width = innerWidth; cv.height = innerHeight;
    const g = cv.getContext("2d");
    g.clearRect(0, 0, cv.width, cv.height);
    if (!S) return;
    g.globalCompositeOperation = "lighter";
    for (const c of S.clicks) {
      if (c.ruta !== location.origin + location.pathname) continue;
      const x = c.px - scrollX, y = c.py - scrollY;
      const r = g.createRadialGradient(x, y, 0, x, y, 46);
      r.addColorStop(0, "rgba(255,40,0,.55)"); r.addColorStop(.5, "rgba(255,170,0,.28)"); r.addColorStop(1, "rgba(255,255,0,0)");
      g.fillStyle = r; g.beginPath(); g.arc(x, y, 46, 0, 6.2832); g.fill();
    }
  }
  function vista() {
    const t = S.tareas[S.i];
    const banner = S.modo === "guionado" ? '<div class="b">CORRIDA GUIONADA AUTOMATIZADA · no es una persona</div>' : "";
    const e = Math.max(0, Math.round((Date.now() - S.t0) / 1000));
    let h = banner;
    if (S.fase === "inicio") {
      h += `<h4>SESIÓN DE USABILIDAD · ${S.codigo}</h4><div class="t">Vas a hacer ${S.tareas.length} tarea(s) en la tienda. Lee cada una, pulsa «Empezar tarea», hazla con tu mouse y avisa cuando termines. No hay respuestas correctas o incorrectas: se evalúa la tienda, no a ti.</div><button id="a">Empezar sesión</button>`;
    } else if (S.fase === "tarea-inicio") {
      h += `<h4>TAREA ${S.i + 1} DE ${S.tareas.length}</h4><div class="t">${t.texto}</div><button id="a">Empezar tarea</button>`;
    } else if (S.fase === "haciendo") {
      h += `<h4>TAREA ${S.i + 1} DE ${S.tareas.length} · EN CURSO</h4><div class="t">${t.texto}</div><button id="ok">Terminé la tarea</button><button class="s" id="no">No pude hacerla</button><div class="m"><span><b>${e}</b> s</span><span><b>${S.clics}</b> clics</span></div>`;
    } else if (S.fase === "seq") {
      h += `<h4>TAREA ${S.i + 1}</h4><div class="t">¿Qué tan fácil o difícil te resultó esta tarea?<br><small>1 = muy difícil · 7 = muy fácil</small></div><div class="n">${[1, 2, 3, 4, 5, 6, 7].map((n) => `<button data-n="${n}">${n}</button>`).join("")}</div>`;
    } else {
      h += `<h4>FIN DE LA SESIÓN</h4><div class="t">Gracias. Tus resultados quedaron guardados.</div><button id="c">Cerrar</button>`;
    }
    panel.innerHTML = h;
    const q = (s) => panel.querySelector(s);
    if (q("#a")) q("#a").onclick = () => act({ tipo: S.fase === "inicio" ? "empezar-sesion" : "empezar-tarea" });
    if (q("#ok")) q("#ok").onclick = () => act({ tipo: "terminar", ok: true });
    if (q("#no")) q("#no").onclick = () => act({ tipo: "terminar", ok: false });
    if (q("#c")) q("#c").onclick = () => act({ tipo: "cerrar" });
    panel.querySelectorAll("[data-n]").forEach((b) => (b.onclick = () => act({ tipo: "seq", valor: Number(b.dataset.n) })));
    calor();
  }
  window.__cy_render = (s) => { S = s; vista(); };
  addEventListener("scroll", calor, { passive: true });
  addEventListener("resize", calor);
  document.addEventListener("click", (e) => {
    if (e.composedPath().includes(host)) return; // los clics del panel no cuentan como clics de la tarea
    window.__cy_click({ px: e.pageX, py: e.pageY, ruta: location.origin + location.pathname, objetivo: (e.target.innerText || e.target.getAttribute("aria-label") || e.target.tagName || "").slice(0, 40) });
  }, true);
  document.addEventListener("keydown", (e) => { if (!e.composedPath().includes(host)) window.__cy_tecla(); }, true);
  setInterval(() => { if (S && S.fase === "haciendo") vista(); }, 1000);
  window.__cy_listo = true;
  };
  // el script corre antes de que exista el documento: se monta cuando ya hay <html>
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar);
  else arrancar();
});

ctx.on("page", (p) => p.on("domcontentloaded", () => pintar()));

// ----------------------------------------------------------------------------- cierre y archivos
async function terminar() {
  if (terminada) return;
  terminada = true;
  const fin = new Date();
  const video = ctx.pages()[0]?.video();
  const sesion = {
    codigo, modo, fecha: inicioSesion.toISOString(), duracionTotalS: +((fin - inicioSesion) / 1000).toFixed(1),
    aviso: modo === "guionado" ? "Corrida guionada automatizada (línea base del equipo). No es una persona." : "Sesión de una persona que dio su consentimiento.",
    web: WEB, navegador: "Chromium 1366x800", tareas: resultados,
    clics: estado.clicks.map(({ px, py, ruta, objetivo, tarea, t }) => ({ tarea, t, x: Math.round(px), y: Math.round(py), ruta: ruta.replace(WEB, ""), objetivo })),
  };
  writeFileSync(path.join(SALIDA, `${codigo}-${fecha}.json`), JSON.stringify(sesion, null, 2));
  const hechas = resultados.filter((r) => r.completada !== null);
  const ok = hechas.filter((r) => r.completada).length;
  const dif = resultados.map((r) => r.dificultad).filter((x) => x);
  writeFileSync(path.join(carpeta, "resumen.md"), [
    `# Sesión ${codigo} (${modo}) — ${fecha}`, "", sesion.aviso, "",
    `- Efectividad: ${ok} de ${hechas.length} tareas completadas (${hechas.length ? Math.round((100 * ok) / hechas.length) : 0} %)`,
    `- Eficiencia: ${resultados.reduce((a, r) => a + r.clics, 0)} clics y ${resultados.reduce((a, r) => a + (r.duracionS ?? 0), 0).toFixed(1)} s en total`,
    `- Satisfacción (SEQ 1–7): ${dif.length ? (dif.reduce((a, b) => a + b, 0) / dif.length).toFixed(1) : "sin calificación (corrida guionada)"}`, "",
    "| Tarea | Completada | Tiempo (s) | Clics | Teclas | Dificultad |", "|---|---|---|---|---|---|",
    ...resultados.map((r) => `| ${r.id} ${r.nombre} | ${r.completada === null ? "—" : r.completada ? "sí" : "no"} | ${r.duracionS ?? "—"} | ${r.clics} | ${r.teclas} | ${r.dificultad ?? "—"} |`),
  ].join(String.fromCharCode(10)));
  await ctx.close();
  if (video) { try { renameSync(await video.path(), path.join(carpeta, "video.webm")); } catch { /* el video queda con su nombre */ } }
  await navegador.close();
  console.log(`Sesión guardada: ${path.join(SALIDA, `${codigo}-${fecha}.json`)}`);
  console.log(`Carpeta con video y mapas de calor: ${carpeta}`);
  process.exit(0);
}

// ----------------------------------------------------------------------------- arranque
const page = await ctx.newPage();
page.on("close", () => { if (!terminada) terminar(); });
await page.goto(WEB);
await page.waitForFunction(() => window.__cy_listo === true);
await pintar();

if (modo === "participante") {
  console.log("Sesión abierta. La persona sigue las instrucciones del panel. Para terminar antes, cierra la ventana del navegador.");
} else {
  // Corrida guionada: Playwright mueve el mouse y hace clic como lo haría una persona (ruta ideal de la línea base).
  const esperar = (ms) => page.waitForTimeout(ms);
  async function clic(loc) {
    await loc.waitFor();
    await loc.scrollIntoViewIfNeeded(); // como una persona: baja la página hasta ver el botón
    await esperar(400);
    const caja = await loc.boundingBox();
    await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2, { steps: 18 });
    await esperar(350);
    await page.mouse.down(); await page.mouse.up();
    await esperar(500);
  }
  const rutas = {
    T2: async () => {
      await page.getByPlaceholder(/Buscar productos/).fill("licuadora"); await page.keyboard.press("Enter");
      await page.getByRole("heading", { name: /Resultados para/ }).waitFor(); await esperar(900);
      await clic(page.locator(".cy-pcard").first().getByRole("button", { name: /Agregar/ }));
      await page.getByText(/Agregamos 1 unidad/).first().waitFor();
    },
    T3: async () => {
      await page.goto(WEB); await page.waitForSelector(".cy-pcard");
      const cat = page.getByRole("link", { name: "Electrodomésticos", exact: true }).first();
      const caja = await cat.boundingBox(); await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2, { steps: 12 }); await esperar(400);
      await clic(cat);
      await clic(page.locator(".cy-pcard").first().getByRole("button", { name: /Agregar/ }));
      await page.getByText(/Agregamos 1 unidad/).first().waitFor();
    },
    T4: async () => {
      await page.goto(WEB); await page.waitForSelector(".cy-pcard");
      await page.getByPlaceholder(/Buscar productos/).fill("refrigerador"); await page.keyboard.press("Enter");
      await clic(page.getByRole("link", { name: /Refrigerador French Door/ }).first());
      await clic(page.getByRole("button", { name: "Aumentar cantidad", exact: true }));
      await clic(page.getByRole("button", { name: "Agregar al carrito", exact: true }));
      await page.getByText(/Agregamos 2 unidades/).waitFor();
    },
  };
  await actuar(page, { tipo: "empezar-sesion" });
  for (const t of tareas) {
    if (!rutas[t.n]) { await actuar(page, { tipo: "terminar", ok: false }); await actuar(page, { tipo: "seq", valor: null }); continue; }
    await page.goto(WEB); await page.waitForSelector(".cy-pcard");
    await actuar(page, { tipo: "empezar-tarea" });
    let ok = true;
    try { await rutas[t.n](); } catch (e) { ok = false; console.log(`La tarea ${t.n} falló: ${e.message.split(String.fromCharCode(10))[0]}`); }
    await esperar(600);
    await actuar(page, { tipo: "terminar", ok });
    await actuar(page, { tipo: "seq", valor: null });
  }
  await terminar();
}
void readdirSync;
