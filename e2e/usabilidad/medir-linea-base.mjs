// Línea base del equipo para la evaluación de usabilidad del CU-2 (ISO/IEC 9126-2, sección 8.3).
// Ejecuta en el portal real, con Playwright, la ruta ideal de cada tarea operativa y registra:
//   · clics y pulsaciones de teclado de la ruta ideal (cada campo cuenta como 1 clic para enfocarlo),
//   · el tiempo de espera del sistema (medido: desde la acción hasta que aparece el resultado esperado),
//   · los pasos, con su nombre (de ahí sale la «ruta ideal» del documento),
//   · el tiempo experto estimado con el Keystroke-Level Model (Card, Moran y Newell, 1980):
//       T = K·0,28 s + clics·(P 1,10 s + BB 0,20 s) + H·0,40 s + M·1,35 s + espera del sistema.
// Nada del documento de usabilidad se inventa: los clics, las teclas y las esperas salen de esta corrida.
//
//   (en otra terminal, para medir la espera real del webhook de pago)
//   stripe listen --api-key <clave de prueba> --forward-to http://localhost:3001/api/pagos/webhook/stripe
//   cd e2e && node usabilidad/medir-linea-base.mjs
//
// Requiere base LOCAL, backend en :3001, frontend en :3000 y el webhook de Stripe reenviado. Escribe usabilidad/linea-base.json.
import { chromium, request as pwRequest } from "@playwright/test";
import { writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const WEB = "http://localhost:3000";
const API = "http://localhost:3001/api";
const KLM = { K: 0.28, P: 1.1, BB: 0.2, H: 0.4, M: 1.35 }; // s; K = mecanógrafo promedio no secretarial (40 palabras/min)
const FACTOR_NOVATO = 3; // supuesto del equipo: un usuario nuevo tarda hasta 3 veces el tiempo experto
const REDONDEO_S = 5;

const sufijo = Date.now().toString().slice(-7);
const api = await pwRequest.newContext();
const DATOS = { telefono: "3101234567", direccion: "Calle 45 # 13-20, apto 301", ciudad: "Bogotá" };
const TARJETA = { correo: "participante@correo.com", numero: "4242424242424242", vence: "1234", cvc: "123", titular: "Laura Martinez" };

async function cuenta(prefijo) {
  const r = await api.post(`${API}/cuenta/registro`, {
    data: { document: `${prefijo}${sufijo}`, name: "Laura Martínez", email: `${prefijo.toLowerCase()}${sufijo}@comproya-test.local`, password: "claveClave1" },
  });
  if (!r.ok()) throw new Error(`registro: ${r.status()} ${await r.text()}`);
  const s = await r.json();
  await api.post(`${API}/cuenta/consentimiento`, { headers: { Authorization: `Bearer ${s.accessToken}` }, data: { activo: true } });
  return { ...s, correo: `${prefijo.toLowerCase()}${sufijo}@comproya-test.local` };
}
const productoPorNombre = async (q) => (await (await api.get(`${API}/catalogo/productos?q=${q}`)).json()).items[0];
async function agregarApi(s, productId, quantity) {
  const r = await api.post(`${API}/carrito/items`, { headers: { Authorization: `Bearer ${s.accessToken}` }, data: { productId, quantity } });
  if (!r.ok()) throw new Error(`agregar: ${r.status()} ${await r.text()}`);
}

// Medidor: cuenta las acciones de una persona y mide la espera del sistema.
class Medidor {
  constructor(page) {
    Object.assign(this, { page, clics: 0, teclas: 0, h: 0, m: 0, esperaMs: 0, ultimo: null, pasos: [], estados: {} });
  }
  async paso(nombre, fn) {
    this.m += 1; // un M (preparación mental) al inicio de cada paso lógico
    this.pasos.push(nombre);
    await fn();
  }
  _dispositivo(d) {
    if (this.ultimo && this.ultimo !== d) this.h += 1; // H: cambiar la mano entre mouse y teclado
    this.ultimo = d;
  }
  async clic(locator) {
    this._dispositivo("mouse");
    this.clics += 1;
    await locator.click();
  }
  async escribir(locator, texto) {
    this._dispositivo("mouse");
    this.clics += 1; // clic para enfocar el campo
    await locator.fill("");
    this._dispositivo("teclado");
    this.teclas += texto.length;
    await locator.fill(texto);
  }
  async tecla(nombre) {
    this._dispositivo("teclado");
    this.teclas += 1;
    await this.page.keyboard.press(nombre);
  }
  // Espera del sistema: desde que la persona terminó su acción hasta que ve el resultado.
  async esperar(fn, etiqueta) {
    const t = Date.now();
    await fn();
    const ms = Date.now() - t;
    this.esperaMs += ms;
    if (etiqueta) this.estados[etiqueta] = ms;
  }
  resumen() {
    const klm = this.teclas * KLM.K + this.clics * (KLM.P + KLM.BB) + this.h * KLM.H + this.m * KLM.M;
    const esperaS = this.esperaMs / 1000;
    const referenciaS = klm + esperaS;
    return {
      clics: this.clics,
      teclas: this.teclas,
      cambiosMouseTeclado: this.h,
      pasosMentales: this.m,
      esperaSistemaS: Math.round(esperaS * 10) / 10,
      klmHumanoS: Math.round(klm * 10) / 10,
      referenciaExpertoS: Math.round(referenciaS * 10) / 10,
      objetivoNovatoS: Math.ceil((referenciaS * FACTOR_NOVATO) / REDONDEO_S) * REDONDEO_S,
      estadosSistemaMs: this.estados,
      pasos: this.pasos,
    };
  }
}

const verBoton = (page, nombre) => page.getByRole("button", { name: nombre, exact: typeof nombre === "string" });
const verEnlace = (page, nombre, exact = true) => page.getByRole("link", { name: nombre, exact });

// El carrusel de categorías se mueve solo y se pausa al poner el mouse encima: así lo hace una persona. El clic es uno solo.
async function pulsarCategoria(m, page, nombre) {
  const enlace = page.getByRole("link", { name: nombre, exact: true }).first();
  const caja = await enlace.boundingBox();
  if (caja) await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2);
  await page.waitForTimeout(300);
  await m.clic(enlace);
}

