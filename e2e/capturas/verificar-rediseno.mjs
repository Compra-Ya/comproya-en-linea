// Fase 4 del rediseño: captura cada pantalla × estado de design/rediseno/README.md a 1440 y 390 px,
// mide el desborde horizontal (document.documentElement.scrollWidth <= window.innerWidth) y revisa en cada
// captura tres cosas más: vocabulario prohibido, controles sin nombre accesible e imágenes sin alt.
//
//   cd e2e && node capturas/verificar-rediseno.mjs [filtro]
//
// Requiere la base LOCAL, el backend en :3001 y el frontend en :3000. Los estados "cargando" y "error" se
// provocan interceptando la petición del navegador (nunca se toca el servidor); "agotado", "pocos productos",
// "confirmando" y "la confirmación tarda" simulan la respuesta del servidor porque no hay un dato real que
// los produzca de forma estable. Todo lo demás usa datos reales de la base local. El webhook de Stripe no
// existe en local: para ver "Pedido confirmado" se marca el pago como confirmado en la base LOCAL.
// Escribe design/verificacion-rediseno/pantallas/*.png, resultados.json y tabla-verificacion.md.
import { chromium, request as pwRequest } from "@playwright/test";
import { execFileSync } from "child_process";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SALIDA = path.join(RAIZ, "design/verificacion-rediseno/pantallas");
const WEB = "http://localhost:3000";
const API = "http://localhost:3001/api";
const FILTRO = process.argv[2] ?? "";
// AXE=1: en vez de capturar, corre axe-core (WCAG 2.1 A y AA, incluye contraste 4,5:1) sobre cada estado y escribe axe.json.
const AXE = process.env.AXE === "1";
const AXE_RUTA = AXE ? createRequire(import.meta.url).resolve("axe-core/axe.min.js") : "";
const VISTAS = [
  { ancho: 1440, alto: 900 },
  { ancho: 390, alto: 844 },
];
const PROHIBIDAS = /\b(checkout|stock|PSE|cross-?sell|SKU|API|SaaS|ERP|homologad[oa]s?)\b|\bRN-\d+|\bCU-\d+/i;

mkdirSync(SALIDA, { recursive: true });
if (!FILTRO && !AXE) for (const f of readdirSync(SALIDA)) if (f.endsWith(".png")) rmSync(path.join(SALIDA, f));

function sql(consulta) {
  execFileSync("docker", ["exec", "comproya-en-linea-db-1", "psql", "-U", "postgres", "-d", "comproya", "-c", consulta], { stdio: "pipe" });
}

// ---------- Datos de prueba (base local) ----------
const api = await pwRequest.newContext();
const sufijo = Date.now().toString().slice(-7);

async function registrar(prefijo, nombre) {
  const r = await api.post(`${API}/cuenta/registro`, {
    data: { document: `${prefijo}${sufijo}`, name: nombre, email: `${prefijo.toLowerCase()}${sufijo}@comproya-test.local`, password: "claveClave1" },
  });
  if (!r.ok()) throw new Error(`No se pudo registrar a ${nombre}: ${r.status()} ${await r.text()}`);
  const sesion = await r.json();
  sesion.email = `${prefijo.toLowerCase()}${sufijo}@comproya-test.local`;
  return sesion;
}
const cabecera = (s) => ({ Authorization: `Bearer ${s.accessToken}` });
async function agregar(s, productId, quantity) {
  const r = await api.post(`${API}/carrito/items`, { headers: cabecera(s), data: { productId, quantity } });
  if (!r.ok()) throw new Error(`No se pudo agregar el producto ${productId}: ${r.status()} ${await r.text()}`);
}
async function crearPedido(s, productos) {
  for (const [id, q] of productos) await agregar(s, id, q);
  const r = await api.post(`${API}/pedidos/confirmar`, {
    headers: cabecera(s),
    data: { tipoEntrega: "ENVIO", envio: { nombre: s.customer.name, telefono: "3001234567", direccion: "Calle 45 # 13-20, apto 301", ciudad: "Bogotá", notas: "Portería, piso 3" } },
  });
  if (!r.ok()) throw new Error(`No se pudo crear el pedido: ${r.status()} ${await r.text()}`);
  return (await r.json()).id;
}

