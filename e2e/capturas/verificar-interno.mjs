// Verificación del panel interno del Coordinador de Canal Digital (REQ-016 lista de ventas, REQ-017 acceso por sesión).
// Recorre en un navegador real: sin sesión lo mandan al ingreso, una contraseña mala se rechaza, la sesión de un cliente no
// abre el panel, el ingreso correcto publica un producto, la lista de ventas filtra y paginá, y «Salir» cierra la sesión.
// Además pasa axe-core (WCAG 2.1 A y AA) por cada pantalla y mide el desborde horizontal a 1440 y 390 px.
//
//   cd e2e && node capturas/verificar-interno.mjs
//   WEB_URL=http://localhost:3100 API_URL=http://localhost:3101/api node capturas/verificar-interno.mjs
//
// Requiere base LOCAL con la cuenta interna sembrada (cd backend && npm run seed:staff). Lee el correo y la contraseña de
// backend/.env (STAFF_SEED_EMAIL y STAFF_SEED_PASSWORD); no los imprime. Publica un producto de verificación (con 20
// existencias) y crea clientes de verificación; al terminar borra todo lo que creó. Escribe design/verificacion-interno/resultado.md y capturas en design/verificacion-interno/*.png.
import { chromium, request as pwRequest } from "@playwright/test";
import { createRequire } from "module";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SALIDA = path.join(RAIZ, "design/verificacion-interno");
const WEB = process.env.WEB_URL ?? "http://localhost:3000";
const API = process.env.API_URL ?? "http://localhost:3001/api";
const AXE = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
rmSync(SALIDA, { recursive: true, force: true });
mkdirSync(SALIDA, { recursive: true });

function leerEnv(clave) {
  const linea = readFileSync(path.join(RAIZ, "backend/.env"), "utf8")
    .split(/\r?\n/)
    .find((l) => l.startsWith(`${clave}=`));
  if (!linea) throw new Error(`Falta ${clave} en backend/.env (ver .env.example y npm run seed:staff)`);
  return linea.slice(clave.length + 1).replace(/^"|"$/g, "");
}
const CORREO = leerEnv("STAFF_SEED_EMAIL");
const CLAVE = leerEnv("STAFF_SEED_PASSWORD");

// Limpieza: borra lo que este recorrido creó (producto de verificación, sus unidades y la auditoría, y los clientes de prueba).
async function limpiar() {
  const { PrismaClient } = createRequire(path.join(RAIZ, "backend/package.json"))("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const producto = await prisma.product.findUnique({ where: { homologatedCode: codigo } });
    if (producto) {
      await prisma.availability.deleteMany({ where: { productId: producto.id } });
      await prisma.product.delete({ where: { id: producto.id } });
    }
    await prisma.auditLog.deleteMany({ where: { action: `producto.publicar:${codigo}` } });
    const clientes = await prisma.customer.findMany({ where: { email: { startsWith: "verif-", endsWith: "@prueba.local" } }, select: { id: true } });
    const ids = clientes.map((c) => c.id);
    await prisma.consent.deleteMany({ where: { customerId: { in: ids } } });
    await prisma.customer.deleteMany({ where: { id: { in: ids } } });
    await prisma.category.deleteMany({ where: { name: "Verificación interna", products: { none: {} } } });
    console.log(`Limpieza: producto ${codigo} y ${ids.length} cliente(s) de verificación borrados`);
  } finally {
    await prisma.$disconnect();
  }
}

const filas = [];
let fallos = 0;
function comprobar(nombre, ok, detalle = "") {
  filas.push({ nombre, ok, detalle });
  if (!ok) fallos += 1;
  console.log(`${ok ? "OK  " : "FALLA"} ${nombre}${detalle ? ` — ${detalle}` : ""}`);
}

async function axe(page) {
  await page.evaluate(AXE);
  return page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
    return r.violations.map((v) => `${v.id} (${v.impact}, ${v.nodes.length} nodo/s)`);
  });
}

const sinDesborde = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

const codigo = `ZZVER-${String(Date.now()).slice(-6)}`;
const navegador = await chromium.launch();
const api = await pwRequest.newContext();

