// Genera docs/usabilidad/Guia_Participante_CU2_ComproYa.docx: lo que se imprime y se entrega a la persona que prueba el sistema
// (bienvenida, cómo pensar en voz alta, consentimiento, datos de prueba, una tarjeta por tarea, cuestionarios).
// Solo lleva lo que la persona debe ver: no incluye estados iniciales, rúbricas ni rutas ideales.
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { AlignmentType, Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, ShadingType, TableLayoutType, BorderStyle, VerticalAlign } from "docx";
import { COLOR, ESTILOS, FUENTE, H1, H2, NUMERACIONES, NUMEROS, P, PC, SALTO, VACIO, VERTICAL, VINETAS, ficha, pie, tabla } from "./lib/doc.mjs";
import { BLOQUES, DATOS_PRUEBA, DATOS_UNICOS, EQUIPO, SEQ, SUS, TAREAS } from "./tareas.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SALIDA = path.resolve(AQUI, "../../docs/usabilidad");
mkdirSync(SALIDA, { recursive: true });
const ANCHO = 9840;
const G = { tam: 26, interlineado: 340, alinear: AlignmentType.LEFT }; // texto grande para la persona

const tarea = (id) => TAREAS.find((t) => t.id === id);
const bloqueDe = (id) => BLOQUES.find((b) => b.tareas.includes(id));
// Preguntas que el evaluador hace dentro de una compra (no son tareas para entregar solas).
const DENTRO = { T03: "T07", T16: "T07", T17: "T08", T18: "T09" };

function tarjeta(id) {
  const t = tarea(id);
  const b = bloqueDe(id);
  const dentro = DENTRO[id];
  const sesion2 = b?.n === 9;
  const banner = new Table({
    width: { size: ANCHO, type: WidthType.DXA }, columnWidths: [ANCHO], layout: TableLayoutType.FIXED,
    rows: [new TableRow({ children: [new TableCell({
      width: { size: ANCHO, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill: COLOR.azul, color: "auto" },
      margins: { top: 140, bottom: 140, left: 220, right: 220 },
      children: [new Paragraph({ children: [new TextRun({ text: `Tarea ${id}`, bold: true, size: 36, color: "FFFFFF", font: FUENTE }), new TextRun({ text: `     ${sesion2 ? "Sesión 2" : `Bloque ${b?.n}`}`, size: 22, color: "FFFFFF", font: FUENTE })] })],
    })] })],
  });
  const cuerpo = [
    VACIO(240),
    ...(dentro ? [P(`Pregunta que te hará la persona que dirige la prueba durante la compra (se lee en voz alta, no se entrega):`, { tam: 22, cursiva: true, alinear: AlignmentType.LEFT, despues: 200 })] : []),
    new Table({
      width: { size: ANCHO, type: WidthType.DXA }, columnWidths: [ANCHO], layout: TableLayoutType.FIXED,
      rows: [new TableRow({ children: [new TableCell({
        width: { size: ANCHO, type: WidthType.DXA }, margins: { top: 300, bottom: 300, left: 300, right: 300 },
        borders: { top: { style: BorderStyle.SINGLE, size: 12, color: COLOR.naranja }, bottom: { style: BorderStyle.SINGLE, size: 12, color: COLOR.naranja }, left: { style: BorderStyle.SINGLE, size: 12, color: COLOR.naranja }, right: { style: BorderStyle.SINGLE, size: 12, color: COLOR.naranja } },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ children: [new TextRun({ text: t.enunciado, size: 34, font: FUENTE })], spacing: { line: 400 }, alignment: AlignmentType.LEFT })],
      })] })],
    }),
    VACIO(300),
    P(t.tipo === "operacion" ? "Cuando creas que terminaste, di en voz alta: **«Listo»**." : "Cuéntanos lo que piensas **en voz alta**. No hay respuestas buenas ni malas.", { tam: 26, alinear: AlignmentType.LEFT }),
    P("Si algo te confunde, dilo en voz alta; es justo lo que queremos saber.", { tam: 22, cursiva: true, color: "555555", alinear: AlignmentType.LEFT }),
  ];
  return [banner, ...cuerpo, SALTO()];
}