const lista = await (await api.get(`${API}/catalogo/productos?page=1`)).json();
const disponibles = lista.items.filter((p) => p.unidadesDisponibles >= 6);
if (disponibles.length < 4) throw new Error("No hay productos con unidades disponibles suficientes en la base local");
const [P1, P2, P3, P4] = disponibles.map((p) => p.id);

const clienteA = await registrar("RDA", "Camila Rojas"); // carrito con productos, sin pedidos
await agregar(clienteA, P1, 2);
await agregar(clienteA, P2, 1);
const clienteB = await registrar("RDB", "Duvan Serrano"); // con pedidos
const pedidoCreado = await crearPedido(clienteB, [[P1, 2]]);
const pedidoPagado = await crearPedido(clienteB, [[P2, 1], [P3, 3]]);
const pedidoAlistando = await crearPedido(clienteB, [[P4, 1]]);
const pedidoCancelado = await crearPedido(clienteB, [[P3, 1]]);
sql(`update payments set status = 'CONFIRMED', confirmed_at = now() where order_id = ${pedidoPagado}; update orders set status = 'PAID' where id = ${pedidoPagado};`);
sql(`update payments set status = 'CONFIRMED', confirmed_at = now() where order_id = ${pedidoAlistando}; update orders set status = 'PREPARING' where id = ${pedidoAlistando};`);
await api.post(`${API}/pedidos/${pedidoCancelado}/cancelar`, { headers: cabecera(clienteB) });
const clienteC = await registrar("RDC", "Laura Gómez"); // sin carrito ni pedidos

// ---------- Utilidades de interceptación ----------
const esRuta = (nombre) => (url) => url.pathname === `/api${nombre}`;
const retener = (page, ruta) => page.route(ruta, () => undefined); // la petición nunca responde: se ve "cargando"
const fallar = (page, ruta) => page.route(ruta, (r) => r.abort("failed"));
const responder = (page, ruta, estado, cuerpo) =>
  page.route(ruta, (r) => r.fulfill({ status: estado, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(cuerpo) }));
const modificar = (page, ruta, cambiar) =>
  page.route(ruta, async (r) => {
    const resp = await r.fetch();
    const json = await resp.json();
    await r.fulfill({ response: resp, json: cambiar(json) });
  });

const sesionDe = (s) => ({ token: s.accessToken, customer: { id: s.customer.id, name: s.customer.name } });
const productosGeneral = esRuta("/catalogo/productos");
const productoUno = esRuta(`/catalogo/productos/${P1}`);

