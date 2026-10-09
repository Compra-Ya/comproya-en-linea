// Sincroniza los archivos derivados del sistema de diseño (design/design-system):
//   - src/components/ui/ui.css  <- components/bundle.css (las mismas clases cy-*; sin el @import de la
//     tipografía, que ya carga globals.css).
//   - src/components/ui/tipos.ts <- components/index.d.ts (los tipos de las props, sin las funciones
//     ni el bloque global de la referencia).
//   - src/app/pantallas.css <- design/rediseno/pantallas/screens.css (composición de pantallas: hero, rejillas,
//     columnas de compra, acceso).
//   node scripts/sincronizar-ui.mjs           escribe los archivos
//   node scripts/sincronizar-ui.mjs --comprobar  falla si los archivos del repo se desviaron
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SISTEMA = path.resolve(AQUI, "../../design/design-system/components");
const UI = path.resolve(AQUI, "../src/components/ui");
const norm = (s) => s.replace(/\r\n/g, "\n");

const css = norm(readFileSync(path.join(SISTEMA, "bundle.css"), "utf8"))
  .split("\n")
  .filter((l) => !l.startsWith("@import url("))
  .join("\n")
  .replace(/^\n+/, "");
const salidaCss = `/* GENERADO por scripts/sincronizar-ui.mjs a partir de design/design-system/components/bundle.css.
   No editar a mano: cambiar el sistema de diseño y volver a sincronizar (npm run ui:sincronizar). */\n${css}`;

const dts = norm(readFileSync(path.join(SISTEMA, "index.d.ts"), "utf8"));
const tipos = dts
  .replace(/declare global \{[\s\S]*\}\s*$/, "")
  .split("\n")
  .filter((l) => !l.startsWith("export declare function"))
  .join("\n")
  .trim();
const salidaTipos = `// GENERADO por scripts/sincronizar-ui.mjs a partir de design/design-system/components/index.d.ts.
// No editar a mano: cambiar el sistema de diseño y volver a sincronizar (npm run ui:sincronizar).
${tipos}\n`;

const pantallas = norm(readFileSync(path.resolve(AQUI, "../../design/rediseno/pantallas/screens.css"), "utf8"));
const salidaPantallas = `/* GENERADO por scripts/sincronizar-ui.mjs a partir de design/rediseno/pantallas/screens.css.
   No editar a mano: cambiar el diseño y volver a sincronizar (npm run ui:sincronizar). */
${pantallas}`;

const archivos = [
  [path.resolve(AQUI, "../src/app/pantallas.css"), salidaPantallas],
  [path.join(UI, "ui.css"), salidaCss],
  [path.join(UI, "tipos.ts"), salidaTipos],
];

if (process.argv.includes("--comprobar")) {
  const desviados = archivos.filter(([ruta, esperado]) => {
    try {
      return norm(readFileSync(ruta, "utf8")) !== esperado;
    } catch {
      return true;
    }
  });
  if (desviados.length) {
    console.error("Desviados del sistema de diseño:", desviados.map(([r]) => path.basename(r)).join(", "), "→ npm run ui:sincronizar");
    process.exit(1);
  }
  console.log("ui.css y tipos.ts coinciden con design/design-system.");
} else {
  for (const [ruta, contenido] of archivos) writeFileSync(ruta, contenido);
  console.log("Sincronizados:", archivos.map(([r]) => path.basename(r)).join(", "));
}