const portada = [
  VACIO(900),
  PC("Prueba de usabilidad", { tam: 30, color: "555555", despues: 100 }),
  PC("ComproYa en Línea", { tam: 52, negrita: true, color: COLOR.azul, despues: 100 }),
  PC("Guía del participante", { tam: 34, despues: 800 }),
  ficha([["Código del participante (P01 a P05)", "", true], ["Fecha de la sesión 1", "", true], ["Fecha de la sesión 2", "", true], ["Quien dirige la prueba", "", true]], 4000, 5840, { tam: 24, altoFila: 520 }),
  VACIO(500),
  PC(`${EQUIPO.curso} · ${EQUIPO.universidad}`, { tam: 20, color: "555555", despues: 40 }),
  PC(EQUIPO.integrantes.join(" y "), { tam: 20, color: "555555", despues: 40 }),
  SALTO(),
];

const bienvenida = [
  H1("Bienvenida"),
  P("Gracias por ayudarnos. Vamos a probar una **tienda en línea de práctica**, hecha por estudiantes. Lo que se evalúa es el sistema, **no a ti**: si algo te resulta confuso, nos ayuda a mejorarlo.", G),
  H2("Qué vas a hacer"),
  ...VINETAS([
    "Hacer tareas sencillas en la tienda, como buscar un producto y comprarlo.",
    "Una persona leerá cada tarea y te la entregará en una tarjeta. Esa persona **no podrá ayudarte** mientras la haces, porque necesitamos ver cómo lo usarías tú solo(a).",
    "Grabaremos la pantalla y tu voz. Puedes parar cuando quieras.",
    "Todo lo que escribas es **ficticio** y la tienda está en modo de prueba: no se usa ninguna tarjeta real ni se hace ningún cobro.",
  ], { tam: 24 }),
  H2("Piensa en voz alta"),
  P("Mientras usas la tienda, **di en voz alta lo que piensas**: qué estás buscando, qué entiendes, qué te confunde, qué esperabas que pasara. Aunque te parezca obvio, dilo. Si te quedas callado(a), te preguntaremos: «¿qué estás pensando?».", G),
  P("Para practicar: describe en voz alta cómo abrirías la página de tu correo electrónico.", { ...G, negrita: true }),
  SALTO(),
];

const consentimiento = [
  H1("Consentimiento informado"),
  P("Entiendo que: (1) se evalúa el sistema y no mi desempeño; (2) haré varias tareas de compra con datos ficticios, y la pasarela de pagos está en modo de prueba, por lo que no se usa ninguna tarjeta real ni se hace ningún cobro; (3) se grabará la pantalla y mi voz mientras pienso en voz alta, y, si lo autorizo, mi rostro; (4) las grabaciones se usarán solo para el curso, se identificarán con un código (P01 a P05) y no se publicarán; (5) puedo detener la prueba en cualquier momento sin consecuencias.", G),
  VACIO(200),
  ficha(
    [["Acepto participar (sí / no)", "", true], ["Autorizo grabar pantalla y voz (sí / no)", "", true], ["Autorizo grabar mi rostro con la cámara (sí / no)", "", true], ["Nombre", "", true], ["Firma", "", true], ["Fecha", "", true]],
    4800, 5040, { tam: 24, altoFila: 560 },
  ),
  SALTO(),
];

const perfil = [
  H1("Cuéntanos de ti"),
  P("Estas preguntas nos ayudan a entender a quién representa esta prueba. Responde solo lo que quieras.", G),
  ficha(
    [["Edad", "", true], ["Ocupación", "", true], ["Nivel de estudios", "", true], ["¿Con qué frecuencia compras en línea? (nunca, al mes, a la semana…)", "", true], ["¿En qué tiendas en línea has comprado?", "", true], ["¿Qué dispositivo y navegador usas casi siempre?", "", true], ["¿Habías usado antes esta tienda (ComproYa)?", "", true], ["¿Has pagado antes con tarjeta en una página de pagos?", "", true]],
    5000, 4840, { tam: 24, altoFila: 600 },
  ),
  SALTO(),
];