// ---------- Escenarios: pantalla × estado ----------
// espera: texto o selector que prueba que el estado ya se pintó. sesion: quién navega.
const E = [
  // 1. Catálogo
  { pantalla: "Catálogo", estado: "éxito", ruta: "/", espera: "role=button[name=/Agregar al carrito: /]" },
  { pantalla: "Catálogo", estado: "cargando", ruta: "/", antes: (p) => retener(p, productosGeneral), espera: "text=Cargando productos…" },
  { pantalla: "Catálogo", estado: "búsqueda sin resultados", ruta: "/?q=zzqxwv", espera: "text=No encontramos productos para" },
  { pantalla: "Catálogo", estado: "error", ruta: "/", antes: (p) => fallar(p, productosGeneral), espera: "text=No pudimos cargar los productos." },
  {
    pantalla: "Catálogo", estado: "producto agregado", ruta: "/", espera: "role=button[name=/Agregar al carrito: /]",
    despues: async (p) => { await p.getByRole("button", { name: /Agregar al carrito: / }).first().click(); await p.waitForSelector("text=/Agregamos [0-9]+ unidad/"); },
  },
  // 2. Categoría
  { pantalla: "Categoría", estado: "éxito", ruta: "/categoria/8", espera: "role=button[name=/Agregar al carrito: /]" },
  { pantalla: "Categoría", estado: "cargando", ruta: "/categoria/8", antes: (p) => retener(p, productosGeneral), espera: "text=Cargando productos…" },
  {
    pantalla: "Categoría", estado: "categoría con pocos productos", ruta: "/categoria/8", espera: "role=button[name=/Agregar al carrito: /]",
    antes: (p) => modificar(p, productosGeneral, (j) => ({ ...j, items: j.items.slice(0, 2), total: 2 })),
  },
  // 3. Detalle
  { pantalla: "Detalle", estado: "disponible", ruta: `/producto/${P1}`, espera: "role=button[name='Agregar al carrito']" },
  {
    pantalla: "Detalle", estado: "agregado", ruta: `/producto/${P1}`, espera: "role=button[name='Agregar al carrito']",
    despues: async (p) => { await p.getByRole("button", { name: "Agregar al carrito", exact: true }).click(); await p.waitForSelector("text=/Agregamos [0-9]+ unidad/"); },
  },
  {
    pantalla: "Detalle", estado: "agotado", ruta: `/producto/${P1}`, espera: "text=Producto agotado",
    antes: (p) => modificar(p, productoUno, (j) => ({ ...j, unidadesDisponibles: 0, maximoPorPedido: 0 })),
  },
  { pantalla: "Detalle", estado: "cargando", ruta: `/producto/${P1}`, antes: (p) => retener(p, productoUno), espera: "text=Cargando el producto…" },
  {
    pantalla: "Detalle", estado: "no disponible", ruta: `/producto/${P1}`, espera: "text=Este producto ya no está disponible",
    antes: (p) => responder(p, productoUno, 404, { statusCode: 404, message: "No encontrado" }),
  },
  // 4. Carrito
  { pantalla: "Carrito", estado: "con productos", ruta: "/carrito", sesion: clienteA, espera: "[aria-label='Productos en tu carrito']" },
  { pantalla: "Carrito", estado: "vacío", ruta: "/carrito", sesion: clienteC, espera: "text=Tu carrito está vacío" },
  { pantalla: "Carrito", estado: "cargando", ruta: "/carrito", sesion: clienteA, antes: (p) => retener(p, esRuta("/carrito")), espera: "text=Cargando tu carrito…" },
  { pantalla: "Carrito", estado: "error", ruta: "/carrito", sesion: clienteA, antes: (p) => fallar(p, esRuta("/carrito")), espera: "text=No pudimos cargar tu carrito." },
  // 5. Datos y envío
  { pantalla: "Datos y envío", estado: "normal", ruta: "/pedido/confirmar", sesion: clienteA, espera: "text=¿Quién recibe el pedido?" },
  {
    pantalla: "Datos y envío", estado: "errores por campo", ruta: "/pedido/confirmar", sesion: clienteA, espera: "text=¿Quién recibe el pedido?",
    despues: async (p) => { await p.getByRole("button", { name: "Continuar al pago" }).click(); await p.waitForSelector("text=/Faltan \\d+ datos? para continuar/"); },
  },
  {
    pantalla: "Datos y envío", estado: "cupón válido", ruta: "/pedido/confirmar", sesion: clienteA, espera: "text=¿Quién recibe el pedido?",
    despues: async (p) => { await p.getByPlaceholder("Escribe tu código").fill("lealtad10"); await p.getByRole("button", { name: "Aplicar" }).click(); await p.waitForSelector("text=/Cupón LEALTAD10 aplicado/"); },
  },
  {
    pantalla: "Datos y envío", estado: "cupón inválido", ruta: "/pedido/confirmar", sesion: clienteA, espera: "text=¿Quién recibe el pedido?",
    despues: async (p) => { await p.getByPlaceholder("Escribe tu código").fill("NOEXISTE"); await p.getByRole("button", { name: "Aplicar" }).click(); await p.waitForSelector(".cy-coupon .cy-error[role=alert]"); },
  },
  {
    pantalla: "Datos y envío", estado: "sin sesión", ruta: "/pedido/confirmar", espera: "text=Inicia sesión",
    preparar: async (p) => { await p.goto(`${WEB}/producto/${P1}`); await p.getByRole("button", { name: "Agregar al carrito", exact: true }).click(); await p.waitForSelector("text=/Agregamos [0-9]+ unidad/"); },
  },
  // 6. Pago
  { pantalla: "Pago", estado: "normal", ruta: `/pago/${pedidoCreado}`, sesion: clienteB, espera: "role=button[name='Pagar con tarjeta']" },
  {
    pantalla: "Pago", estado: "abriendo la pasarela", ruta: `/pago/${pedidoCreado}`, sesion: clienteB, espera: "role=button[name='Pagar con tarjeta']",
    antes: (p) => retener(p, (u) => u.pathname.startsWith("/api/pagos/tarjeta/")),
    despues: async (p) => { await p.getByRole("button", { name: "Pagar con tarjeta" }).click(); await p.waitForSelector("text=Abriendo la pasarela segura…"); },
  },
  { pantalla: "Pago", estado: "no se completó (?cancelado=1)", ruta: `/pago/${pedidoCreado}?cancelado=1`, sesion: clienteB, espera: "text=No se completó tu pago." },
  // 7. Pedido confirmado
  { pantalla: "Pedido confirmado", estado: "confirmado", ruta: `/comprobante/${pedidoPagado}`, sesion: clienteB, espera: "text=Total pagado" },
  {
    pantalla: "Pedido confirmado", estado: "confirmando", ruta: `/comprobante/${pedidoCreado}`, sesion: clienteB, espera: "text=Estamos confirmando tu pago…",
    antes: (p) => responder(p, esRuta(`/pagos/${pedidoCreado}/comprobante`), 400, { statusCode: 400, message: "El pago aún no está confirmado" }),
  },
  {
    pantalla: "Pedido confirmado", estado: "la confirmación tarda", ruta: `/comprobante/${pedidoCreado}`, sesion: clienteB, espera: "text=Todavía no recibimos la confirmación de tu pago.", lento: true,
    antes: (p) => responder(p, esRuta(`/pagos/${pedidoCreado}/comprobante`), 400, { statusCode: 400, message: "El pago aún no está confirmado" }),
  },
  // 8. Mis pedidos
  { pantalla: "Mis pedidos", estado: "con pedidos", ruta: "/pedidos", sesion: clienteB, espera: "text=Qué significa cada estado" },
  { pantalla: "Mis pedidos", estado: "vacío", ruta: "/pedidos", sesion: clienteC, espera: "text=Todavía no tienes pedidos" },
  { pantalla: "Mis pedidos", estado: "sin sesión", ruta: "/pedidos", espera: "text=Inicia sesión para ver tus pedidos" },
  { pantalla: "Mis pedidos", estado: "cargando", ruta: "/pedidos", sesion: clienteB, antes: (p) => retener(p, esRuta("/pedidos")), espera: "text=Cargando tus pedidos…" },
  // 9. Acceso
  { pantalla: "Acceso", estado: "ingresar", ruta: "/ingresar", espera: "role=heading[name='Ingresar a ComproYa']" },
  {
    pantalla: "Acceso", estado: "ingresar con error", ruta: "/ingresar", espera: "role=heading[name='Ingresar a ComproYa']",
    despues: async (p) => {
      await p.getByLabel("Correo electrónico").fill(clienteB.email);
      await p.getByLabel("Contraseña").fill("incorrecta1");
      await p.locator("form").getByRole("button", { name: "Iniciar sesión" }).click();
      await p.waitForSelector("text=El correo o la contraseña no coinciden.");
    },
  },
  { pantalla: "Acceso", estado: "crear cuenta", ruta: "/registro", espera: "role=heading[name='Crear cuenta']" },
  {
    pantalla: "Acceso", estado: "crear cuenta con errores", ruta: "/registro", espera: "role=heading[name='Crear cuenta']",
    despues: async (p) => { await p.locator("form").getByRole("button", { name: "Crear cuenta" }).click(); await p.waitForSelector("text=/Revisa \\d+ datos? para crear tu cuenta/"); },
  },
];

