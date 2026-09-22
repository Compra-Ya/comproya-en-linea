import { test, expect } from "@playwright/test";
import path from "path";

const API_URL = process.env.E2E_API_URL ?? "http://localhost:3001/api";
const EVIDENCIA = path.resolve(__dirname, "../../evidencia/CU-04-01");

// CU-04-01 — Camino de éxito (Plan_Pruebas_ComproYa.docx, sección 9.4): un
// Cliente digital se registra (CU-04) y luego otorga su consentimiento sobre
// la política de datos personales (CU-05) -> Cuenta activa, Consentimiento
// = ACTIVO. Caja negra: solo interactúa con la UI real (P-4, P-5) y la API
// pública, contra el backend y la base de datos reales — nada se simula.
test("CU-04-01: registro de cuenta y activación del consentimiento quedan reflejados en la cuenta", async ({
  page,
  request,
}) => {
  const sufijo = Date.now().toString().slice(-8);
  const documento = `E2EREG${sufijo}`;
  const correo = `e2e-registro-${sufijo}@comproya-test.local`;
  const nombre = `Cliente Registro E2E ${sufijo}`;

  // Paso 1: registro (CU-04) con documento nuevo, sin cuenta previa.
  await page.goto("/registro");
  await page.getByPlaceholder("Nombre y apellido").fill(nombre);
  await page.getByPlaceholder("Número de documento").fill(documento);
  await page.getByPlaceholder("correo@ejemplo.com").fill(correo);
  await page.getByPlaceholder("••••••••").fill("claveClave1");
  await page.screenshot({ path: path.join(EVIDENCIA, "paso-1-registro.png"), fullPage: true });
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  // Paso 2: el registro redirige a /privacidad (P-5) con el consentimiento
  // todavía Pendiente (CuentaService.registrar() crea Consent.active=false).
  await expect(page).toHaveURL(/\/privacidad/);
  const interruptor = page.locator("button[aria-pressed]");
  const insigniaActivo = page.locator("span.badge-ok", { hasText: "Consentimiento activo" });
  await expect(interruptor).toHaveAttribute("aria-pressed", "false");
  await expect(insigniaActivo).not.toBeVisible();
  await page.screenshot({ path: path.join(EVIDENCIA, "paso-2-privacidad-pendiente.png"), fullPage: true });

  // Paso 3: el cliente acepta la política de datos personales (CU-05) — un
  // solo clic sobre el interruptor, sin identificador de lealtad (canon,
  // sección 10: activar el consentimiento en <= 2 interacciones).
  await interruptor.click();
  await expect(insigniaActivo).toBeVisible();
  await expect(interruptor).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({ path: path.join(EVIDENCIA, "paso-3-consentimiento-activo.png"), fullPage: true });

  // Poscondiciones (caja negra desde la API pública, sin tocar la BD directo).
  const token = await page.evaluate(() => localStorage.getItem("comproya_token"));
  const consentimientoRes = await request.get(`${API_URL}/cuenta/consentimiento`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(consentimientoRes.ok()).toBeTruthy();
  const consentimiento = await consentimientoRes.json();
  expect(consentimiento.active).toBe(true);
});