const datos = [
  H1("Datos de prueba"),
  P("Usa estos datos cuando una tarea te pida escribir información. Son ficticios; puedes escribirlos tal cual.", G),
  tabla([4300, 5540], ["Dato", "Lo que debes escribir"], DATOS_PRUEBA.map(([a, b]) => [a, b]), { primeraNegrita: true, tam: 22, tamCab: 22, altoFila: 560 }),
  H2("Tus datos únicos"),
  P("Cada persona crea su propia cuenta, por eso el documento y el correo son distintos. Usa los de tu fila.", G),
  tabla([2000, 3400, 4440], ["Participante", "Documento de identidad", "Correo electrónico"], DATOS_UNICOS.map(([c, d, e]) => [c, d, e]), { primeraNegrita: true, tam: 22, tamCab: 22, altoFila: 520 }),
  P("Para pagar, la propia pantalla de pago te dirá qué tarjeta de prueba usar.", { ...G, antes: 200 }),
  SALTO(),
];

const SEQ_ESCALA = [
  H1("Después de cada tarea: ¿qué tan fácil fue?"),
  P(SEQ, G),
  tabla(
    [1405, 1405, 1405, 1405, 1405, 1405, 1410],
    ["1", "2", "3", "4", "5", "6", "7"],
    [["Muy difícil", "", "", "", "", "", "Muy fácil"]],
    { tam: 22, tamCab: 30, centrar: [0, 1, 2, 3, 4, 5, 6], altoFila: 700, llenar: [1, 2, 3, 4, 5] },
  ),
  P("La persona que dirige la prueba anotará tu número.", { tam: 22, cursiva: true, color: "555555", alinear: AlignmentType.LEFT, antes: 200 }),
  SALTO(),
];

const susTabla = [
  H1("Al terminar: tu opinión sobre el sistema"),
  P("Marca qué tan de acuerdo estás con cada afirmación: 1 es «totalmente en desacuerdo» y 5 es «totalmente de acuerdo».", G),
  tabla(
    [600, 5640, 720, 720, 720, 720, 720],
    ["N.º", "Afirmación", "1", "2", "3", "4", "5"],
    SUS.map((s, i) => [String(i + 1), s, "", "", "", "", ""]),
    { tam: 21, tamCab: 22, centrar: [0, 2, 3, 4, 5, 6], altoFila: 600, llenar: [2, 3, 4, 5, 6] },
  ),
  SALTO(),
];

const finales = [
  H1("Tres preguntas finales"),
  ...NUMEROS(["¿Qué fue lo más fácil de hacer en la tienda?", "¿Qué fue lo más difícil o confuso?", "Si pudieras cambiar una sola cosa, ¿qué cambiarías?"], "lista3", { tam: 26 }),
  tabla([9840], ["Tus respuestas"], [[""]], { llenar: [0], altoFila: 5200 }),
  VACIO(300),
  PC("¡Gracias por tu tiempo!", { tam: 32, negrita: true, color: COLOR.azul }),
];

const tarjetasSesion1 = BLOQUES.filter((b) => b.n < 9).flatMap((b) => [
  H1(`Bloque ${b.n}: ${b.nombre}`),
  P(`Tareas de este bloque: ${b.tareas.join(", ")}. Duración aproximada: ${b.min} minutos.`, { tam: 22, alinear: AlignmentType.LEFT }),
  SALTO(),
  ...b.tareas.flatMap(tarjeta),
]);
const tarjetasSesion2 = BLOQUES.filter((b) => b.n === 9).flatMap((b) => [
  H1(`Sesión 2 (al día siguiente): ${b.nombre}`),
  P("Estas tareas las haces sin ayuda ni recordatorios. Solo necesitas la hoja «Datos de prueba».", { tam: 22, alinear: AlignmentType.LEFT }),
  SALTO(),
  ...b.tareas.flatMap(tarjeta),
]);

const doc = new Document({
  creator: EQUIPO.integrantes.join(" y "),
  title: "Guía del participante — Prueba de usabilidad ComproYa en Línea",
  styles: ESTILOS,
  numbering: { config: NUMERACIONES },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: VERTICAL.margin } },
    footers: { default: pie("Guía del participante · ComproYa en Línea") },
    children: [...portada, ...bienvenida, ...consentimiento, ...perfil, ...datos, ...tarjetasSesion1, ...SEQ_ESCALA, ...susTabla, ...finales, SALTO(), ...tarjetasSesion2],
  }],
});
const buffer = await Packer.toBuffer(doc);
const destino = path.join(SALIDA, "Guia_Participante_CU2_ComproYa.docx");
writeFileSync(destino, buffer);
console.log(`Escrito docs/usabilidad/Guia_Participante_CU2_ComproYa.docx (${(buffer.length / 1024).toFixed(0)} KB)`);