// ---------- Medición ----------
async function medir(page) {
  return page.evaluate((prohibidas) => {
    const re = new RegExp(prohibidas, "i");
    const visible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    const nombre = (el) => (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.innerText || el.getAttribute("title") || el.value || "").trim();
    const sinNombre = [...document.querySelectorAll("button, a[href], input:not([type=hidden]), select, textarea")]
      .filter(visible)
      .filter((el) => {
        if (el.id && document.querySelector(`label[for="${el.id}"]`)) return false;
        if (el.closest("label")) return false;
        return !nombre(el);
      })
      .map((el) => `${el.tagName.toLowerCase()}${el.className ? "." + String(el.className).split(" ")[0] : ""}`);
    const sinAlt = [...document.querySelectorAll("img")].filter((i) => visible(i) && !i.hasAttribute("alt")).length;
    const texto = document.body.innerText;
    const prohibida = texto.match(re)?.[0] ?? null;
    return {
      ventana: window.innerWidth,
      contenido: document.documentElement.scrollWidth,
      h1: document.querySelector("h1")?.textContent?.trim() ?? "",
      sinNombre,
      sinAlt,
      prohibida,
    };
  }, PROHIBIDAS.source);
}

const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const navegador = await chromium.launch();
const filas = [];
let n = 0;

