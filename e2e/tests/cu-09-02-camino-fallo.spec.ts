import { test, expect } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";
import Stripe from "stripe";
import { registrarClienteDePrueba, iniciarSesionEnNavegador, sufijoUnico, llenarEnvio, pagarEnStripe } from "../fixtures/cliente-de-prueba";

dotenv.config({ path: path.resolve(__dirname, "../../backend/.env") });

const API_URL = process.env.E2E_API_URL ?? "http://localhost:3001/api";
const EVIDENCIA = path.resolve(__dirname, "../../evidencia/CU-09-02");

// CU-09-02 — Camino de fallo, venta digital con envío: pago con tarjeta rechazado sobre una reserva ya creada ->
// Pedido = Pago fallido, sin comprobante, y la reserva se libera.
//
// Nota metodológica: un rechazo de tarjeta en Stripe Checkout no cierra la sesión: solo muestra el error y deja
// reintentar. El backend pasa a PAYMENT_FAILED cuando la sesión expira de verdad (`checkout.session.expired`; Stripe
// exige un mínimo real de 30 minutos) o con el trabajo de liberación de reservas. Ninguno cabe en una prueba
// interactiva, así que, después de capturar el rechazo real en pantalla, el test expira esa misma Checkout Session con
// la API real de Stripe (`sessions.expire`, con la sk_test_... de backend/.env). Eso dispara el webhook real hacia
// `stripe listen`, igual que pasaría si el cliente abandona la pestaña. No se llama a ningún endpoint interno de
// ComproYa para forzar el estado.
test("CU-09-02: pago con tarjeta rechazado libera la reserva sin confirmar el pedido", async ({ page, request }) => {
  const sufijo = sufijoUnico();
  const cliente = await registrarClienteDePrueba(request, sufijo);
  await iniciarSesionEnNavegador(page, cliente);
  const auth = { headers: { Authorization: `Bearer ${cliente.accessToken}` } };

  const busqueda = await (await request.get(`${API_URL}/catalogo/productos?q=Licuadora`)).json();
  const productId: number = busqueda.items[0].id;
  const reservadas = async (): Promise<number> => {
    const filas = (await (await request.get(`${API_URL}/catalogo/productos/${productId}/disponibilidad`, auth)).json()) as { reservedUnits: number }[];
    return filas.reduce((suma, f) => suma + f.reservedUnits, 0);
  };

  await page.goto("/?q=Licuadora");
  await page.getByRole("button", { name: /Licuadora/ }).first().click();
  await expect(page.getByText(/Agregamos \d+ unidad/).first()).toBeVisible();

  await page.goto("/carrito");
  await page.screenshot({ path: path.join(EVIDENCIA, "paso-1-carrito.png"), fullPage: true });
  await page.getByRole("link", { name: "Continuar con tus datos de envío" }).click();
  await expect(page).toHaveURL(/\/pedido\/confirmar/);
  await llenarEnvio(page);
  await page.getByRole("button", { name: "Continuar al pago" }).click();

  await expect(page).toHaveURL(/\/pago\/\d+/, { timeout: 30_000 });
  const orderId = Number(page.url().match(/\/pago\/(\d+)/)?.[1]);

  // Poscondición previa (caja negra): la reserva ya existe antes de que sea posible cobrar (RN-05).
  const reservadasConPedido = await reservadas();

  await page.getByRole("button", { name: "Pagar con tarjeta" }).click();
  await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 45_000 });
  // 4000000000000002 es la tarjeta de prueba de Stripe para rechazo.
  const formulario = await pagarEnStripe(page, { correo: `e2e${sufijo}@comproya-test.local`, numero: "4000000000000002", titular: cliente.name });
  await formulario.getByTestId("payment-form-submit-button").click();

  // La pasarela rechaza el pago en tiempo real, en su propia pantalla, sin volver a ComproYa.
  await expect(formulario.getByText(/declined/i).first()).toBeVisible({ timeout: 20_000 });
  await page.screenshot({ path: path.join(EVIDENCIA, "paso-2-stripe-tarjeta-rechazada.png"), fullPage: true });

  // Expira la Checkout Session real (ver la nota metodológica) y espera al webhook real.
  // El identificador de la sesión se guarda cifrado en el pedido (PAYMENT_TOKEN_ENCRYPTION_KEY) y la API no lo devuelve
  // en claro; la sesión se encuentra en Stripe por el número de pedido que el backend le puso en los metadatos.
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });
  const sesiones = await stripe.checkout.sessions.list({ limit: 25 });
  const sesion = sesiones.data.find((s) => s.metadata?.orderId === String(orderId));
  expect(sesion, `no hay una Checkout Session de Stripe para el pedido ${orderId}`).toBeTruthy();
  await stripe.checkout.sessions.expire(sesion!.id);
  await expect
    .poll(async () => (await (await request.get(`${API_URL}/pedidos/${orderId}`, auth)).json()).status, { timeout: 30_000, intervals: [1000] })
    .toBe("PAYMENT_FAILED");

  await page.goto("/pedidos");
  await expect(page.getByText("Pago fallido").first()).toBeVisible();
  await page.screenshot({ path: path.join(EVIDENCIA, "paso-3-resultado-pago-fallido.png"), fullPage: true });

  // Poscondiciones: sin comprobante y con la reserva liberada.
  expect((await request.get(`${API_URL}/pagos/${orderId}/comprobante`, auth)).ok()).toBe(false);
  expect(await reservadas()).toBeLessThan(reservadasConPedido);
});