try {
  for (const [ancho, alto] of [[1440, 900], [390, 844]]) {
    const ctx = await navegador.newContext({ viewport: { width: ancho, height: alto } });
    const page = await ctx.newPage();
    const errores = [];
    page.on("pageerror", (e) => errores.push(e.message));
    const etiqueta = `${ancho}px`;

    // 1. Sin sesión, el panel manda al ingreso y recuerda a dónde volver.
    await page.goto(`${WEB}/admin/publicar`);
    await page.waitForURL(/\/admin\/ingresar\?volver=%2Fadmin%2Fpublicar/, { timeout: 15000 });
    comprobar(`[${etiqueta}] sin sesión, /admin/publicar lleva a /admin/ingresar`, true);
    await page.screenshot({ path: path.join(SALIDA, `01-ingreso-${ancho}.png`) });
    const axeIngreso = await axe(page);
    comprobar(`[${etiqueta}] ingreso: sin violaciones de axe`, axeIngreso.length === 0, axeIngreso.join("; "));
    comprobar(`[${etiqueta}] ingreso: sin desborde horizontal`, await sinDesborde(page));

    // 1b. El panel no se anuncia en la tienda: ninguna pantalla del Cliente digital enlaza a /admin, y no se indexa.
    const enlaces = [];
    for (const ruta of ["/", "/carrito", "/ingresar", "/registro", "/pedidos", "/privacidad"]) {
      await page.goto(`${WEB}${ruta}`);
      await page.waitForLoadState("networkidle");
      enlaces.push(...(await page.locator('a[href*="/admin"], button[data-href*="/admin"]').evaluateAll((els) => els.map((e) => e.getAttribute("href")))).map((h) => `${ruta} → ${h}`));
    }
    comprobar(`[${etiqueta}] ninguna pantalla de la tienda enlaza a /admin (se entra solo por la dirección)`, enlaces.length === 0, enlaces.join("; "));
    const cabeceras = (await page.request.get(`${WEB}/admin/ingresar`)).headers();
    comprobar(`[${etiqueta}] /admin no se indexa (X-Robots-Tag noindex)`, /noindex/.test(cabeceras["x-robots-tag"] ?? ""), cabeceras["x-robots-tag"] ?? "sin cabecera");
    await page.goto(`${WEB}/admin/publicar`);
    await page.waitForURL(/\/admin\/ingresar/);

    // 2. Contraseña equivocada.
    await page.fill("#interno-correo", CORREO);
    await page.fill("#interno-clave", "contrasena-equivocada-1");
    await page.click("button[type=submit]");
    await page.waitForSelector('.notice-danger');
    const mensaje = (await page.textContent('.notice-danger')) ?? "";
    comprobar(`[${etiqueta}] contraseña equivocada muestra el error y no entra`, /no coinciden/.test(mensaje) && page.url().includes("/admin/ingresar"));
    await page.screenshot({ path: path.join(SALIDA, `02-ingreso-error-${ancho}.png`) });

    // 3. La sesión de un cliente no abre el panel interno.
    const registro = await api.post(`${API}/cuenta/registro`, {
      data: { document: `VI${Date.now()}${ancho}`.slice(0, 14), name: "Cliente de verificación", email: `verif-${Date.now()}-${ancho}@prueba.local`, password: "clave-segura-123" },
    });
    const cliente = await registro.json();
    await page.evaluate((t) => localStorage.setItem("comproya_token", t), cliente.accessToken);
    await page.goto(`${WEB}/admin/ventas`);
    await page.waitForURL(/\/admin\/ingresar/, { timeout: 15000 });
    comprobar(`[${etiqueta}] con la sesión de un cliente, /admin/ventas sigue pidiendo el ingreso interno`, true);
    await page.evaluate(() => localStorage.removeItem("comproya_token"));

    // 4. Ingreso correcto: vuelve a donde iba.
    await page.goto(`${WEB}/admin/publicar`);
    await page.waitForURL(/\/admin\/ingresar/);
    await page.fill("#interno-correo", CORREO);
    await page.fill("#interno-clave", CLAVE);
    await page.click("button[type=submit]");
    await page.waitForURL(/\/admin\/publicar$/, { timeout: 15000 });
    await page.waitForSelector('[data-testid="cuenta-interna"]');
    comprobar(`[${etiqueta}] el ingreso correcto vuelve a /admin/publicar y muestra la cuenta`, true, (await page.textContent('[data-testid="cuenta-interna"]'))?.trim());

    // 5. Publicar un producto (solo en el recorrido de escritorio, para no crear dos).
    if (ancho === 1440) {
      const campos = page.locator("form input");
      await campos.nth(0).fill(codigo);
      await campos.nth(1).fill("Verificación interna");
      await campos.nth(2).fill("Producto de verificación interno");
      await campos.nth(4).fill("10000");
      await campos.nth(5).fill("15000");
      await campos.nth(6).fill("20");
      await page.screenshot({ path: path.join(SALIDA, `03-publicar-${ancho}.png`) });
      await page.click("button[type=submit]");
      await page.waitForSelector(`td:has-text("${codigo}")`, { timeout: 15000 });
      comprobar(`[${etiqueta}] publicar un producto con la sesión interna lo muestra en «Publicados recientemente»`, true, codigo);
      const catalogo = await (await api.get(`${API}/catalogo/productos?q=${encodeURIComponent("Producto de verificación interno")}`)).json();
      const publicado = catalogo.items.find((p) => p.homologatedCode === codigo);
      comprobar(`[${etiqueta}] el producto publicado aparece en el catálogo público con 15 unidades disponibles (20 − 5 de seguridad)`, publicado?.unidadesDisponibles === 15, `unidades: ${publicado?.unidadesDisponibles}`);
    }
    const axePublicar = await axe(page);
    comprobar(`[${etiqueta}] publicar: sin violaciones de axe`, axePublicar.length === 0, axePublicar.join("; "));
    comprobar(`[${etiqueta}] publicar: sin desborde horizontal`, await sinDesborde(page));

    // 6. Lista de ventas.
    await page.goto(`${WEB}/admin/ventas`);
    await page.waitForSelector('[data-testid="total-vendido"]', { timeout: 20000 });
    const total = (await page.textContent('[data-testid="total-vendido"]'))?.trim();
    const cantidad = Number(await page.textContent('[data-testid="cantidad-ventas"]'));
    comprobar(`[${etiqueta}] la lista de ventas muestra total vendido y cantidad`, !!total && cantidad > 0, `${cantidad} ventas, ${total}`);
    await page.screenshot({ path: path.join(SALIDA, `04-ventas-${ancho}.png`), fullPage: false });
    const enPantalla = await page.locator("tbody tr").count();
    comprobar(`[${etiqueta}] la primera página trae a lo sumo 20 filas`, enPantalla > 0 && enPantalla <= 20, `${enPantalla} filas`);
    const axeVentas = await axe(page);
    comprobar(`[${etiqueta}] ventas: sin violaciones de axe`, axeVentas.length === 0, axeVentas.join("; "));
    comprobar(`[${etiqueta}] ventas: sin desborde horizontal de la página`, await sinDesborde(page));

    // 7. Filtro por estado y por un rango sin ventas.
    await page.selectOption("#ventas-estado", "DELIVERED");
    await page.click('button:has-text("Filtrar")');
    await page.waitForFunction((c) => Number(document.querySelector('[data-testid="cantidad-ventas"]')?.textContent) !== c, cantidad);
    const entregadas = Number(await page.textContent('[data-testid="cantidad-ventas"]'));
    comprobar(`[${etiqueta}] filtrar por «Entregado» baja la cantidad`, entregadas < cantidad, `${cantidad} → ${entregadas}`);
    await page.click('button:has-text("Limpiar")');
    await page.fill("#ventas-desde", "2000-01-01");
    await page.fill("#ventas-hasta", "2000-01-02");
    await page.click('button:has-text("Filtrar")');
    await page.waitForSelector('[data-testid="sin-ventas"]');
    comprobar(`[${etiqueta}] un rango sin ventas dice «No hay ventas con esos filtros»`, true);
    await page.screenshot({ path: path.join(SALIDA, `05-ventas-sin-resultados-${ancho}.png`) });
    await page.click('button:has-text("Limpiar")');

    // 8. Ver envío.
    await page.waitForSelector('button:has-text("Ver envío")');
    await page.click('button:has-text("Ver envío") >> nth=0');
    comprobar(`[${etiqueta}] «Ver envío» muestra dirección y teléfono`, (await page.locator("td[colspan='7']").count()) === 1);
    await page.screenshot({ path: path.join(SALIDA, `06-ventas-envio-${ancho}.png`) });

    // 9. Salir.
    await page.click('button:has-text("Salir")');
    await page.waitForURL(/\/admin\/ingresar/);
    await page.goto(`${WEB}/admin/ventas`);
    await page.waitForURL(/\/admin\/ingresar/);
    comprobar(`[${etiqueta}] después de «Salir», el panel vuelve a pedir el ingreso`, true);
    comprobar(`[${etiqueta}] sin errores de página`, errores.length === 0, errores.join("; "));
    await ctx.close();
  }
} finally {
  await navegador.close();
  await api.dispose();
  await limpiar();
}

const md = [
  "# Verificación del panel interno (REQ-016, REQ-017)",
  "",
  `Generada por \`e2e/capturas/verificar-interno.mjs\` el ${new Date().toLocaleDateString("sv-SE")}. Capturas en \`design/verificacion-interno/\`.`,
  "",
  "| Comprobación | Resultado | Detalle |",
  "|---|---|---|",
  ...filas.map((f) => `| ${f.nombre} | ${f.ok ? "OK" : "FALLA"} | ${f.detalle.replace(/\|/g, "/")} |`),
  "",
  `**${filas.length - fallos} de ${filas.length} comprobaciones sin observaciones.**`,
  "",
].join("\n");
writeFileSync(path.join(SALIDA, "resultado.md"), md, "utf8");
console.log(`\n${filas.length - fallos}/${filas.length} comprobaciones OK`);
process.exit(fallos ? 1 : 0);
