// Regenera design/02-estado-actual/inventario.md a partir de capturas.json.
//   cd e2e && node capturas/generar-inventario.mjs
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../design/02-estado-actual");
const r = JSON.parse(readFileSync(path.join(DIR, "capturas.json"), "utf8"));
const fuente = {
  "/": "frontend/src/app/page.tsx",
  producto: "frontend/src/app/producto/[id]/page.tsx",
  carrito: "frontend/src/app/carrito/page.tsx",
  pedido: "frontend/src/app/pedido/confirmar/page.tsx",
  pago: "frontend/src/app/pago/[orderId]/page.tsx",
  comprobante: "frontend/src/app/comprobante/[orderId]/page.tsx",
  pedidos: "frontend/src/app/pedidos/page.tsx",
  registro: "frontend/src/app/registro/page.tsx",
  ingresar: "frontend/src/app/ingresar/page.tsx",
  privacidad: "frontend/src/app/privacidad/page.tsx",
};
const src = (ruta) => fuente[ruta === "/" || ruta.startsWith("/?") ? "/" : ruta.split(/[/?]/)[1]] ?? "?";
const pantallas = [
  ["Catálogo y búsqueda", "/", "Caso de Uso 2"],
  ["Detalle de producto con disponibilidad por sucursal", "/producto/[id]", "Caso de Uso 2"],
  ["Carrito (invitado y registrado)", "/carrito", "Caso de Uso 2"],
  ["Confirmar pedido (sucursal + cupón)", "/pedido/confirmar", "Caso de Uso 2"],
  ["Pago (tarjeta / débito bancario)", "/pago/[orderId]", "Caso de Uso 2"],
  ["Comprobante con código de retiro", "/comprobante/[orderId]", "Caso de Uso 2"],
  ["Mis pedidos", "/pedidos", "Caso de Uso 2"],
  ["Registro (paso previo)", "/registro", "Paso previo"],
  ["Inicio de sesión (paso previo)", "/ingresar", "Paso previo"],
  ["Consentimiento (destino del registro)", "/privacidad", "Paso previo"],
];
const ruido = /^Sin sincronizar|^Una sucursal con m|^Tu cuenta quedar|^Toda solicitud|^Al confirmar, tus|^Este pago lo admin|^Se simula/;

let md = `# Inventario de pantallas y capturas — estado actual

Capturas a **1440 px** y **390 px** de ancho, página completa. Generadas con \`e2e/capturas/capturar-estado-actual.mjs\` (ver [README](../README.md)). Las rutas con número (\`/pago/25\`) son pedidos de la base local de pruebas. Las capturas \`09\` y \`42\` simulan la respuesta del servidor sin foto, porque en el catálogo de pruebas todo producto publicado tiene foto.

## 1. Pantallas del flujo

| Pantalla | Ruta | Archivo fuente | Alcance |
|---|---|---|---|
`;
for (const [n, ru, al] of pantallas) md += `| ${n} | \`${ru}\` | \`${src(ru.replace("[id]", "1").replace("[orderId]", "1"))}\` | ${al} |\n`;
md += `| Publicar producto, detalle interno de pedido | \`/interno/publicar\`, \`/interno/pedidos/[id]\` | \`frontend/src/app/interno/**\` | Fuera del alcance del rediseño |

Componentes compartidos: \`frontend/src/components/ShopHeader.tsx\`, \`frontend/src/components/ProductImage.tsx\`; estilos: \`frontend/src/app/globals.css\`; textos de cabecera y pie: \`frontend/src/app/layout.tsx\`.

## 2. Capturas por estado

Cada fila es el mismo estado a 1440 px y a 390 px. «Avisos» son los textos de aviso o error que la pantalla mostraba.

| Estado | Ruta | Archivo fuente | 1440 px | 390 px | Avisos en pantalla |
|---|---|---|---|---|---|
`;
const d = r.filter((x) => x.ancho === 1440);
const m = r.filter((x) => x.ancho === 390);
d.forEach((x, i) => {
  const nom = x.archivo.split("/")[1];
  const av = x.avisos.filter((a) => !ruido.test(a)).map((a) => a.replace(/\n/g, " ")).join(" · ");
  md += `| ${x.nota} | \`${x.ruta}\` | \`${src(x.ruta)}\` | [${nom}](${x.archivo}) | [${nom}](${m[i].archivo}) | ${av || "—"} |\n`;
});
md += `
## 3. Estados que no existen hoy

- **Cargando del catálogo y del detalle:** no hay indicador; la captura \`05\` muestra la pantalla sin productos mientras llega la respuesta.
- **Cargando del comprobante:** solo el texto «Confirmando el pago con la pasarela…» (captura \`39\`).
- **Pago con tarjeta en la pasarela (Stripe Checkout):** pantalla externa, no capturada.
- **Pedido en alistamiento, listo para retiro, entregado:** estados que mueve un rol interno; en Mis pedidos solo cambia la etiqueta de texto, sin acción para el cliente.
- **Firma de webhook y secreto de débito inválidos:** sin pantalla; ver \`respuestas-api.json\` y [03-flujo-cu2.md](../03-flujo-cu2.md).
`;
writeFileSync(path.join(DIR, "inventario.md"), md);
console.log(d.length, m.length);