// ---------- Fragmentos reutilizables (cada uno es una parte de la ruta ideal) ----------
async function buscarYAgregar(m, page, texto, productoRegex) {
  await m.paso(`Buscar «${texto}» en el buscador y pulsar Enter`, async () => {
    await m.escribir(page.getByPlaceholder(/Buscar productos/), texto);
    await m.tecla("Enter");
    await m.esperar(() => page.getByRole("button", { name: productoRegex }).first().waitFor(), "resultados de búsqueda");
  });
  await m.paso("Pulsar «Agregar al carrito» del producto", async () => {
    await m.clic(page.getByRole("button", { name: productoRegex }).first());
    await m.esperar(() => page.getByText(/Agregamos \d+ unidad/).first().waitFor(), "producto agregado");
  });
}
async function irAlCarritoYDatos(m, page) {
  await m.paso("Pulsar «Ver carrito»", async () => {
    await m.clic(verEnlace(page, "Ver carrito"));
    await m.esperar(() => page.waitForURL(/\/carrito$/));
    await m.esperar(() => page.getByRole("link", { name: "Continuar con tus datos de envío" }).waitFor());
  });
  await m.paso("Pulsar «Continuar con tus datos de envío»", async () => {
    await m.clic(page.getByRole("link", { name: "Continuar con tus datos de envío" }));
    await m.esperar(() => page.waitForURL(/\/pedido\/confirmar/));
  });
}
async function llenarEnvio(m, page) {
  await m.paso("Escribir teléfono, dirección y ciudad", async () => {
    await m.esperar(() => page.getByLabel("Teléfono", { exact: true }).waitFor());
    await m.escribir(page.getByLabel("Teléfono", { exact: true }), DATOS.telefono);
    await m.escribir(page.getByLabel("Dirección", { exact: true }), DATOS.direccion);
    await m.escribir(page.getByLabel("Ciudad", { exact: true }), DATOS.ciudad);
  });
}
async function pagarYConfirmar(m, page) {
  await m.paso("Pulsar «Continuar al pago»", async () => {
    await m.clic(verBoton(page, "Continuar al pago"));
    await m.esperar(() => page.waitForURL(/\/pago\/\d+/, { timeout: 30_000 }), "reservando tus unidades (Continuar al pago)");
    await m.esperar(() => verBoton(page, "Pagar con tarjeta").waitFor());
  });
  await m.paso("Pulsar «Pagar con tarjeta»", async () => {
    await m.clic(verBoton(page, "Pagar con tarjeta"));
    await m.esperar(() => page.waitForURL(/checkout\.stripe\.com/, { timeout: 45_000 }), "abriendo la pasarela segura (Pagar con tarjeta)");
    await m.esperar(() => page.getByPlaceholder("1234 1234 1234 1234").waitFor({ timeout: 45_000 }));
  });
  await m.paso("Escribir correo, tarjeta, vencimiento, código y nombre en la pasarela, y pulsar «Pagar»", async () => {
    await m.escribir(page.getByPlaceholder("email@example.com"), TARJETA.correo);
    await m.escribir(page.getByPlaceholder("1234 1234 1234 1234"), TARJETA.numero);
    await m.escribir(page.getByPlaceholder("MM / YY"), TARJETA.vence);
    await m.escribir(page.getByPlaceholder("CVC"), TARJETA.cvc);
    await m.escribir(page.getByPlaceholder("Full name on card"), TARJETA.titular);
    await m.clic(page.getByRole("button", { name: /^Pay/ }));
    await m.esperar(() => page.waitForURL(/\/comprobante\/\d+/, { timeout: 60_000 }));
    await m.esperar(() => page.getByText("¡Pedido confirmado!").waitFor({ timeout: 60_000 }), "confirmando tu pago (después de la pasarela)");
  });
}

