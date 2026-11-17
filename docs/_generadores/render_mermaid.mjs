// Convierte los diagramas de docs/_generadores/diagramas/*.mmd (Mermaid) en imágenes PNG con Chromium (Playwright).
//   MERMAID_JS=<ruta a mermaid.min.js> node docs/_generadores/render_mermaid.mjs [carpeta de salida]
// Mermaid no está en el repositorio: instálelo en una carpeta aparte (npm i mermaid) y apunte MERMAID_JS a dist/mermaid.min.js.
import { createRequire } from "module";
import { mkdirSync, readFileSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "../..");
const { chromium } = createRequire(path.join(RAIZ, "e2e/package.json"))("@playwright/test");
const MERMAID = process.env.MERMAID_JS;
if (!MERMAID) throw new Error("Defina MERMAID_JS con la ruta de mermaid.min.js");
const SALIDA = path.resolve(process.argv[2] ?? path.join(RAIZ, "docs/entrega-2/img"));
mkdirSync(SALIDA, { recursive: true });

const navegador = await chromium.launch();
const ctx = await navegador.newContext({ deviceScaleFactor: 2, viewport: { width: 1600, height: 1000 } });
const page = await ctx.newPage();
await page.setContent('<html><body style="margin:0;background:#fff"><div id="c" style="display:inline-block;padding:16px;background:#fff"></div></body></html>');
await page.addScriptTag({ path: MERMAID });
await page.evaluate(() =>
  window.mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    securityLevel: "loose",
    fontFamily: "Arial, sans-serif",
    themeVariables: { primaryColor: "#dbeafe", primaryBorderColor: "#2563eb", lineColor: "#475569", primaryTextColor: "#0f172a", fontSize: "15px" },
    flowchart: { htmlLabels: true, curve: "basis" },
    sequence: { mirrorActors: false, wrap: true, width: 170 },
  }),
);
for (const f of readdirSync(path.join(AQUI, "diagramas")).filter((x) => x.endsWith(".mmd"))) {
  const def = readFileSync(path.join(AQUI, "diagramas", f), "utf8");
  const svg = await page.evaluate(async (d) => (await window.mermaid.render("g" + Math.random().toString(36).slice(2), d)).svg, def);
  await page.evaluate((s) => (document.getElementById("c").innerHTML = s), svg);
  const destino = path.join(SALIDA, f.replace(/\.mmd$/, ".png"));
  await page.locator("#c").screenshot({ path: destino });
  console.log("ok", path.basename(destino));
}
await navegador.close();
