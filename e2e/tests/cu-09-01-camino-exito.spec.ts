import { test, expect } from "@playwright/test";
import path from "path";
import { registrarClienteDePrueba, iniciarSesionEnNavegador, sufijoUnico, llenarEnvio, pagarEnStripe } from "../fixtures/cliente-de-prueba";

const API_URL = process.env.E2E_API_URL ?? "http://localhost:3001/api";
const EVIDENCIA = path.resolve(__dirname, "../../evidencia/CU-09-01");

// CU-09-01 — Camino de éxito, venta digital con envío: carrito con un producto disponible, datos de envío, pago con
// tarjeta aprobado (4242...) -> Pedido = Pagado, pantalla «¡Pedido confirmado!» sin código de retiro (la interfaz no
// ofrece retiro en sucursal) y los datos de envío guardados en el pedido. Caja negra: solo la interfaz real y la
// pasarela real de Stripe en modo de prueba (sandbox); nada se simula.
test("CU-09-01: pago con tarjeta aprobado confirma el pedido con envío", async ({ page, request }) => {
  const sufijo = sufijoUnico();
  const cliente = await registrarClienteDePrueba(request, sufijo);
  await iniciarSesionEnNavegador(page, cliente);

  // Paso 1: buscar el producto y agregarlo al carrito.
  await page.goto("/?q=Televisor");
  await page.getByRole("button", { name: /Televisor/ }).first().click();
  await expect(page.getByText(/Agregamos \d+ unidad/).first()).toBeVisible();

  await page.goto("/carrito");
  await expect(page.getByText("Televisor", { exact: false }).first()).toBeVisible();
  await page.screenshot({ path: path.join(EVIDENCIA, "paso-1-carrito.png"), fullPage: true });

  // Paso 2: datos de envío y reserva de las unidades (RN-05: la reserva existe antes de poder cobrar).
  await page.getByRole("link", { name: "Continuar con tus datos de envío" }).click();
  await expect(page).toHaveURL(/\/pedido\/confirmar/);
  const envio = await llenarEnvio(page);
  await page.screenshot({ path: path.join(EVIDENCIA, "paso-2-datos-de-envio.png"), fullPage: true });
  await page.getByRole("button", { name: "Continuar al pago" }).click();

  await expect(page).toHaveURL(/\/pago\/\d+/, { timeout: 30_000 });
  const orderId = Number(page.url().match(/\/pago\/(\d+)/)?.[1]);
  await page.screenshot({ path: path.join(EVIDENCIA, "paso-3-pantalla-de-pago.png"), fullPage: true });

  // Paso 3: pagar con tarjeta -> Stripe Checkout real (sandbox).
  await page.getByRole("button", { name: "Pagar con tarjeta" }).click();
  await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 45_000 });
  const formulario = await pagarEnStripe(page, { correo: `e2e${sufijo}@comproya-test.local`, numero: "4242424242424242", titular: cliente.name });
  await page.screenshot({ path: path.join(EVIDENCIA, "paso-4-stripe-checkout-tarjeta-aprobada.png"), fullPage: true });
  await formulario.getByTestId("payment-form-submit-button").click();

  // Paso 4: Stripe vuelve al comprobante; el webhook real (vía `stripe listen`) confirma el pago de forma asíncrona.
  // Se espera a que la pantalla lo muestre; nunca se fuerza el estado desde el test.
  await expect(page).toHaveURL(/\/comprobante\/\d+/, { timeout: 60_000 });
  await expect(page.getByText("¡Pedido confirmado!")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText("Código de retiro")).toHaveCount(0);
  await page.screenshot({ path: path.join(EVIDENCIA, "paso-5-pedido-confirmado.png"), fullPage: true });

  // Poscondiciones (caja negra desde la API pública): pedido Pagado con sus datos de envío.
  const pedido = await (await request.get(`${API_URL}/pedidos/${orderId}`, { headers: { Authorization: `Bearer ${cliente.accessToken}` } })).json();
  expect(pedido.status).toBe("PAID");
  expect(pedido.shippingAddress).toBe(envio.direccion);
  expect(pedido.shippingCity).toBe(envio.ciudad);
  expect(pedido.shippingPhone).toBe(envio.telefono);
});
