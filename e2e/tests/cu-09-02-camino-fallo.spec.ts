import { test, expect } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";
import Stripe from "stripe";
import { registrarClienteDePrueba, iniciarSesionEnNavegador, sucursalSincronizada } from "../fixtures/cliente-de-prueba";

dotenv.config({ path: path.resolve(__dirname, "../../backend/.env") });

const API_URL = process.env.E2E_API_URL ?? "http://localhost:3001/api";
const EVIDENCIA = path.resolve(__dirname, "../../evidencia/CU-09-02");

// CU-09-02 — Camino de fallo (Plan_Pruebas_ComproYa.docx, sección 9.4): pago
// con tarjeta rechazado sobre una reserva ya creada -> Pago.estado = fallido,
// no se emite comprobante, la reserva se libera en <=15 minutos.
//
// Nota metodológica (ver Resultados_Pruebas_ComproYa.md): un rechazo de
// tarjeta en Stripe Checkout no cierra la sesión — solo muestra el error y
// deja reintentar (comprobado contra la API real). El backend únicamente
// pasa a PAYMENT_FAILED cuando la sesión expira de verdad
// (`checkout.session.expired`, 30 minutos reales, mínimo que exige la propia
// API de Stripe) o vía el job de 15 minutos. Ninguno es viable dentro de un
// test interactivo. Por eso, después de capturar el rechazo real en pantalla,
// el test expira esa misma Checkout Session con la API real de Stripe
// (`sessions.expire`, con la misma sk_test_... de backend/.env) — dispara el
// webhook real `checkout.session.expired` hacia `stripe listen`, exactamente
// como pasaría en producción si el cliente abandona la pestaña. No se llama
// a ningún endpoint interno de ComproYa para forzar el estado.
test("CU-09-02: pago con tarjeta rechazado libera la reserva sin emitir comprobante", async ({ page, request }) => {
  const sufijo = Date.now().toString().slice(-8);
  const cliente = await registrarClienteDePrueba(request, sufijo);
  const sucursal = await sucursalSincronizada(request);

  await iniciarSesionEnNavegador(page, cliente);

  const busqueda = await (await request.get(`${API_URL}/catalogo/productos?q=Licuadora`)).json();
  const productId: number = busqueda.items[0].id;

  await page.goto(`/?q=Licuadora`);
  await page.getByRole("button", { name: "Agregar al carrito" }).first().click();
  await expect(page.getByText("Producto agregado al carrito")).toBeVisible();

  await page.goto("/carrito");
  await page.screenshot({ path: path.join(EVIDENCIA, "paso-1-carrito.png"), fullPage: true });

  await page.getByRole("button", { name: "Continuar a la confirmación" }).click();
  await page.locator("select").first().selectOption(String(sucursal.id));
  await page.getByRole("button", { name: "Confirmar pedido" }).click();

  await expect(page).toHaveURL(/\/pago\/\d+/);
  const orderId = Number(page.url().match(/\/pago\/(\d+)/)?.[1]);

  // Poscondición previa (caja negra): la reserva ya quedó creada en el ERP
  // (RN-05) antes de que exista la posibilidad de cobrar.
  const disponibilidadAntes = await (
    await request.get(`${API_URL}/catalogo/productos/${productId}/disponibilidad`, { headers: { Authorization: `Bearer ${cliente.accessToken}` } })
  ).json();

  await page.getByRole("button", { name: "Pagar con tarjeta" }).click();
  await expect(page).toHaveURL(/checkout\.stripe\.com/);

  await page.getByPlaceholder("email@example.com").fill(`e2e${sufijo}@comproya-test.local`);
  await page.getByPlaceholder("1234 1234 1234 1234").fill("4000000000000002"); // tarjeta de prueba de Stripe para rechazo
  await page.getByPlaceholder("MM / YY").fill("12/34");
  await page.getByPlaceholder("CVC").fill("123");
  await page.getByPlaceholder("Full name on card").fill(cliente.name);
  await page.getByRole("button", { name: "Pay" }).click();

  // Paso: la pasarela rechaza el pago en tiempo real — se ve en la misma
  // pantalla de Stripe, sin redirigir de vuelta a ComproYa.
  await expect(page.getByText(/declined/i)).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: path.join(EVIDENCIA, "paso-2-stripe-tarjeta-rechazada.png"), fullPage: true });

  // Expira la Checkout Session real (ver nota metodológica arriba) para no
  // esperar los 30 minutos reales que exige la propia API de Stripe.
  const pedidoConPago = await (
    await request.get(`${API_URL}/pedidos/${orderId}`, { headers: { Authorization: `Bearer ${cliente.accessToken}` } })
  ).json();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });
  await stripe.checkout.sessions.expire(pedidoConPago.payment.gatewayToken);

  // El webhook real (`checkout.session.expired`, vía `stripe listen`) marca
  // el pago fallido y libera la reserva — se espera a que se refleje, nunca
  // se fuerza el estado desde el test.
  await expect
    .poll(
      async () => {
        const pedido = await (
          await request.get(`${API_URL}/pedidos/${orderId}`, { headers: { Authorization: `Bearer ${cliente.accessToken}` } })
        ).json();
        return pedido.status;
      },
      { timeout: 20_000, intervals: [1000] },
    )
    .toBe("PAYMENT_FAILED");

  await page.goto("/pedidos");
  await expect(page.getByText("Pago fallido")).toBeVisible();
  await page.screenshot({ path: path.join(EVIDENCIA, "paso-3-resultado-pago-fallido.png"), fullPage: true });

  // Poscondiciones: sin comprobante, reserva liberada.
  const comprobante = await request.get(`${API_URL}/pagos/${orderId}/comprobante`, {
    headers: { Authorization: `Bearer ${cliente.accessToken}` },
  });
  expect(comprobante.ok()).toBe(false);

  const disponibilidadDespues = await (
    await request.get(`${API_URL}/catalogo/productos/${productId}/disponibilidad`, { headers: { Authorization: `Bearer ${cliente.accessToken}` } })
  ).json();
  const antes = disponibilidadAntes.find((d: { branchId: number }) => d.branchId === sucursal.id);
  const despues = disponibilidadDespues.find((d: { branchId: number }) => d.branchId === sucursal.id);
  expect(despues.reservedUnits).toBeLessThanOrEqual(antes.reservedUnits); // reserva liberada, no acumulada
});