for (const esc of E) {
  n += 1;
  const id = `${String(n).padStart(2, "0")}-${slug(esc.pantalla)}-${slug(esc.estado)}`;
  if (FILTRO && !id.includes(FILTRO)) continue;
  const fila = { id, pantalla: esc.pantalla, estado: esc.estado, vistas: {} };
  for (const v of VISTAS) {
    const ctx = await navegador.newContext({ viewport: { width: v.ancho, height: v.alto }, locale: "es-CO" });
    const page = await ctx.newPage();
    const errores = [];
    page.on("pageerror", (e) => errores.push(e.message));
    if (esc.sesion) {
      await page.addInitScript(({ token, customer }) => {
        localStorage.setItem("comproya_token", token);
        localStorage.setItem("comproya_customer", JSON.stringify(customer));
      }, sesionDe(esc.sesion));
    }
    const resultado = { captura: `${id}-${v.ancho}.png`, ok: false, notas: [] };
    try {
      if (esc.preparar) await esc.preparar(page);
      if (esc.antes) await esc.antes(page);
      await page.goto(`${WEB}${esc.ruta}`);
      await page.waitForSelector(esc.espera.startsWith("role=") ? esc.espera : esc.espera, { timeout: esc.lento ? 60_000 : 20_000 });
      if (esc.despues) await esc.despues(page);
      await page.waitForLoadState("networkidle", { timeout: 4_000 }).catch(() => undefined);
      await page.waitForTimeout(400); // asienta animaciones de entrada
      const m = await medir(page);
      if (!AXE) await page.screenshot({ path: path.join(SALIDA, resultado.captura), fullPage: true });
      if (AXE) {
        await page.addScriptTag({ path: AXE_RUTA });
        resultado.axe = await page.evaluate(async () => {
          const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
          return r.violations.map((v) => ({
            id: v.id,
            impacto: v.impact,
            ayuda: v.help,
            nodos: v.nodes.length,
            ejemplo: `${v.nodes[0]?.target?.join(" ")} :: ${(v.nodes[0]?.any?.[0]?.message || v.nodes[0]?.failureSummary || "").replace(/\s+/g, " ").slice(0, 160)}`,
          }));
        });
        for (const v of resultado.axe) resultado.notas.push(`axe ${v.id} (${v.impacto}, ${v.nodos} nodo/s): ${v.ejemplo}`);
      }
      resultado.sinDesborde = m.contenido <= m.ventana;
      resultado.h1 = m.h1;
      if (!resultado.sinDesborde) resultado.notas.push(`desborde horizontal: contenido ${m.contenido} px > ventana ${m.ventana} px`);
      if (m.prohibida) resultado.notas.push(`vocabulario prohibido: «${m.prohibida}»`);
      if (m.sinNombre.length) resultado.notas.push(`controles sin nombre accesible: ${m.sinNombre.join(", ")}`);
      if (m.sinAlt) resultado.notas.push(`${m.sinAlt} imagen(es) sin alt`);
      if (errores.length) resultado.notas.push(`errores de página: ${errores.join(" | ").slice(0, 160)}`);
      resultado.ok = resultado.sinDesborde && !m.prohibida && !m.sinNombre.length && !m.sinAlt && !errores.length && !(resultado.axe?.length);
    } catch (e) {
      resultado.notas.push(`no se pudo capturar: ${String(e.message).split("\n")[0].slice(0, 160)}`);
      await page.screenshot({ path: path.join(SALIDA, `FALLO-${resultado.captura}`), fullPage: true }).catch(() => undefined);
    }
    fila.vistas[v.ancho] = resultado;
    await ctx.close();
  }
  filas.push(fila);
  const r = (a) => (fila.vistas[a].ok ? "OK" : "PENDIENTE");
  console.log(`${id}  1440:${r(1440)}  390:${r(390)}${[1440, 390].flatMap((a) => fila.vistas[a].notas.map((x) => `\n    [${a}] ${x}`)).join("")}`);
}
await navegador.close();

