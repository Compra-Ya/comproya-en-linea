// Comprueba que el bloque de tokens de src/app/globals.css sea copia literal de
// design/design-system/tokens.css (la fuente de verdad del rediseño). Falla si se desviaron.
//   npm run tokens:comprobar
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const norm = (s) => s.replace(/\r\n/g, "\n");
const tokens = norm(readFileSync(path.resolve(AQUI, "../../design/design-system/tokens.css"), "utf8"))
  .replace("/* ComproYa en Línea — generated from tokens.json */\n", "")
  .trim();
const globales = norm(readFileSync(path.resolve(AQUI, "../src/app/globals.css"), "utf8"));

if (!globales.includes(tokens)) {
  console.error("globals.css no contiene tokens.css tal cual: vuelve a copiar el bloque de design/design-system/tokens.css.");
  process.exit(1);
}
console.log("Tokens al día: globals.css contiene design/design-system/tokens.css sin cambios.");
