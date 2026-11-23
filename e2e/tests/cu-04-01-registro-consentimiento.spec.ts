import { test, expect } from "@playwright/test";
import path from "path";
import { sufijoUnico } from "../fixtures/cliente-de-prueba";

const API_URL = process.env.E2E_API_URL ?? "http://localhost:3001/api";
const EVIDENCIA = path.resolve(__dirname, "../../evidencia/CU-04-01");

// CU-04-01 — Registro de cuenta y consentimiento (CU-04 y CU-05). Interfaz actual (venta digital con envío): el
// formulario de /registro lleva la casilla de consentimiento y, al marcarla, la cuenta queda con el consentimiento
// activo (RN-10) — no hace falta pasar por /privacidad. Caja negra: solo la interfaz real y la API pública, contra el
// backend y la base de datos reales; nada se simula.
async function llenarRegistro(page: import("@playwright/test").Page, sufijo: string) {
  await page.goto("/registro");
  await page.getByLabel("Nombre completo").fill(`Cliente Registro E2E ${sufijo}`);
  await page.getByLabel("Documento de identidad").fill(`77${sufijo}`);
  await page.getByLabel("Correo electrónico").fill(`e2e-registro-${sufijo}@comproya-test.local`);
  await page.getByLabel("Contraseña").fill("claveClave1");
}

test("CU-04-01: registro de cuenta con la casilla de consentimiento deja el consentimiento activo", async ({ page, request }) => {
  const sufijo = sufijoUnico();

  // Paso 1: registro con documento nuevo y la casilla marcada (CU-05 dentro del registro).
  await llenarRegistro(page, sufijo);
  await page.getByRole("checkbox").check();
  await page.screenshot({ path: path.join(EVIDENCIA, "paso-1-registro.png"), fullPage: true });
  await page.locator("form").getByRole("button", { name: "Crear cuenta" }).click();

  // Paso 2: la cuenta se crea, el cliente queda con sesión y sale del formulario.
  await expect(page).not.toHaveURL(/\/registro/, { timeout: 30_000 });
  const token = await page.evaluate(() => localStorage.getItem("comproya_token"));
  expect(token).toBeTruthy();

  // Paso 3: en Privacidad y consentimiento el interruptor está activo y la insignia lo confirma.
  await page.goto("/privacidad");
  await expect(page.locator("button[aria-pressed]")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("span.badge-ok", { hasText: "Consentimiento activo" })).toBeVisible();
  await page.screenshot({ path: path.join(EVIDENCIA, "paso-2-consentimiento-activo.png"), fullPage: true });

  // Poscondición (caja negra desde la API pública, sin tocar la base directo).
  const respuesta = await request.get(`${API_URL}/cuenta/consentimiento`, { headers: { Authorization: `Bearer ${token}` } });
  expect(respuesta.ok()).toBeTruthy();
  expect((await respuesta.json()).active).toBe(true);
});

test("CU-04-01 (camino de fallo): sin marcar la casilla no se crea la cuenta y el formulario explica por qué", async ({ page }) => {
  const sufijo = sufijoUnico();

  await llenarRegistro(page, sufijo);
  await page.locator("form").getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page.getByText("Acepta el tratamiento de datos para crear tu cuenta.")).toBeVisible();
  await expect(page).toHaveURL(/\/registro/);
  expect(await page.evaluate(() => localStorage.getItem("comproya_token"))).toBeNull();
  await page.screenshot({ path: path.join(EVIDENCIA, "fallo-sin-consentimiento.png"), fullPage: true });
});
