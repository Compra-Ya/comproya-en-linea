import { defineConfig } from "@playwright/test";

// Pruebas del sistema (caja negra) del Caso de Uso 2 — CU-09-01 y CU-09-02
// (Plan_Pruebas_ComproYa.docx, sección 9.4). No usa `webServer`: hace falta
// backend + frontend + `stripe listen` corriendo por separado (ver README.md
// de esta carpeta) porque son tres procesos, no uno.
export default defineConfig({
  testDir: "./tests",
  timeout: 90_000,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
});
