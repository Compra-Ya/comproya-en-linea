// Capturas del estado actual de la UI para el handoff de diseño (design/02-estado-actual).
// NO es parte de la suite de pruebas: es un script de evidencia.
//
//   cd e2e && node capturas/capturar-estado-actual.mjs
//
// Requiere: base local, backend en :3001 con DEBITO_NOTIFICATION_SECRET=secreto-local-capturas,
// frontend en :3000 y el cupón LEALTAD10 sembrado. Todo contra datos locales.
import { chromium, request as pwRequest } from "@playwright/test";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SALIDA = path.resolve(AQUI, "../../design/02-estado-actual");
const WEB = "http://localhost:3000";
const API = "http://localhost:3001/api";
const SECRETO = "secreto-local-capturas";
const VIEWPORTS = [
  { ancho: 1440, alto: 900 },
  { ancho: 390, alto: 844 },
];
const ID_TV = 2405; // curado, con foto
const ID_SILLA = 209; // foto retail
const ID_NO_PUBLICADO = 1; // 'Producto de prueba': sin foto y despublicado en el catálogo de pruebas
const SUC_SYNC = 6;
const SUC_STALE = 3;
const registro = [];

async function main() {
  const api = await pwRequest.newContext();
  // Sucursales: 6 y 2 sincronizadas; las demás quedan con la sincronización vieja de la siembra.
  for (const id of [SUC_SYNC, 2]) await api.post(`${API}/catalogo/sucursales/${id}/sincronizar`);

  const navegador = await chromium.launch();
  for (const vp of VIEWPORTS) await escenario(navegador, api, vp);
  await navegador.close();

  // Respuestas literales de la API para excepciones sin pantalla propia.
  const respuestas = {};
  const probar = async (clave, fn) => {
    const r = await fn();
    respuestas[clave] = { status: r.status(), cuerpo: await r.json().catch(() => null) };
  };
  await probar("firma_webhook_invalida", () =>
    api.post(`${API}/pagos/webhook/stripe`, { headers: { "stripe-signature": "t=1,v1=falsa", "content-type": "application/json" }, data: "{}" }));
  await probar("secreto_debito_invalido", () =>
    api.post(`${API}/pagos/debito/1/notificacion`, { headers: { "x-debito-secreto": "incorrecto" }, data: { exitoso: true } }));
  await probar("secreto_debito_ausente", () => api.post(`${API}/pagos/debito/1/notificacion`, { data: { exitoso: true } }));
  await probar("producto_no_publicado", () => api.get(`${API}/catalogo/productos/${ID_NO_PUBLICADO}`));
  writeFileSync(path.join(SALIDA, "respuestas-api.json"), JSON.stringify(respuestas, null, 2) + "\n");
  writeFileSync(path.join(SALIDA, "capturas.json"), JSON.stringify(registro, null, 2) + "\n");
  console.log(`${registro.length} capturas`);
}

async function registrar(api, sufijo) {
  const body = { document: `CAP${sufijo}`, name: `Cliente Captura ${sufijo}`, email: `cap${sufijo}@comproya-test.local`, password: "claveClave1" };
  const res = await api.post(`${API}/cuenta/registro`, { data: body });
  const r = await res.json();
  await api.post(`${API}/cuenta/consentimiento`, { headers: { Authorization: `Bearer ${r.accessToken}` }, data: { activo: true } });
  return { ...body, token: r.accessToken, id: r.customer.id };
}

