// Genera docs/usabilidad/Guia_Participante_CU2_ComproYa.docx: lo único que ve la persona. Corta (unas 4 páginas), sin términos
// técnicos y con la escala de dificultad de 1 a 7 debajo de cada tarea. Contenido: sesion.mjs.
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { AlignmentType, Document, Packer, Paragraph, Table, TableRow, TextRun, WidthType, TableLayoutType, VerticalAlign } from "docx";
import { COLOR, ESTILOS, FUENTE, NUMERACIONES, P, VACIO, VINETAS, celda, pie, tabla } from "./lib/doc.mjs";
import { CUENTAS, DATOS, PARTICIPANTES, PREGUNTA_FINAL, TAREAS } from "./sesion.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SALIDA = path.resolve(AQUI, "../../docs/usabilidad");
mkdirSync(SALIDA, { recursive: true });
const W = 10840; // ancho útil con márgenes de 700
const T = { tam: 22, alinear: AlignmentType.LEFT, despues: 80, interlineado: 264 };
const principales = TAREAS.filter((t) => t.seq !== undefined && !t.en);
const hijas = (t) => (t.durante ?? []).map((n) => TAREAS.find((x) => x.n === n));

function tarjeta(t) {
  const filas = [];
  const cuerpo = [`**Tarea ${t.n.slice(1)}.** ${t.texto}`];
  filas.push(new TableRow({ cantSplit: true, children: [celda(cuerpo, { ancho: W, span: 9, tam: 22, fondo: undefined })] }));
  const pregs = hijas(t);
  if (pregs.length) {
    filas.push(new TableRow({ cantSplit: true, children: [celda(["**Durante la tarea te haremos estas preguntas** (responde en voz alta):", ...pregs.map((q) => `•  ${q.texto}`)], { ancho: W, span: 9, tam: 20, fondo: COLOR.llenar })] }));
  }
  if (t.seq) {
    const anchos = [1500, ...Array(7).fill(1120), 1500];
    filas.push(new TableRow({ cantSplit: true, children: [celda("¿Qué tan fácil o difícil te resultó esta tarea? (marca tu número)", { ancho: W, span: 9, tam: 19, fondo: COLOR.azulClaro })] }));
    const rot = ["Muy difícil", ...[1, 2, 3, 4, 5, 6, 7].map((n) => `${n}  ☐`), "Muy fácil"];
    filas.push(new TableRow({ cantSplit: true, children: rot.map((r, i) => celda(r, { ancho: anchos[i], tam: i === 0 || i === 8 ? 18 : 22, alinear: AlignmentType.CENTER, vAlign: VerticalAlign.CENTER })) }));
  }
  return [
    new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [1500, ...Array(7).fill(1120), 1500], layout: TableLayoutType.FIXED, rows: filas }),
    VACIO(120),
  ];
}

const hojaDatos = DATOS.map(([a, b]) => [a, b]);
const children = [
  P("Prueba de ComproYa en Línea", { tam: 36, negrita: true, color: COLOR.azul, alinear: AlignmentType.LEFT, despues: 40 }),
  P("Guía del participante · Gracias por ayudarnos", { tam: 22, color: "555555", alinear: AlignmentType.LEFT, despues: 120 }),
  P("**Antes de empezar**", { ...T, color: COLOR.azul }),
  ...VINETAS([
    "Probamos la tienda, **no a ti**. Si algo te confunde, es justo lo que queremos saber.",
    "Haz cada tarea como lo harías en tu casa. **No te vamos a ayudar** mientras la haces; así vemos qué hay que mejorar.",
    "Mientras usas la tienda, **di en voz alta lo que piensas**: qué buscas, qué te confunde, qué esperabas que pasara.",
    "Grabamos la pantalla y tu voz, solo para el trabajo de clase. Es una tienda de práctica: **no se cobra nada**.",
  ], { tam: 21 }),
  P("**Tu consentimiento**", { ...T, antes: 80, color: COLOR.azul }),
  P("Acepto participar y que se grabe mi pantalla y mi voz solo para este trabajo. Puedo parar cuando quiera.", { ...T, tam: 21 }),
  tabla([2600, 3900, 2400, 1940], ["Nombre", "Firma", "Fecha", "Código"], [["", "", "", ""]], { llenar: [0, 1, 2, 3], altoFila: 420 }),
  VACIO(100),
  P("**Datos para usar en la tienda** (son de práctica; escríbelos tal cual)", { ...T, color: COLOR.azul }),
  tabla(
    [900, 3600, 2200, 4140],
    ["Persona", "Nombre completo", "Documento", "Correo electrónico"],
    CUENTAS.map((c, i) => [`**${c.codigo}**`, PARTICIPANTES[i].nombre || "(tu nombre)", c.documento, c.correo]),
    { centrar: [0], tam: 19 },
  ),
  VACIO(60),
  tabla([3900, 6940], ["Dato", "Qué escribir"], hojaDatos, { primeraNegrita: true, tam: 19 }),
  P("Para pagar, la propia página te dirá qué tarjeta de prueba usar.", { ...T, antes: 60, tam: 20 }),
  VACIO(80),
  P("**Tareas** (la persona que dirige la prueba te irá diciendo cuál sigue)", { ...T, color: COLOR.azul }),
  ...principales.flatMap(tarjeta),
  P(`**Para terminar:** ${PREGUNTA_FINAL}`, { ...T, antes: 60 }),
  tabla([W], ["Tu respuesta"], [[""]], { llenar: [0], altoFila: 900 }),
  VACIO(60),
  P("¡Muchas gracias!", { tam: 24, negrita: true, color: COLOR.azul, alinear: AlignmentType.LEFT }),
];

const doc = new Document({
  creator: "Equipo ComproYa",
  title: "Guía del participante — Prueba de ComproYa en Línea",
  styles: ESTILOS,
  numbering: { config: NUMERACIONES },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 700, bottom: 800, left: 700, right: 700 } } },
    footers: { default: pie("Guía del participante · ComproYa en Línea") },
    children,
  }],
});
const buffer = await Packer.toBuffer(doc);
writeFileSync(path.join(SALIDA, "Guia_Participante_CU2_ComproYa.docx"), buffer);
console.log(`Escrito docs/usabilidad/Guia_Participante_CU2_ComproYa.docx (${(buffer.length / 1024).toFixed(0)} KB)`);