// ---------- Tabla ----------
const celda = (r) => (r.captura && !r.notas.some((x) => x.startsWith("no se pudo")) ? `\`${r.captura}\`` : "—");
const lineas = [
  "# Verificación del rediseño — pantalla × estado",
  "",
  `Generada por \`e2e/capturas/verificar-rediseno.mjs\` el ${new Date().toISOString().slice(0, 10)}. Capturas en \`design/verificacion-rediseno/pantallas/\`.`,
  "Cada fila mide, a 1440 y 390 px: sin desplazamiento horizontal, sin vocabulario prohibido, sin controles sin nombre accesible, sin imágenes sin `alt` y sin errores de página.",
  "",
  "| Pantalla | Estado | Captura 1440 | Captura 390 | Resultado | Notas |",
  "|---|---|---|---|---|---|",
];
for (const f of filas) {
  const ok = f.vistas[1440].ok && f.vistas[390].ok;
  const notas = [1440, 390].flatMap((a) => f.vistas[a].notas.map((x) => `[${a}] ${x}`)).join("; ");
  lineas.push(`| ${f.pantalla} | ${f.estado} | ${celda(f.vistas[1440])} | ${celda(f.vistas[390])} | ${ok ? "OK" : "pendiente"} | ${notas} |`);
}
const total = filas.length;
const bien = filas.filter((f) => f.vistas[1440].ok && f.vistas[390].ok).length;
lineas.push("", `**${bien} de ${total} estados sin observaciones** (${total * 2} capturas).`, "");
if (AXE) {
  writeFileSync(path.join(RAIZ, "design/verificacion-rediseno/axe.json"), JSON.stringify(filas, null, 2), "utf8");
} else if (!FILTRO) {
  writeFileSync(path.join(RAIZ, "design/verificacion-rediseno/tabla-verificacion.md"), lineas.join("\n"), "utf8");
  writeFileSync(path.join(RAIZ, "design/verificacion-rediseno/resultados.json"), JSON.stringify(filas, null, 2), "utf8");
}
console.log(`\n${bien} de ${total} estados sin observaciones.`);
process.exit(bien === total ? 0 : 1);