async function escenario(navegador, api, vp) {
  const dir = path.join(SALIDA, String(vp.ancho));
  mkdirSync(dir, { recursive: true });
  const sufijo = `${vp.ancho}${Date.now().toString().slice(-6)}`;
  let n = 0;

  const nuevoContexto = async (cliente) => {
    const ctx = await navegador.newContext({ viewport: { width: vp.ancho, height: vp.alto } });
    const page = await ctx.newPage();
    if (cliente) {
      await page.addInitScript(({ token, id, name }) => {
        localStorage.setItem("comproya_token", token);
        localStorage.setItem("comproya_customer", JSON.stringify({ id, name }));
      }, { token: cliente.token, id: cliente.id, name: cliente.name });
    }
    return { ctx, page };
  };

  const foto = async (page, nombre, ruta, nota = "") => {
    n += 1;
    const archivo = `${String(n).padStart(2, "0")}-${nombre}.png`;
    await page.screenshot({ path: path.join(dir, archivo), fullPage: true });
    const avisos = await page.locator(".notice, .badge-danger").allInnerTexts().catch(() => []);
    registro.push({ ancho: vp.ancho, archivo: `${vp.ancho}/${archivo}`, ruta, nota, avisos });
  };
  const ir = async (page, ruta, esperar = true) => {
    await page.goto(WEB + ruta);
    if (esperar) await page.waitForLoadState("networkidle").catch(() => undefined);
  };

  const cliente = await registrar(api, sufijo);
  const otro = await registrar(api, `${sufijo}b`);
  const cabecera = (c) => ({ Authorization: `Bearer ${c.token}` });

  // ---------- Invitado: catálogo, producto, carrito ----------
  {
    const { ctx, page } = await nuevoContexto(null);
    await ir(page, "/");
    await foto(page, "catalogo-exito", "/", "Catálogo con productos (éxito)");
    await ir(page, "/?q=zzzzqqq");
    await foto(page, "catalogo-vacio", "/?q=zzzzqqq", "Búsqueda sin resultados");
    await ir(page, "/?q=ab");
    await foto(page, "catalogo-busqueda-corta", "/?q=ab", "Búsqueda de menos de 3 caracteres");
    await ir(page, "/?q=Chair");
    await foto(page, "catalogo-busqueda-chair", "/?q=Chair", "Búsqueda con resultados (fotos retail)");

    // Cargando: se retrasa la respuesta de productos.
    await page.route("**/catalogo/productos?*", async (route) => { await new Promise((r) => setTimeout(r, 3500)); await route.continue().catch(() => undefined); });
    await page.goto(WEB + "/");
    await page.waitForTimeout(900);
    await foto(page, "catalogo-cargando", "/", "Mientras llega la respuesta de /catalogo/productos (retrasada 3,5 s)");
    await page.unroute("**/catalogo/productos?*");
    // Error de red.
    await page.route("**/catalogo/productos?*", (route) => route.abort());
    await page.goto(WEB + "/");
    await page.waitForTimeout(1200);
    await foto(page, "catalogo-error", "/", "Fallo de red al pedir el catálogo");
    await page.unroute("**/catalogo/productos?*");

    // Producto: con foto, sin foto, no publicado, inexistente, con sucursales.
    await ir(page, `/producto/${ID_TV}`);
    await foto(page, "producto-detalle-televisor", `/producto/${ID_TV}`, "Detalle con disponibilidad por sucursal (2 sincronizadas, el resto sin sincronizar)");
    await ir(page, `/producto/${ID_SILLA}`);
    await foto(page, "producto-detalle-silla", `/producto/${ID_SILLA}`, "Detalle con foto retail");
    // Placeholder: hoy todo producto publicado tiene foto, así que se simula la respuesta sin imageUrl.
    await page.route(`**/catalogo/productos/${ID_SILLA}`, async (route) => {
      const r = await route.fetch();
      const j = await r.json();
      await route.fulfill({ response: r, json: { ...j, imageUrl: null } });
    });
    await ir(page, `/producto/${ID_SILLA}`);
    await foto(page, "producto-sin-foto", `/producto/${ID_SILLA}`, "Placeholder por categoría (respuesta simulada sin imageUrl: hoy todo producto publicado tiene foto)");
    await page.unroute(`**/catalogo/productos/${ID_SILLA}`);
    await ir(page, `/producto/${ID_NO_PUBLICADO}`);
    await foto(page, "producto-no-publicado", `/producto/${ID_NO_PUBLICADO}`, "Excepción: producto no publicado");
    await ir(page, "/producto/9999999");
    await foto(page, "producto-inexistente", "/producto/9999999", "Producto inexistente");
    await page.route("**/disponibilidad", (route) => route.abort());
    await ir(page, `/producto/${ID_TV}`);
    await page.waitForTimeout(800);
    await foto(page, "producto-error-disponibilidad", `/producto/${ID_TV}`, "Fallo al consultar la disponibilidad");
    await page.unroute("**/disponibilidad");

    // Carrito invitado: vacío -> con producto.
    await ir(page, "/carrito");
    await foto(page, "carrito-vacio-invitado", "/carrito", "Excepción: carrito vacío");
    await page.route("**/carrito", async (route) => { await new Promise((r) => setTimeout(r, 3000)); await route.continue().catch(() => undefined); });
    await page.goto(WEB + "/carrito");
    await page.waitForTimeout(700);
    await foto(page, "carrito-cargando", "/carrito", "Mientras llega GET /carrito (retrasado 3 s)");
    await page.unroute("**/carrito");
    await ir(page, `/producto/${ID_TV}`);
    await page.locator("button:not([disabled])", { hasText: "Retirar aquí" }).first().click();
    await page.waitForTimeout(800);
    await foto(page, "producto-agregado-al-carrito", `/producto/${ID_TV}`, "Aviso de éxito tras 'Retirar aquí'");
    await ir(page, "/carrito");
    await foto(page, "carrito-invitado-con-productos", "/carrito", "Carrito de invitado con productos y complementarios");
    await ctx.close();
  }

  // ---------- Acceso previo ----------
  {
    const { ctx, page } = await nuevoContexto(null);
    await ir(page, "/registro");
    await foto(page, "registro", "/registro", "Registro (paso previo)");
    await page.getByPlaceholder("Nombre y apellido").fill("Alguien Repetido");
    await page.getByPlaceholder("Número de documento").fill(cliente.document);
    await page.getByPlaceholder("correo@ejemplo.com").fill(`otro${sufijo}@comproya-test.local`);
    await page.getByPlaceholder("••••••••").fill("claveClave1");
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await page.waitForTimeout(1200);
    await foto(page, "registro-error-documento-duplicado", "/registro", "Excepción E-1: documento ya registrado");
    await ir(page, "/ingresar");
    await foto(page, "ingresar", "/ingresar", "Inicio de sesión (paso previo)");
    await page.getByPlaceholder("tucorreo@ejemplo.com").fill(cliente.email);
    await page.getByPlaceholder("••••••••").fill("claveIncorrecta");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await page.waitForTimeout(1200);
    await foto(page, "ingresar-error-credenciales", "/ingresar", "Credenciales inválidas");
    await ir(page, "/pedidos");
    await foto(page, "pedidos-sin-sesion", "/pedidos", "Mis pedidos sin iniciar sesión");
    await ctx.close();
  }

  // ---------- Cliente registrado: compra completa ----------
  const { ctx, page } = await nuevoContexto(cliente);
  await ir(page, "/pedidos");
  await foto(page, "pedidos-vacio", "/pedidos", "Mis pedidos sin pedidos (cliente nuevo)");
  await ir(page, "/privacidad");
  await foto(page, "privacidad-consentimiento", "/privacidad", "Consentimiento (destino tras el registro)");

  const agregar = async (id, cantidad = 1) =>
    (await api.post(`${API}/carrito/items`, { headers: cabecera(cliente), data: { productId: id, quantity: cantidad } })).json();

  // Carrito registrado con dos productos.
  await agregar(ID_TV);
  const cart = await agregar(ID_SILLA);
  await ir(page, "/carrito");
  await foto(page, "carrito-registrado-con-productos", "/carrito", "Carrito de cliente registrado");

  // Unidades insuficientes: cantidad enorme.
  await ir(page, "/pedido/confirmar");
  await foto(page, "confirmar-pedido", "/pedido/confirmar", "Confirmación de pedido (sucursal por defecto: la primera de la lista)");
  await api.patch(`${API}/carrito/${cart.id}/items/${ID_SILLA}`, { headers: cabecera(cliente), data: { quantity: 9999 } });
  await ir(page, "/pedido/confirmar");
  await page.locator("select").first().selectOption(String(SUC_SYNC));
  await page.getByRole("button", { name: "Confirmar pedido" }).click();
  await page.waitForTimeout(1500);
  await foto(page, "confirmar-error-unidades-insuficientes", "/pedido/confirmar", "Excepción: unidades insuficientes (cantidad 9999)");
  await api.patch(`${API}/carrito/${cart.id}/items/${ID_SILLA}`, { headers: cabecera(cliente), data: { quantity: 1 } });

  // Sucursal desincronizada.
  await ir(page, "/pedido/confirmar");
  await page.locator("select").first().selectOption(String(SUC_STALE));
  await page.getByRole("button", { name: "Confirmar pedido" }).click();
  await page.waitForTimeout(1500);
  await foto(page, "confirmar-error-sucursal-desincronizada", "/pedido/confirmar", "Excepción: sucursal sin sincronizar hace más de 15 min");

  // Cupón inválido.
  await ir(page, "/pedido/confirmar");
  await page.locator("select").first().selectOption(String(SUC_SYNC));
  await page.getByPlaceholder("LEALTAD10").fill("FALSO99");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await foto(page, "confirmar-cupon-aplicado-sin-validar", "/pedido/confirmar", "Tras 'Aplicar' con un código inventado (aún sin validar)");
  await page.getByRole("button", { name: "Confirmar pedido" }).click();
  await page.waitForTimeout(1500);
  await foto(page, "confirmar-error-cupon-invalido", "/pedido/confirmar", "Excepción: cupón inválido");

  // Camino de éxito con cupón válido.
  await ir(page, "/pedido/confirmar");
  await page.locator("select").first().selectOption(String(SUC_SYNC));
  await page.getByPlaceholder("LEALTAD10").fill("LEALTAD10");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await foto(page, "confirmar-cupon-valido", "/pedido/confirmar", "Cupón LEALTAD10 aplicado");
  await page.getByRole("button", { name: "Confirmar pedido" }).click();
  await page.waitForURL(/\/pago\/\d+/);
  await page.waitForLoadState("networkidle").catch(() => undefined);
  const pedidoA = Number(page.url().match(/\/pago\/(\d+)/)[1]);
  await foto(page, "pago-tarjeta", `/pago/${pedidoA}`, "Pago: pestaña Tarjeta");
  await page.getByRole("button", { name: "Débito bancario" }).click();
  await foto(page, "pago-debito-inicio", `/pago/${pedidoA}`, "Pago: pestaña Débito bancario");
  await page.getByRole("button", { name: "Continuar con mi banco" }).click();
  await page.waitForTimeout(900);
  await foto(page, "pago-debito-esperando", `/pago/${pedidoA}`, "Estado: esperando confirmación del débito");
  await page.getByRole("button", { name: "Simular confirmación" }).click();
  await page.waitForTimeout(1200);
  await foto(page, "pago-debito-simular-falla", `/pago/${pedidoA}`, "Resultado real de 'Simular confirmación' (el frontend no envía X-Debito-Secreto)");
  // Confirmación entregada como la entregaría el banco (con el secreto).
  await api.post(`${API}/pagos/debito/${pedidoA}/notificacion`, { headers: { "x-debito-secreto": SECRETO }, data: { exitoso: true } });
  await ir(page, `/comprobante/${pedidoA}`);
  await page.waitForTimeout(800);
  await foto(page, "comprobante-exito", `/comprobante/${pedidoA}`, "Comprobante con código de retiro");
  await ir(page, `/pago/${pedidoA}`);
  await page.getByRole("button", { name: "Pagar con tarjeta" }).click();
  await page.waitForTimeout(1200);
  await foto(page, "pago-tarjeta-error-pedido-ya-pagado", `/pago/${pedidoA}`, "Excepción: pago con tarjeta no admitido (pedido ya pagado)");
  await ir(page, `/pago/${pedidoA}?cancelado=1`);
  await foto(page, "pago-tarjeta-cancelado", `/pago/${pedidoA}?cancelado=1`, "Excepción: pago con tarjeta cancelado o fallido (regreso desde Stripe)");

  // Segundo pedido: débito rechazado.
  await agregar(ID_SILLA);
  const pB = await (await api.post(`${API}/pedidos/confirmar`, { headers: cabecera(cliente), data: { branchId: SUC_SYNC } })).json();
  await ir(page, `/pago/${pB.id}`);
  await page.getByRole("button", { name: "Débito bancario" }).click();
  await page.getByRole("button", { name: "Continuar con mi banco" }).click();
  await page.waitForTimeout(900);
  await page.getByRole("button", { name: "Simular rechazo" }).click();
  await page.waitForTimeout(1200);
  await api.post(`${API}/pagos/debito/${pB.id}/notificacion`, { headers: { "x-debito-secreto": SECRETO }, data: { exitoso: false } });
  await ir(page, `/pedidos`);
  await foto(page, "pedidos-con-estados", "/pedidos", "Mis pedidos: pagado y cancelado por débito rechazado");

  // Tercer pedido sin pagar: comprobante no disponible (se espera el límite de reintentos).
  await agregar(ID_SILLA);
  const pC = await (await api.post(`${API}/pedidos/confirmar`, { headers: cabecera(cliente), data: { branchId: SUC_SYNC } })).json();
  const pagina2 = await ctx.newPage();
  const { ctx: ctxOtro, page: paginaOtro } = await nuevoContexto(otro);
  await pagina2.goto(`${WEB}/comprobante/${pC.id}`);
  await paginaOtro.goto(`${WEB}/comprobante/${pedidoA}`);
  await pagina2.waitForTimeout(3500);
  await foto(pagina2, "comprobante-reintentando", `/comprobante/${pC.id}`, "Estado intermedio: 'Confirmando el pago con la pasarela…'");
  await pagina2.waitForTimeout(34000);
  await foto(pagina2, "comprobante-no-disponible", `/comprobante/${pC.id}`, "Excepción: comprobante no disponible (pedido sin pagar)");
  await foto(paginaOtro, "comprobante-pedido-de-otro-cliente-403", `/comprobante/${pedidoA}`, "Excepción: pedido de otro cliente (la API responde 403)");
  await ctxOtro.close();
  await ctx.close();
  // Placeholders: hoy todo producto publicado tiene foto, así que se simula la respuesta sin imageUrl.
  {
    const { ctx: c2, page: p2 } = await nuevoContexto(null);
    await p2.route("**/catalogo/productos?*", async (route) => {
      const r = await route.fetch();
      const j = await r.json();
      await route.fulfill({ response: r, json: { ...j, items: j.items.map((p, i) => (i % 2 ? { ...p, imageUrl: null } : p)) } });
    });
    await ir(p2, "/");
    await foto(p2, "catalogo-placeholders", "/", "Catálogo con placeholders (respuesta simulada sin imageUrl en una de cada dos tarjetas)");
    await c2.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
