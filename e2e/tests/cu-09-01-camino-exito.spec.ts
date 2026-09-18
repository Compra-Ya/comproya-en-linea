import { test, expect } from "@playwright/test";
import path from "path";
import { registrarClienteDePrueba, iniciarSesionEnNavegador, sucursalSincronizada } from "../fixtures/cliente-de-prueba";

const API_URL = process.env.E2E_API_URL ?? "http://localhost:3001/api";
const EVIDENCIA = path.resolve(__dirname, "../../evidencia/CU-09-01");

// CU-09-01 — Camino de éxito (Plan_Pruebas_ComproYa.docx, sección 9.4):
// carrito con producto disponible, sucursal sincronizada, pago con tarjeta
// aprobado (4242...) -> Pedido = Pagado, Comprobante con código de retiro
// válido 5 días, el ERP registra el descuento de inventario. Caja negra:
// solo interactúa con la UI real y la pasarela real de Stripe en modo de
// prueba (sandbox) — nada de esto se simula.
test("CU-09-01: pago con tarjeta aprobado emite comprobante con código de retiro", async ({ page, request }) => {
  const sufijo = Date.now().toString().slice(-8);
  const cliente = await registrarClienteDePrueba(request, sufijo);
  const sucursal = await sucursalSincronizada(request);

  await iniciarSesionEnNavegador(page, cliente);

  // Paso 1: buscar el producto curado y agregarlo al carrito.
  await page.goto(`/?q=Televisor`);
  await page.getByRole("button", { name: "Agregar al carrito" }).first().click();
  await expect(page.getByText("Producto agregado al carrito")).toBeVisible();

  await page.goto("/carrito");
  await expect(page.getByText("Televisor", { exact: false })).toBeVisible();
  await page.screenshot({ path: path.join(EVIDENCIA, "paso-1-carrito.png"), fullPage: true });

  // Paso 2: confirmar el pedido eligiendo la sucursal ya sincronizada (RN-04).
  await page.getByRole("button", { name: "Continuar a la confirmación" }).click();
  await expect(page).toHaveURL(/\/pedido\/confirmar/);
  await page.locator("select").first().selectOption(String(sucursal.id));
  await page.screenshot({ path: path.join(EVIDENCIA, "paso-2-confirmacion-pedido.png"), fullPage: true });
  await page.getByRole("button", { name: "Confirmar pedido" }).click();

  await expect(page).toHaveURL(/\/pago\/\d+/);
  const orderId = Number(page.url().match(/\/pago\/(\d+)/)?.[1]);
  await page.screenshot({ path: path.join(EVIDENCIA, "paso-3-pantalla-de-pago.png"), fullPage: true });

  // Paso 3: pagar con tarjeta -> redirige a Stripe Checkout real (sandbox).
  await page.getByRole("button", { name: "Pagar con tarjeta" }).click();
  await expect(page).toHaveURL(/checkout\.stripe\.com/);

  await page.getByPlaceholder("email@example.com").fill(`e2e${sufijo}@comproya-test.local`);
  await page.getByPlaceholder("1234 1234 1234 1234").fill("4242424242424242");
  await page.getByPlaceholder("MM / YY").fill("12/34");
  await page.getByPlaceholder("CVC").fill("123");
  await page.getByPlaceholder("Full name on card").fill(cliente.name);
  await page.screenshot({ path: path.join(EVIDENCIA, "paso-4-stripe-checkout-tarjeta-aprobada.png"), fullPage: true });
  await page.getByRole("button", { name: "Pay" }).click();

  // Paso 4: Stripe redirige de vuelta al comprobante; el webhook real (vía
  // `stripe listen`) confirma el pago de forma asíncrona — se espera a que
  // la pantalla deje de reintentar, nunca se fuerza el estado desde el test.
  await expect(page).toHaveURL(/\/comprobante\/\d+/, { timeout: 30_000 });
  await expect(page.getByText("Pago confirmado")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Código de retiro")).toBeVisible();
  await page.screenshot({ path: path.join(EVIDENCIA, "paso-5-comprobante-emitido.png"), fullPage: true });

  // Poscondiciones (caja negra desde la API pública, sin tocar la BD directo):
  const pedido = await (
    await request.get(`${API_URL}/pedidos/${orderId}`, { headers: { Authorization: `Bearer ${cliente.accessToken}` } })
  ).json();
  expect(pedido.status).toBe("PAID");
  const cincoDiasMs = 5 * 24 * 60 * 60 * 1000;
  const vigencia = new Date(pedido.pickupCodeExpiresAt).getTime() - new Date(pedido.createdAt).getTime();
  expect(Math.abs(vigencia - cincoDiasMs)).toBeLessThan(10_000); // RN-08: 5 días calendario
});
