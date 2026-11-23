import { APIRequestContext, Page } from "@playwright/test";

// Helpers de preparación para las pruebas de sistema CU-09-01/CU-09-02 —
// registran el cliente directo contra la API (evita flakiness de UI en el setup;
// el recorrido de compra en sí SÍ es UI).
const API_URL = process.env.E2E_API_URL ?? "http://localhost:3001/api";

// Sufijo de 8 dígitos para documento y correo de cada cliente de prueba (hora + azar: dos pruebas no repiten el documento).
export function sufijoUnico(): string {
  return `${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;
}

export interface ClienteDePrueba {
  customerId: number;
  name: string;
  accessToken: string;
}

export async function registrarClienteDePrueba(request: APIRequestContext, sufijo: string): Promise<ClienteDePrueba> {
  const name = `Cliente E2E ${sufijo}`;
  const res = await request.post(`${API_URL}/cuenta/registro`, {
    data: {
      document: `E2E${sufijo}`,
      name,
      email: `e2e${sufijo}@comproya-test.local`,
      password: "claveClave1",
    },
  });
  if (!res.ok()) throw new Error(`No se pudo registrar el cliente de prueba: ${await res.text()}`);
  const body = await res.json();
  await request.post(`${API_URL}/cuenta/consentimiento`, {
    headers: { Authorization: `Bearer ${body.accessToken}` },
    data: { activo: true },
  });
  return { customerId: body.customer.id, name, accessToken: body.accessToken };
}

// Deja al navegador "con sesión iniciada" sin pasar por el formulario de
// login — el registro/login en sí ya lo cubren las pruebas de unidad e
// integración de CU-1 (GestorDeRegistro, GestorDeConsentimiento).
export async function iniciarSesionEnNavegador(page: Page, cliente: ClienteDePrueba) {
  await page.goto("/");
  await page.evaluate(
    ({ token, customerId, name }) => {
      localStorage.setItem("comproya_token", token);
      localStorage.setItem("comproya_customer", JSON.stringify({ id: customerId, name }));
    },
    { token: cliente.accessToken, customerId: cliente.customerId, name: cliente.name },
  );
  await page.reload();
}

// Datos de envío de la prueba: la interfaz actual es venta digital con envío (sin retiro ni sucursal). Se llenan por
// etiqueta, como lo haría una persona, y se devuelven para comprobarlos en el pedido.
export async function llenarEnvio(page: Page) {
  const envio = { telefono: "3001234567", direccion: "Calle 45 # 12-34", ciudad: "Bogotá" };
  await page.getByLabel("Teléfono", { exact: true }).fill(envio.telefono);
  await page.getByLabel("Dirección", { exact: true }).fill(envio.direccion);
  await page.getByLabel("Ciudad", { exact: true }).fill(envio.ciudad);
  return envio;
}

// Formulario de Stripe Checkout (sandbox). Desde la versión 2026-08-26 de la API el formulario va dentro de un iframe y sus
// campos se identifican por su nombre accesible (ya no por el texto de ejemplo de cada campo).
export async function pagarEnStripe(page: Page, datos: { correo: string; numero: string; titular: string }) {
  const formulario = page.frameLocator("iframe").first();
  await formulario.getByRole("textbox", { name: "Email" }).fill(datos.correo);
  await formulario.getByRole("textbox", { name: "Card number" }).fill(datos.numero);
  await formulario.getByRole("textbox", { name: /Expiration/ }).fill("12/34");
  await formulario.getByRole("textbox", { name: "Security code" }).fill("123");
  await formulario.getByRole("textbox", { name: "Name on card" }).fill(datos.titular);
  return formulario;
}