// ---------- Tareas ----------
const tareas = {
  async T07(ctx) {
    const page = await ctx.newPage();
    const m = new Medidor(page);
    await page.goto(WEB);
    await page.waitForSelector(".cy-pcard");
    await buscarYAgregar(m, page, "licuadora", /Licuadora de Vaso/);
    await irAlCarritoYDatos(m, page);
    await m.paso("Pulsar «Crear cuenta»", async () => {
      await m.clic(verEnlace(page, "Crear cuenta"));
      await m.esperar(() => page.waitForURL(/\/registro/));
    });
    await m.paso("Escribir nombre, documento, correo y contraseña, aceptar el tratamiento de datos y pulsar «Crear cuenta»", async () => {
      await m.escribir(page.getByLabel("Nombre completo"), "Laura Martínez");
      await m.escribir(page.getByLabel("Documento de identidad"), `10${sufijo}`);
      await m.escribir(page.getByLabel("Correo electrónico"), `laura${sufijo}@correo.com`);
      await m.escribir(page.getByLabel("Contraseña"), "Prueba2026");
      await m.clic(page.getByRole("checkbox"));
      await m.clic(page.locator("form").getByRole("button", { name: "Crear cuenta" }));
      await m.esperar(() => page.waitForURL(/\/pedido\/confirmar/, { timeout: 30_000 }));
    });
    await llenarEnvio(m, page);
    await pagarYConfirmar(m, page);
    await ctx.close();
    return m.resumen();
  },
  async T08(ctx, s) {
    const page = await ctx.newPage();
    const m = new Medidor(page);
    await page.goto(WEB);
    await page.waitForSelector(".cy-pcard");
    await m.paso("Pulsar la categoría «Electrodomésticos» del carrusel", async () => {
      await pulsarCategoria(m, page, "Electrodomésticos");
      await m.esperar(() => page.getByRole("link", { name: /Televisor/ }).first().waitFor());
    });
    await m.paso("Abrir el televisor (pulsar su nombre)", async () => {
      await m.clic(page.getByRole("link", { name: /Televisor/ }).first());
      await m.esperar(() => verBoton(page, "Agregar al carrito").waitFor());
    });
    await m.paso("Subir la cantidad a 2 con «+»", async () => {
      await m.clic(verBoton(page, "Aumentar cantidad"));
    });
    await m.paso("Pulsar «Agregar al carrito»", async () => {
      await m.clic(verBoton(page, "Agregar al carrito"));
      await m.esperar(() => page.getByText(/Agregamos 2 unidades/).waitFor(), "producto agregado");
    });
    await irAlCarritoYDatos(m, page);
    await llenarEnvio(m, page);
    await pagarYConfirmar(m, page);
    await ctx.close();
    return m.resumen();
  },
  async T09(ctx) {
    const page = await ctx.newPage();
    const m = new Medidor(page);
    await page.goto(WEB);
    await page.waitForSelector(".cy-pcard");
    await m.paso("Buscar «lavadora» en el buscador y pulsar Enter", async () => {
      await m.escribir(page.getByPlaceholder(/Buscar productos/), "lavadora");
      await m.tecla("Enter");
      await m.esperar(() => page.getByRole("link", { name: /Lavadora Carga Frontal/ }).first().waitFor(), "resultados de búsqueda");
    });
    await m.paso("Abrir la lavadora (pulsar su nombre)", async () => {
      await m.clic(page.getByRole("link", { name: /Lavadora Carga Frontal/ }).first());
      await m.esperar(() => verBoton(page, "Agregar al carrito").waitFor());
    });
    await m.paso("Pulsar «Agregar al carrito»", async () => {
      await m.clic(verBoton(page, "Agregar al carrito"));
      await m.esperar(() => page.getByText(/Agregamos 1 unidad/).waitFor(), "producto agregado");
    });
    await m.paso("Pulsar «Ver carrito»", async () => {
      await m.clic(verEnlace(page, "Ver carrito"));
      await m.esperar(() => page.waitForURL(/\/carrito$/));
      await m.esperar(() => page.getByRole("button", { name: /Licuadora de Vaso/ }).first().waitFor(), "carrito con sugerencias");
    });
    await m.paso("Agregar la licuadora desde «Productos complementarios» (ícono de carrito)", async () => {
      await m.clic(page.getByRole("button", { name: /Licuadora de Vaso/ }).first());
      await m.esperar(() => page.getByText(/^2 productos · /).waitFor(), "carrito actualizado");
    });
    await m.paso("Pulsar «Continuar con tus datos de envío»", async () => {
      await m.clic(page.getByRole("link", { name: "Continuar con tus datos de envío" }));
      await m.esperar(() => page.waitForURL(/\/pedido\/confirmar/));
    });
    await llenarEnvio(m, page);
    await pagarYConfirmar(m, page);
    await ctx.close();
    return m.resumen();
  },
  async T10(ctx) {
    const page = await ctx.newPage();
    const m = new Medidor(page);
    await page.goto(`${WEB}/registro`);
    await page.waitForSelector("form");
    await m.paso("Pulsar «Crear cuenta» con el formulario vacío", async () => {
      await m.clic(page.locator("form").getByRole("button", { name: "Crear cuenta" }));
      await m.esperar(() => page.getByText(/Revisa \d+ datos? para crear tu cuenta/).waitFor(), "mensaje de error del registro");
    });
    await ctx.close();
    return m.resumen();
  },
  async T11(ctx, s) {
    await agregarApi(s, (await productoPorNombre("licuadora")).id, 1);
    const page = await ctx.newPage();
    const m = new Medidor(page);
    await page.goto(`${WEB}/pedido/confirmar`);
    await page.getByLabel("Teléfono", { exact: true }).waitFor();
    await m.paso("Pulsar «Continuar al pago» sin llenar los datos de envío", async () => {
      await m.clic(verBoton(page, "Continuar al pago"));
      await m.esperar(() => page.getByText(/Faltan \d+ datos? para continuar/).waitFor(), "mensaje de error de datos de envío");
    });
    await ctx.close();
    return m.resumen();
  },
  async T12(ctx, s) {
    await agregarApi(s, (await productoPorNombre("licuadora")).id, 1);
    const page = await ctx.newPage();
    const m = new Medidor(page);
    await page.goto(`${WEB}/pedido/confirmar`);
    await page.getByLabel("Teléfono", { exact: true }).waitFor();
    await m.paso("Escribir el código «PROMO2026» en el cupón y pulsar «Aplicar»", async () => {
      await m.escribir(page.getByPlaceholder("Escribe tu código"), "PROMO2026");
      await m.clic(verBoton(page, "Aplicar"));
      await m.esperar(() => page.locator(".cy-coupon .cy-error[role=alert]").waitFor(), "mensaje de cupón inválido");
    });
    await ctx.close();
    return m.resumen();
  },
  async T13(ctx, s) {
    const page = await ctx.newPage();
    const m = new Medidor(page);
    await page.goto(WEB);
    await page.waitForSelector(".cy-pcard");
    for (const [nombre, destino, espera] of [
      ["Pulsar «Carrito» en el menú", "Carrito", /\/carrito/],
      ["Pulsar «Mis pedidos» en el menú", "Mis pedidos", /\/pedidos/],
    ]) {
      await m.paso(nombre, async () => {
        await m.clic(page.locator("nav").getByRole("link", { name: new RegExp(destino) }));
        await m.esperar(() => page.waitForURL(espera));
      });
    }
    await m.paso("Volver al inicio con el logo «ComproYa»", async () => {
      await m.clic(page.getByRole("link", { name: /ComproYa, ir al catálogo/ }));
      await m.esperar(() => page.waitForURL(`${WEB}/`));
    });
    await ctx.close();
    return m.resumen();
  },
  async T14(ctx) {
    const page = await ctx.newPage();
    const m = new Medidor(page);
    await page.goto(WEB);
    await page.waitForSelector(".cy-pcard");
    await m.paso("Pulsar la categoría «Electrodomésticos»", async () => {
      await pulsarCategoria(m, page, "Electrodomésticos");
      await m.esperar(() => page.getByRole("link", { name: /Televisor/ }).first().waitFor());
    });
    await m.paso("Abrir un producto (pulsar su nombre)", async () => {
      await m.clic(page.getByRole("link", { name: /Televisor/ }).first());
      await m.esperar(() => verBoton(page, "Agregar al carrito").waitFor());
    });
    await m.paso("Pulsar «Carrito» en el menú", async () => {
      await m.clic(page.locator("nav").getByRole("link", { name: /Carrito/ }));
      await m.esperar(() => page.waitForURL(/\/carrito/));
    });
    await m.paso("Volver al inicio con el logo «ComproYa»", async () => {
      await m.clic(page.getByRole("link", { name: /ComproYa, ir al catálogo/ }));
      await m.esperar(() => page.waitForURL(`${WEB}/`));
    });
    await ctx.close();
    return m.resumen();
  },
  async T15(ctx) {
    const page = await ctx.newPage();
    const m = new Medidor(page);
    await page.goto(`${WEB}/carrito`);
    await page.waitForSelector("nav");
    await m.paso("Pulsar «Mi cuenta» en el menú", async () => {
      await m.clic(page.locator("nav").getByRole("link", { name: /Mi cuenta/ }));
      await m.esperar(() => page.waitForURL(/\/privacidad/));
    });
    await m.paso("Pulsar «Mis pedidos» en el menú", async () => {
      await m.clic(page.locator("nav").getByRole("link", { name: /Mis pedidos/ }));
      await m.esperar(() => page.waitForURL(/\/pedidos/));
    });
    await m.paso("Pulsar «Catálogo» en el menú", async () => {
      await m.clic(page.locator("nav").getByRole("link", { name: /Catálogo/ }));
      await m.esperar(() => page.waitForURL(`${WEB}/`));
    });
    await ctx.close();
    return m.resumen();
  },
  async T19(ctx) {
    const page = await ctx.newPage();
    const m = new Medidor(page);
    await page.goto(WEB);
    await page.waitForSelector(".cy-pcard");
    await buscarYAgregar(m, page, "licuadora", /Licuadora de Vaso/);
    await ctx.close();
    return m.resumen();
  },
  async T20(ctx) {
    const page = await ctx.newPage();
    const m = new Medidor(page);
    await page.goto(WEB);
    await page.waitForSelector(".cy-pcard");
    await m.paso("Pulsar la categoría «Electrodomésticos» del carrusel", async () => {
      await pulsarCategoria(m, page, "Electrodomésticos");
      await m.esperar(() => page.getByRole("button", { name: /Televisor/ }).first().waitFor());
    });
    await m.paso("Pulsar «Agregar al carrito» del televisor", async () => {
      await m.clic(page.getByRole("button", { name: /Televisor/ }).first());
      await m.esperar(() => page.getByText(/Agregamos 1 unidad/).first().waitFor(), "producto agregado");
    });
    await ctx.close();
    return m.resumen();
  },
  async T21(ctx) {
    const page = await ctx.newPage();
    const m = new Medidor(page);
    await page.goto(WEB);
    await page.waitForSelector(".cy-pcard");
    await m.paso("Buscar «refrigerador» en el buscador y pulsar Enter", async () => {
      await m.escribir(page.getByPlaceholder(/Buscar productos/), "refrigerador");
      await m.tecla("Enter");
      await m.esperar(() => page.getByRole("link", { name: /Refrigerador French Door/ }).first().waitFor(), "resultados de búsqueda");
    });
    await m.paso("Abrir el refrigerador (pulsar su nombre)", async () => {
      await m.clic(page.getByRole("link", { name: /Refrigerador French Door/ }).first());
      await m.esperar(() => verBoton(page, "Agregar al carrito").waitFor());
    });
    await m.paso("Subir la cantidad a 2 con «+»", async () => {
      await m.clic(verBoton(page, "Aumentar cantidad"));
    });
    await m.paso("Pulsar «Agregar al carrito»", async () => {
      await m.clic(verBoton(page, "Agregar al carrito"));
      await m.esperar(() => page.getByText(/Agregamos 2 unidades/).waitFor(), "producto agregado");
    });
    await ctx.close();
    return m.resumen();
  },
  async T22(ctx, s) {
    const page = await ctx.newPage();
    const m = new Medidor(page);
    await page.goto(WEB);
    await page.waitForSelector(".cy-pcard");
    await m.paso("Pulsar «Iniciar sesión» en la cabecera", async () => {
      await m.clic(page.getByRole("link", { name: "Iniciar sesión" }).first());
      await m.esperar(() => page.waitForURL(/\/ingresar/));
    });
    await m.paso("Escribir correo y contraseña y pulsar «Iniciar sesión»", async () => {
      await m.escribir(page.getByLabel("Correo electrónico"), s.correo);
      await m.escribir(page.getByLabel("Contraseña"), "claveClave1");
      await m.clic(page.locator("form").getByRole("button", { name: "Iniciar sesión" }));
      await m.esperar(() => page.waitForURL(`${WEB}/`, { timeout: 30_000 }));
    });
    await buscarYAgregar(m, page, "refrigerador", /Refrigerador French Door/);
    await irAlCarritoYDatos(m, page);
    await llenarEnvio(m, page);
    await pagarYConfirmar(m, page);
    await ctx.close();
    return m.resumen();
  },
  async T23(ctx) {
    const page = await ctx.newPage();
    const m = new Medidor(page);
    await page.goto(WEB);
    await page.waitForSelector(".cy-pcard");
    await buscarYAgregar(m, page, "licuadora", /Licuadora de Vaso/);
    await irAlCarritoYDatos(m, page);
    await m.paso("Escribir el código «LEALTAD10» en el cupón y pulsar «Aplicar»", async () => {
      await m.escribir(page.getByPlaceholder("Escribe tu código"), "LEALTAD10");
      await m.clic(verBoton(page, "Aplicar"));
      await m.esperar(() => page.getByText(/Cupón LEALTAD10 aplicado/).waitFor(), "validando el cupón");
    });
    await ctx.close();
    return m.resumen();
  },
  async T24(ctx) {
    const page = await ctx.newPage();
    const m = new Medidor(page);
    await page.goto(WEB);
    await page.waitForSelector(".cy-pcard");
    await m.paso("Pulsar «Mis pedidos» en el menú", async () => {
      await m.clic(page.locator("nav").getByRole("link", { name: /Mis pedidos/ }));
      await m.esperar(() => page.getByText(/Qué significa cada estado|Todavía no tienes pedidos/).first().waitFor(), "cargando tus pedidos");
    });
    await ctx.close();
    return m.resumen();
  },
  async T25(ctx, s) {
    await agregarApi(s, (await productoPorNombre("licuadora")).id, 2);
    const page = await ctx.newPage();
    const m = new Medidor(page);
    await page.goto(`${WEB}/pedido/confirmar`);
    await page.getByLabel("Teléfono", { exact: true }).waitFor();
    await m.paso("Escribir el código «LEALTAD10» en el cupón y pulsar «Aplicar»", async () => {
      await m.escribir(page.getByPlaceholder("Escribe tu código"), "LEALTAD10");
      await m.clic(verBoton(page, "Aplicar"));
      await m.esperar(() => page.getByText(/Cupón LEALTAD10 aplicado/).waitFor(), "validando el cupón");
    });
    await ctx.close();
    return m.resumen();
  },
  async T26(ctx, s) {
    await agregarApi(s, (await productoPorNombre("licuadora")).id, 2);
    const page = await ctx.newPage();
    const m = new Medidor(page);
    await page.goto(`${WEB}/pedido/confirmar`);
    await page.getByLabel("Teléfono", { exact: true }).waitFor();
    await page.getByPlaceholder("Escribe tu código").fill("LEALTAD10");
    await page.getByRole("button", { name: "Aplicar" }).click();
    await page.getByText(/Cupón LEALTAD10 aplicado/).waitFor();
    await m.paso("Pulsar «Quitar» en el cupón aplicado", async () => {
      await m.clic(verBoton(page, "Quitar"));
      await m.esperar(() => verBoton(page, "Aplicar").waitFor());
    });
    await m.paso("Escribir de nuevo «LEALTAD10» (el campo quedó vacío) y pulsar «Aplicar»", async () => {
      await m.escribir(page.getByPlaceholder("Escribe tu código"), "LEALTAD10");
      await m.clic(verBoton(page, "Aplicar"));
      await m.esperar(() => page.getByText(/Cupón LEALTAD10 aplicado/).waitFor(), "validando el cupón");
    });
    await ctx.close();
    return m.resumen();
  },
  async T27(ctx, s) {
    await agregarApi(s, (await productoPorNombre("televisor")).id, 1);
    const page = await ctx.newPage();
    const m = new Medidor(page);
    await page.goto(`${WEB}/pedido/confirmar`);
    await page.getByLabel("Teléfono", { exact: true }).waitFor();
    await m.paso("Escribir el código «LEALTAD10» en el cupón y pulsar «Aplicar»", async () => {
      await m.escribir(page.getByPlaceholder("Escribe tu código"), "LEALTAD10");
      await m.clic(verBoton(page, "Aplicar"));
      await m.esperar(() => page.getByText(/Cupón LEALTAD10 aplicado/).waitFor(), "validando el cupón");
    });
    await llenarEnvio(m, page);
    await m.paso("Pulsar «Continuar al pago» y leer el total a pagar", async () => {
      await m.clic(verBoton(page, "Continuar al pago"));
      await m.esperar(() => page.waitForURL(/\/pago\/\d+/, { timeout: 30_000 }), "reservando tus unidades (Continuar al pago)");
      await m.esperar(() => page.getByText(/Total a pagar/).first().waitFor());
    });
    await ctx.close();
    return m.resumen();
  },
};

// Tareas que parten con sesión iniciada (el evaluador deja la cuenta lista) y las que parten sin sesión.
const CON_SESION = new Set(["T08", "T09", "T11", "T23", "T12", "T13", "T14", "T15", "T20", "T21", "T24", "T25", "T26", "T27"]);
const SOLO_ID = process.argv[2];
const navegador = await chromium.launch();
const resultados = {};
for (const [id, ejecutar] of Object.entries(tareas)) {
  if (SOLO_ID && id !== SOLO_ID) continue;
  const s = await cuenta(`LB${id}`);
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 }, locale: "en-US" });
  if (CON_SESION.has(id) || id === "T22") {
    if (id !== "T22") {
      await ctx.addInitScript(({ token, customer }) => {
        localStorage.setItem("comproya_token", token);
        localStorage.setItem("comproya_customer", JSON.stringify(customer));
      }, { token: s.accessToken, customer: { id: s.customer.id, name: s.customer.name } });
    }
  }
  const t0 = Date.now();
  try {
    resultados[id] = await ejecutar(ctx, s);
    resultados[id].duracionAutomatizacionS = Math.round((Date.now() - t0) / 100) / 10;
    const r = resultados[id];
    console.log(`${id}: ${r.clics} clics, ${r.teclas} teclas, espera del sistema ${r.esperaSistemaS} s, experto ${r.referenciaExpertoS} s, objetivo ${r.objetivoNovatoS} s`);
  } catch (e) {
    console.error(`${id}: FALLÓ → ${String(e.message).split("\n").slice(0, 5).join(" | ")}`);
    resultados[id] = { error: String(e.message).split("\n")[0] };
    await ctx.close().catch(() => undefined);
  }
}
await navegador.close();

const salida = {
  generado: new Date().toISOString(),
  metodo: { klm: KLM, factorNovato: FACTOR_NOVATO, redondeoS: REDONDEO_S, nota: "referenciaExpertoS = KLM del humano + espera medida del sistema; objetivoNovatoS = referencia × factor, redondeado hacia arriba" },
  tareas: resultados,
};
if (!SOLO_ID) writeFileSync(path.join(AQUI, "linea-base.json"), JSON.stringify(salida, null, 2), "utf8");
process.exit(Object.values(resultados).some((r) => r.error) ? 1 : 0);
