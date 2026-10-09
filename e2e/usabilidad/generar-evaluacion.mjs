// Genera docs/usabilidad/Evaluacion_Usabilidad_CU2_ComproYa.docx: el documento de la evaluación de usabilidad del CU-2
// (ISO/IEC 9126-2, sección 8.3, casos 1 a 12), preparado para llenarse con la sesión del participante.
// Lee tareas.mjs (contenido), linea-base.json (clics, teclas y tiempos medidos) y, si existen, los resultados de las
// verificaciones previas (design/verificacion-rediseno/*.json).
import { readFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { AlignmentType, Document, PageOrientation, Packer, Paragraph, SectionType, TableOfContents, TextRun, Footer } from "docx";
import { writeFileSync } from "fs";
import {
  ANCHO_H, ANCHO_V, COLOR, ESTILOS, FUENTE, H1, H2, H3, NUMERACIONES, NUMEROS, P, PC, SALTO, VACIO, VERTICAL, VINETAS, celda, ficha, fmtSeg, pie, tabla, runs,
} from "./lib/doc.mjs";
import { BLOQUES, CASOS, DATOS_PRUEBA, EQUIPO, INVENTARIOS, REFERENCIAS, SEQ, SUS, TAREAS } from "./tareas.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "../..");
const SALIDA = path.join(RAIZ, "docs/usabilidad");
mkdirSync(SALIDA, { recursive: true });

const leer = (ruta) => (existsSync(ruta) ? JSON.parse(readFileSync(ruta, "utf8")) : null);
const LB = leer(path.join(AQUI, "linea-base.json"));
if (!LB) throw new Error("Falta usabilidad/linea-base.json: ejecuta primero medir-linea-base.mjs");
const REDISENO = leer(path.join(RAIZ, "design/verificacion-rediseno/resultados.json"));
const TECLADO = leer(path.join(RAIZ, "design/verificacion-rediseno/teclado.json"));
const AXE = leer(path.join(RAIZ, "design/verificacion-rediseno/axe.json"));

const tarea = (id) => TAREAS.find((t) => t.id === id);
const base = (id) => LB.tareas[id];
const caso = (n) => CASOS.find((c) => c.n === n);
const CASO_DE = (id) => tarea(id).caso;
const esOperativa = (id) => tarea(id).tipo === "operacion";
const KLM = LB.metodo.klm;
const coma = (n, d = 1) => Number(n).toLocaleString("es-CO", { minimumFractionDigits: d, maximumFractionDigits: d });

// ---------------------------------------------------------------- Portada
const portada = [
  VACIO(600),
  PC("Aplicación Web de Comercio Electrónico", { tam: 30, negrita: true, color: COLOR.azul, despues: 80 }),
  PC("Venta de Electrodomésticos y Productos de Retail", { tam: 24, color: "555555", despues: 500 }),
  PC(EQUIPO.titulo, { tam: 44, negrita: true, color: COLOR.azul, despues: 160 }),
  PC(EQUIPO.subtitulo, { tam: 24, despues: 160 }),
  PC("Incluye la línea base de tiempos y clics del equipo, las tablas de registro del participante, la comparación equipo–usuario y la revisión de otras pruebas de usabilidad viables en pruebas de software", { tam: 20, cursiva: true, color: "555555", despues: 700 }),
  PC("Integrantes:", { negrita: true, despues: 60 }),
  ...EQUIPO.integrantes.map((n) => PC(n, { despues: 40 })),
  VACIO(200),
  PC("Docente:", { negrita: true, despues: 60 }),
  PC(EQUIPO.docente, { despues: 300 }),
  PC(EQUIPO.curso, { despues: 40 }),
  PC(EQUIPO.universidad, { despues: 40 }),
  PC(EQUIPO.fecha, { despues: 40 }),
  PC(EQUIPO.ciudad, { despues: 40 }),
  SALTO(),
  P("Índice", { tam: 32, negrita: true, color: COLOR.azul, alinear: AlignmentType.LEFT, despues: 200 }),
  new TableOfContents("Índice", { hyperlink: true, headingStyleRange: "1-2" }),
  SALTO(),
];

// ---------------------------------------------------------------- 1 a 5 (vertical)
const intro = [
  H1("1. Introducción"),
  P("Este documento evalúa la usabilidad del Caso de Uso 2 (Compra completa en el canal digital) con las métricas externas del estándar ISO/IEC 9126-2, sección 8.3 «Métricas de usabilidad» (ISO/IEC, 2003a; material de clase «7. Métricas externas de usabilidad», Sierra González, 2026). A diferencia de las métricas internas de funcionalidad (Cancimance Pabón & Serrano Rojas, 2026d), que se miden sobre el código, estas se miden con una persona que usa el sistema en ejecución: comprensibilidad (casos de prueba 1 a 7) y facilidad de aprendizaje (casos 8 a 12). Los casos coinciden, en el mismo orden, con los requisitos UT-01 a UT-12 del diseño (design/04-requisitos-usabilidad.md)."),
  P("Se aplican los doce casos asignados, con tres tareas por caso. Cada sesión se registra con video de la pantalla, medición de la interacción (tiempo, clics, errores y ayudas, con Camtasia o una herramienta similar) y el audio del participante pensando en voz alta (Think Aloud). Por simplicidad, en este primer sprint participa **un solo usuario**, como indicó el docente; el estándar recomienda al menos ocho (ISO/IEC, 2003a), de modo que los resultados son indicativos y no concluyentes (sección 4.5)."),
  P("El documento llega **preparado**: trae las tareas redactadas, la ruta ideal de cada una, los tiempos de referencia del equipo medidos sobre el sistema real y las tablas para registrar al participante y comparar su desempeño con el del equipo. Las celdas sombreadas en amarillo se llenan durante y después de las sesiones; ninguna de ellas fue estimada de antemano. Lo acompañan la **guía del participante** (las tareas, listas para imprimir y entregar) y una **hoja de cálculo** que calcula las métricas a partir de los datos registrados."),
  P("Además del material de clase, la sección 9 revisa otras pruebas de usabilidad viables en un proyecto de software (mapas de calor, seguimiento ocular, pruebas remotas y cuestionarios estandarizados, entre otras) y recomienda cuáles aplicar en este sprint."),
  P("**Estado del documento:** preparado el 9 de octubre de 2026. Resultados pendientes de las sesiones con el participante.", { alinear: AlignmentType.LEFT }),
];

const pantallas = tabla(
  [2300, 2700, 4840],
  ["Pantalla", "Ruta", "Tareas que la usan"],
  [
    ["Catálogo", "/ y /?q=", "T01, T04, T05, T19, T20, T21"],
    ["Categoría", "/categoria/[id]", "T08, T14, T20"],
    ["Detalle de producto", "/producto/[id]", "T09, T14, T21"],
    ["Carrito", "/carrito", "T02, T06, T13, T14, T15"],
    ["Datos y envío", "/pedido/confirmar", "T03, T11, T12, T23, T25, T26, T27"],
    ["Pago", "/pago/[pedido]", "T16"],
    ["Pedido confirmado", "/comprobante/[pedido]", "T07, T08, T09, T17, T22"],
    ["Mis pedidos", "/pedidos", "T13, T15, T24"],
    ["Ingresar y crear cuenta", "/ingresar y /registro", "T07, T10, T22"],
    ["Mi cuenta (privacidad)", "/privacidad", "T15"],
  ],
  { primeraNegrita: true },
);

const sistema = [
  H1("2. Sistema bajo prueba y entorno"),
  P("ComproYa en Línea es el canal de comercio electrónico B2C de Tiendas ComproYa; el actor principal es el Cliente digital (Cancimance Pabón & Serrano Rojas, 2026a). Para esta evaluación el flujo es la **venta digital con envío**: el cliente explora el catálogo, agrega productos al carrito, escribe sus datos y su dirección, paga con tarjeta en la pasarela de Stripe (modo de prueba) y ve su pedido confirmado, sin retiro en sucursal. Las diferencias frente al canon están documentadas en el repositorio (Compra-Ya, 2026, docs/modo-venta-digital.md)."),
  H2("2.1 Pantallas evaluadas"),
  pantallas, VACIO(),
  H2("2.2 Datos del entorno de la sesión"),
  P("Se llenan antes de la sesión. Conviene que el entorno sea el mismo en la sesión 1 y en la sesión 2."),
  ficha(
    [
      ["URL del portal que se prueba", "", true], ["Versión desplegada (commit)", "", true], ["Navegador y versión", "", true], ["Sistema operativo", "", true],
      ["Resolución de pantalla", "", true], ["Tipo de conexión", "", true], ["Herramienta de grabación y versión (Camtasia, OBS…)", "", true],
      ["Micrófono usado", "", true], ["Fecha y hora de la sesión 1", "", true], ["Fecha y hora de la sesión 2 (día siguiente)", "", true],
      ["Lugar", "", true], ["Evaluador (modera y lee las tareas)", "", true], ["Observador (registra tiempos, clics, errores y ayudas)", "", true],
    ],
    4300, 5540, { altoFila: 340 },
  ),
  VACIO(),
  H2("2.3 Datos del sistema que usan las tareas"),
  ...VINETAS([
    "**Pasarela de pagos:** Stripe en modo de prueba, sin cobros reales. La pantalla de pago indica al participante qué tarjeta de prueba usar.",
    "**Cupón de lealtad de prueba:** LEALTAD10 (10 % de descuento). Debe existir en la base del portal que se pruebe.",
    "**Productos que se piden:** Licuadora de Vaso 1.5L 700W ($ 184.900), Televisor LED 55'' 4K UHD Smart TV ($ 1.899.900), Lavadora Carga Frontal 18kg Inverter ($ 2.459.900) y Refrigerador French Door 508L Acero Inoxidable ($ 3.299.900). Los precios son los de la base local; verifíquense en el portal desplegado.",
    "**Cuenta del participante:** se crea durante la primera compra (T07) con los datos ficticios de la hoja «Datos de prueba» (anexo F).",
  ]),
];

const participante = [
  H1("3. Participante"),
  P("Se evalúa un solo usuario (P01), representativo del Cliente digital: una persona adulta que ha comprado en línea alguna vez y **no conoce el sistema** (precondición del caso 1). No debe haber participado en el diseño ni en el desarrollo. Los datos se llenan en la sesión, con su consentimiento (anexo A); el documento solo lo identifica como P01."),
  ficha(
    [
      ["Código del participante", "P01", false], ["Edad", "", true], ["Ocupación", "", true], ["Nivel de estudios", "", true],
      ["Frecuencia de compras en línea (nunca, mensual, semanal…)", "", true], ["Tiendas en línea que ha usado", "", true],
      ["Dispositivo y navegador que usa habitualmente", "", true], ["¿Conocía antes ComproYa o este sistema? (debe ser «no»)", "", true],
      ["¿Ha pagado antes con tarjeta en una pasarela web?", "", true], ["Firmó el consentimiento (sí/no)", "", true],
      ["Autoriza grabar pantalla, voz y (opcional) rostro (sí/no)", "", true], ["Observaciones sobre el perfil", "", true],
    ],
    4600, 5240, { altoFila: 340 },
  ),
];

const parametros = tabla(
  [3300, 1500, 5040],
  ["Parámetro", "Valor", "De dónde sale"],
  [
    ["K: tecla (mecanógrafo promedio no secretarial, 40 palabras por minuto)", `${KLM.K} s`, "Card et al. (1980)"],
    ["P: apuntar con el mouse a un objetivo", `${KLM.P} s`, "Card et al. (1980)"],
    ["BB: pulsar y soltar el botón del mouse", `${KLM.BB} s`, "Card et al. (1980): dos eventos de 0,10 s"],
    ["H: cambiar la mano entre mouse y teclado", `${KLM.H} s`, "Card et al. (1980)"],
    ["M: preparación mental, una por paso de la ruta ideal", `${KLM.M} s`, "Card et al. (1980)"],
    ["Espera del sistema", "medida", "Cronometrada por el script en cada tarea (portal local, pasarela de prueba con el webhook real)"],
    ["Factor del usuario nuevo", `× ${LB.metodo.factorNovato}`, "Supuesto del equipo, editable en la hoja de cálculo"],
    ["Redondeo del tiempo objetivo", `${LB.metodo.redondeoS} s hacia arriba`, "Decisión del equipo"],
    ["Límite para la función básica (caso 8)", "180 s", "Ejemplo del material de clase: «tiempo límite predefinido, p. ej. 3 minutos»"],
    ["Valor predeterminado de errores por tarea (caso 9)", "menos de 3", "Decisión del equipo"],
    ["Ayudas permitidas por tarea (caso 10)", "0 o 1", "Material de clase: «el usuario pide ayuda 0 o 1 vez»"],
    ["Pausa por vacilación", "60 s sin avanzar", "Material de clase: umbral de 1 a 3 minutos en operaciones interactivas; se toma el inferior por ser tareas cortas"],
  ],
  { primeraNegrita: false },
);

const definiciones = tabla(
  [1800, 5000, 3040],
  ["Medida", "Definición", "Cómo se registra"],
  [
    ["Tiempo de la tarea", "Segundos entre «puede comenzar» (dicho por el evaluador al terminar de leer la tarea) y la condición de término. Se descuenta el tiempo en que la persona responde preguntas del evaluador.", "Línea de tiempo del video; cronómetro de respaldo del observador."],
    ["Clic", "Cada pulsación del botón del mouse o toque en pantalla, incluidos los clics para enfocar un campo. Las teclas (letras, Enter, Tab) se cuentan aparte.", "Efecto de clic visible del cursor en la grabación; conteo en el video."],
    ["Error de navegación", "Llegar a una pantalla que no es la esperada, retroceder o abrir un menú equivocado.", "Marca N en la hoja de campo."],
    ["Error de selección", "Pulsar un botón o control distinto del necesario (el clic no hace avanzar la tarea).", "Marca S en la hoja de campo."],
    ["Error de datos", "Dato escrito mal o en el campo equivocado, o que el sistema marca como inválido.", "Marca D en la hoja de campo."],
    ["Ayuda", "La persona pide ayuda o el evaluador interviene. Cuenta 1 cada vez.", "Marca A y nivel de ayuda (1 general, 2 de zona, 3 indica el control)."],
    ["Consulta externa", "Leer documentación, preguntar a otra persona o buscar fuera de la pantalla.", "Marca C."],
    ["Completó", "Alcanzó la condición de término sin ayuda.", "Sí o no."],
    ["Abandono", "A los 5 minutos (10 en las compras) sin lograrlo, o cuando la persona lo pide: se marca «no completó» y se sigue.", "Nota en observaciones."],
  ],
  { primeraNegrita: true },
);

const metodo = [
  H1("4. Método"),
  H2("4.1 Diseño de la evaluación"),
  ...VINETAS([
    "**Un participante (P01)** y **doce casos de prueba**, con **tres tareas por caso** (27 tareas: T01 a T27). Las compras T07 a T09 sirven a cuatro casos (3, 5, 9 y 10) porque en cada uno se mide una cosa distinta sobre la misma grabación; las preguntas de los estados del sistema (T16 a T18) y la de «Datos y envío» (T03) se hacen dentro de las compras.",
    "**Dos sesiones.** La sesión 1 (unos 60 minutos, bloques 1 a 8) cubre los casos 1 a 10 y 12. La sesión 2, **al día siguiente** (unos 15 minutos), cubre el caso 11 (retención).",
    "**Sin ayuda.** El evaluador lee cada tarea tal cual, no explica nombres de botones y no corrige (sección 4.6).",
    "**Orden.** Los casos 1 y 2 van primero, con la persona sin tocar nada, porque dependen de la primera impresión; la función básica (caso 8) va antes de cualquier compra para medir el aprendizaje de la primera vez; el cupón (caso 12) va antes de los errores (caso 4) para no revelar que existe el campo de cupón.",
  ]),
  H2("4.2 Instrumentos y registro"),
  ...VINETAS([
    "**Video de la interacción.** Grabación de la pantalla completa con el audio del micrófono; la cámara web es opcional. Una grabación por bloque o por tarea, con el nombre que fija el anexo D.",
    "**Medición de la interacción.** Tiempos tomados de la línea de tiempo del video (Camtasia o similar); clics contados con un efecto de clic visible en el cursor; errores, ayudas y consultas externas anotados en la hoja de campo (anexo C) y confirmados al revisar el video.",
    "**Think Aloud.** Se le pide a la persona que diga en voz alta lo que piensa, mira y duda (Ericsson & Simon, 1993; Nielsen, 1993). El audio queda en el mismo video; de la transcripción solo se guardan las citas relevantes, con su minuto de video.",
    "**Registro.** Las tablas del capítulo 6 recogen los datos por caso; la hoja de cálculo que acompaña a este documento calcula las métricas, la media y el error estándar.",
  ]),
  H2("4.3 Definiciones operacionales"),
  definiciones, VACIO(),
  H2("4.4 Línea base del equipo: tiempo de referencia y tiempo objetivo"),
  P("Para comparar al usuario con «el tiempo del equipo» se midió cada tarea operativa sobre el sistema real, ejecutando su ruta ideal con un script de Playwright (`e2e/usabilidad/medir-linea-base.mjs`) contra el portal local, con la pasarela de Stripe en modo de prueba y el webhook real reenviado por Stripe CLI. El script **cuenta los clics y las teclas** de la ruta ideal (cada campo cuenta como un clic para enfocarlo) y **cronometra la espera del sistema** desde cada acción hasta que aparece el resultado."),
  P("Con esos conteos se calcula el **tiempo de referencia** del equipo (un usuario experto que no se equivoca) con el modelo de nivel de pulsación o KLM (Card et al., 1980): T = K·0,28 s + clics·(1,10 s + 0,20 s) + H·0,40 s + M·1,35 s + espera medida del sistema. El **tiempo objetivo** es lo que el equipo sugiere como tiempo razonable para una persona que usa el sistema por primera vez: el de referencia multiplicado por un factor (3 por defecto, un supuesto del equipo) y redondeado hacia arriba a múltiplos de 5 s. Ambos son editables en la hoja de cálculo; si el equipo prefiere usar sus propios tiempos cronometrados en el portal desplegado, basta con reemplazarlos allí."),
  parametros, VACIO(),
  P("**Limitaciones.** El KLM describe a un experto sin errores, por eso el tiempo objetivo incluye un margen. La espera del sistema se midió en el entorno local; en el portal desplegado puede ser mayor (red, servidor y pasarela). No se estima el tiempo de lectura de los textos, que en una persona nueva puede ser importante. Todos los números de la línea base salen de la ejecución del script, no de una estimación manual."),
  H2("4.5 Estadísticos: media y error estándar"),
  P("El material de clase pide reportar el valor medio y el error estándar de la media. Con un solo usuario no hay variación entre usuarios; por eso la media y el error estándar de cada métrica se calculan **sobre las tres tareas del caso (n = 3)**: media = Σx / 3; desviación estándar muestral s = √(Σ(x − media)² / 2); error estándar = s / √3. Esto describe la variación entre tareas de una misma persona y **no permite generalizar** a otros usuarios; con ocho o más participantes se calcularía sobre usuarios, como recomienda el estándar."),
  H2("4.6 Reglas del evaluador"),
  ...VINETAS([
    "Leer cada tarea **tal cual** está escrita, sin explicar nombres de botones ni dar pistas.",
    "Si la persona se atasca, esperar. Si pregunta, responder «¿qué intentarías ahora?». Intervenir solo tras 60 s sin avanzar o si lo pide, y **registrar una ayuda** con su nivel: 1 pista general, 2 pista de zona, 3 indicar el control.",
    "No elogiar ni corregir («bien», «mal»). Sondeos permitidos: «¿qué esperabas que pasara?», «¿qué estás buscando?», «¿qué piensas de lo que ves?».",
    "Los estados de espera se observan sin interrumpir; la pregunta se hace al terminar el estado. Si el estado dura menos de 2 s, usar la red lenta del anexo E.",
    "Al terminar cada tarea, preguntar la facilidad (SEQ, 1 a 7) y, al final, aplicar el SUS (sección 8). Son complementos y no reemplazan los doce casos.",
  ]),
  H2("4.7 Consideraciones éticas"),
  P("La participación es voluntaria y la persona puede parar en cualquier momento. Firma un consentimiento (anexo A) que explica qué se graba y para qué. Todos los datos que escribe son ficticios y la pasarela está en modo de prueba: no se usa ninguna tarjeta real ni se hace ningún cobro. Los videos se usan solo para el curso, se guardan con el código P01 y no se publican."),
];

const plan = [
  H1("5. Catálogo de tareas y plan de la sesión"),
  H2("5.1 Casos, tareas y qué se mide"),
  tabla(
    [600, 3000, 800, 1500, 2100, 1840],
    ["Caso", "Nombre", "UT", "Tareas", "Se mide", "Grupo"],
    CASOS.map((c) => [String(c.n), c.nombre, c.ut, c.tareas.join(", "), c.mide.map((m) => ({ tiempo: "tiempo", clics: "clics", exito: "éxito", errores: "errores", ayudas: "ayudas" }[m])).join(", "), c.grupo]),
    { centrar: [0, 2], cebra: true },
  ),
  P("Las tareas T07, T08 y T09 se registran **una sola vez** (en el caso 3) y alimentan los casos 3, 5, 9 y 10. Las tareas T03 y T16 a T18 son preguntas que el evaluador hace durante las compras; no se repiten pasos.", { antes: 120 }),
  H2("5.2 Orden recomendado y duración"),
  tabla(
    [700, 3000, 1900, 800, 3440],
    ["Bloque", "Contenido", "Tareas", "Min", "Nota"],
    BLOQUES.map((b) => [String(b.n), b.nombre, b.tareas.join(", "), String(b.min), b.nota || "—"]),
    { centrar: [0, 3], cebra: true },
  ),
  P(`Duración total estimada de la sesión 1: ${BLOQUES.filter((b) => b.n < 9).reduce((a, b) => a + b.min, 0)} minutos, más ${BLOQUES.find((b) => b.n === 9).min} de la sesión 2 (suma de los minutos de la tabla; el tiempo real lo confirma el primer ensayo).`, { antes: 120 }),
];

// ---------------------------------------------------------------- 6 (horizontal): resultados por caso
const A_H = ANCHO_H;
const celdasRuta = (id) => {
  const b = base(id);
  if (!b || !b.pasos) return ["No aplica: se responde de palabra."];
  return [...b.pasos.map((p, i) => `${i + 1}. ${p}`), `**Clics ideales: ${b.clics} · Teclas: ${b.teclas}**`];
};

function tablaDescripcion(ids) {
  return tabla(
    [900, 3500, 2700, 2200, 4540],
    ["Tarea", "Qué se le dice al participante", "Estado inicial", "Condición de término", "Ruta ideal (medida en el sistema real)"],
    ids.map((id) => {
      const t = tarea(id);
      return [{ t: [`**${id}**`, t.titulo], fondo: COLOR.azulClaro }, `«${t.enunciado}»`, t.estado, t.termina, celdasRuta(id)];
    }),
  );
}

function tablaOperativa(ids) {
  return tabla(
    [900, 900, 900, 1000, 900, 900, 1000, 900, 900, 1000, 4540],
    ["Tarea", "T ref (s)", "T obj (s)", "T usuario (s)", "Δ T (usuario − ref)", "Clics ideales", "Clics usuario", "Errores", "Ayudas", "¿Completó?", "Observaciones (consultas externas, vacilaciones…)"],
    ids.map((id) => {
      const b = base(id);
      return [{ t: `**${id}**`, fondo: COLOR.azulClaro }, coma(b.referenciaExpertoS), String(b.objetivoNovatoS), "", "", String(b.clics), "", "", "", "", ""];
    }),
    { llenar: [3, 4, 6, 7, 8, 9, 10], centrar: [1, 2, 3, 4, 5, 6, 7, 8, 9], altoFila: 520 },
  );
}

function tablaRespuestas(ids) {
  return tabla(
    [900, 3400, 4200, 3340, 900, 1100],
    ["Tarea", "Lo que se le pregunta o pide", "Respuesta textual del participante (Think Aloud)", "Rúbrica de acierto", "¿Acertó? (1/0)", "Minuto del video"],
    ids.map((id) => {
      const t = tarea(id);
      return [{ t: [`**${id}**`, t.titulo], fondo: COLOR.azulClaro }, `«${t.enunciado}»`, "", t.rubrica, "", ""];
    }),
    { llenar: [2, 4, 5], centrar: [4, 5], altoFila: 900 },
  );
}

function tablaInventario(id) {
  const filas = INVENTARIOS[id].map(([elemento, esperado], i) => [String(i + 1), elemento, esperado, "", "", ""]);
  return tabla(
    [400, 4600, 4000, 1200, 1100, 2540],
    ["N.º", `Elemento de la interfaz (${id}: ${tarea(id).titulo})`, "Significado esperado (rúbrica)", "¿Comprendió sin ayuda? (1/0)", "¿Vio el globo de ayuda?", "Lo que dijo el participante"],
    filas,
    { llenar: [3, 4, 5], centrar: [0, 3, 4], altoFila: 380 },
  );
}

function tablaCalculo(filas) {
  return tabla(
    [3700, 1500, 3700, 1800, 2100, 1040],
    ["Variable o medida", "Valor", "Cálculo", "Resultado", "Criterio", "¿Cumple?"],
    filas.map(([a, b, c, d, e, f]) => [a, b ?? "", c, d ?? "", e, f ?? ""]),
    { llenar: [1, 3, 5], centrar: [1, 3, 5] },
  );
}

const tablaThinkAloud = () =>
  tabla([1600, 6200, 6040], ["Minuto del video", "Cita textual del participante (Think Aloud)", "Interpretación o hallazgo"], [["", "", ""], ["", "", ""], ["", "", ""]], { llenar: [0, 1, 2], altoFila: 460 });

const objetivoMedio = (ids) => coma(ids.reduce((a, id) => a + base(id).objetivoNovatoS, 0) / ids.length);
const referenciaMedia = (ids) => coma(ids.reduce((a, id) => a + base(id).referenciaExpertoS, 0) / ids.length);

function calculoCaso(c) {
  const ids = c.tareas;
  const ob = (id) => `T obj ${base(id)?.objetivoNovatoS ?? ""} s`;
  switch (c.n) {
    case 1: case 4: case 7:
      return [["A: " + (c.n === 1 ? "pantallas cuyo propósito describió correctamente" : c.n === 4 ? "errores en los que interpretó el mensaje y propuso la acción correcta" : "estados del sistema descritos correctamente"), "", "Suma de «¿Acertó?» de " + ids.join(", "), "", "—", ""],
        ["B: " + (c.n === 1 ? "pantallas evaluadas" : c.n === 4 ? "errores provocados" : "estados observados"), "3", "Fijo", "3", "—", "—"],
        ["X = A / B", "", "A ÷ 3", "", c.n === 1 ? "X ≥ 0,80" : "X ≥ 0,80", ""]];
    case 2:
      return [["A: controles comprendidos sin ayuda", "", "Suma de la columna «¿Comprendió?» de T04, T05 y T06", "", "—", ""],
        ["B: controles del inventario", "26", "T04: 10 + T05: 8 + T06: 8", "26", "—", "—"],
        ["X = A / B", "", "A ÷ 26", "", "X ≥ 0,80 (21 o más)", ""],
        ["Controles comprendidos solo gracias al globo de ayuda", "", "Cuenta de «¿Vio el globo de ayuda?» = 1", "", "Informativo", "—"]];
    case 3:
      return [["A: compras completadas sin ayuda", "", "Cuenta de «¿Completó?» = sí en T07, T08, T09", "", "—", ""],
        ["X = A / B", "", "A ÷ 3", "", "X = 1,00", ""],
        ["T media del usuario (s)", "", "(T07 + T08 + T09) ÷ 3", "", `T obj medio ${objetivoMedio(ids)} s`, ""],
        ["Error estándar del tiempo (s)", "", "s ÷ √3", "", "Informativo", "—"]];
    case 5:
      return [["A: compras completadas sin consultas externas", "", "Cuenta de transacciones sin marca C en T07, T08, T09", "", "—", ""],
        ["X = A / B", "", "A ÷ 3", "", "X = 1,00", ""],
        ["D: consultas externas", "", "Suma de marcas C en T07, T08 y T09", "", "D = 0", ""]];
    case 6:
      return [["A: rutas recorridas y vuelta al inicio sin error", "", "Cuenta de «¿Completó?» = sí en T13, T14, T15", "", "—", ""],
        ["X = A / B", "", "A ÷ 3", "", "X = 1,00", ""],
        ["Clics usuario ÷ clics ideales", "", `Suma de clics usuario ÷ ${ids.reduce((a, id) => a + base(id).clics, 0)}`, "", "Informativo (≤ 1,5)", ""]];
    case 8:
      return ids.map((id) => [`T${id.slice(1)} (s): ${tarea(id).titulo}`, "", "Del video", "", `≤ 180 s y ≤ ${base(id).objetivoNovatoS} s`, ""]).concat([["Media y error estándar del tiempo (s)", "", "media; s ÷ √3", "", "Informativo", "—"]]);
    case 9:
      return ids.map((id) => [`E en ${id} (errores de navegación + selección + datos)`, "", "Marcas N + S + D", "", "E < 3", ""]).concat([["Media y error estándar de E", "", "media; s ÷ √3", "", "Informativo", "—"]]);
    case 10:
      return ids.map((id) => [`H en ${id} (ayudas)`, "", "Marcas A", "", "H ≤ 1", ""]).concat([["Media y error estándar de H", "", "media; s ÷ √3", "", "Informativo", "—"]]);
    case 11:
      return [["A: tareas del día 2 sin reaprendizaje ni ayuda", "", "Cuenta de «¿Completó?» = sí en T22, T23, T24", "", "—", ""],
        ["X = A / B", "", "A ÷ 3", "", "X = 1,00", ""],
        ...ids.filter(esOperativa).map((id) => [`R = T usuario ÷ T obj en ${id}`, "", `T usuario ÷ ${base(id).objetivoNovatoS}`, "", "Informativo (≤ 1)", ""])];
    case 12:
      return ids.flatMap((id) => [[`T en ${id} (s)`, "", "Del video", "", `≤ ${base(id).objetivoNovatoS} s`, ""], [`E y H en ${id}`, "", "Marcas N+S+D y A", "", "E < 3 y H ≤ 1", ""]]);
    default:
      return [];
  }
}

function seccionCaso(c) {
  const ids = c.tareas;
  const op = ids.every(esOperativa);
  const comp = ids.every((id) => !esOperativa(id));
  const cab = [
    H2(`6.${c.n} Caso de prueba ${c.n}: ${c.nombre} (${c.ut})`),
    ficha(
      [
        ["Objetivo", c.objetivo], ["Procedimiento del material de clase", c.procedimiento], ["Métrica ISO/IEC 9126-2", c.metricaIso],
        ["Fórmula", `${c.formula}. ${c.variables}`], ["Resultado esperado (material de clase)", c.esperado], ["Criterio del equipo", c.criterio],
        ...(c.comparte ? [["Nota", c.comparte]] : []),
      ],
      3300, A_H - 3300, { tam: 18 },
    ),
    VACIO(80),
    H3("Tareas"),
    tablaDescripcion(ids),
    VACIO(80),
  ];
  const registro = [];
  if (c.n === 2) {
    registro.push(H3("Registro: inventario de controles"));
    for (const id of ids) registro.push(tablaInventario(id), VACIO(80));
  } else if (c.n === 7) {
    const dur = (clave) => {
      const v = ["T07", "T08", "T09", "T22"].map((k) => base(k)?.estadosSistemaMs?.[clave]).filter((x) => x != null);
      return v.length ? `${coma(Math.min(...v) / 1000, 2)} a ${coma(Math.max(...v) / 1000, 2)} s` : "sin dato";
    };
    registro.push(
      P(`**Duración medida de cada estado en el entorno local** (varias ejecuciones de la línea base): «Reservando tus unidades» ${dur("reservando tus unidades (Continuar al pago)")}; «Abriendo la pasarela segura» ${dur("abriendo la pasarela segura (Pagar con tarjeta)")}; «Estamos confirmando tu pago» ${dur("confirmando tu pago (después de la pasarela)")}. Son estados muy breves: si la persona no alcanza a verlos, repetir con la red lenta del anexo E o preguntar justo al terminar el estado, y anotarlo en observaciones.`, { tam: 19, alinear: AlignmentType.LEFT }),
      H3("Registro de respuestas"),
      tablaRespuestas(ids), VACIO(80),
    );
  } else if (comp) {
    registro.push(H3("Registro de respuestas"), tablaRespuestas(ids), VACIO(80));
  } else if (op) {
    if (c.n === 3) {
      registro.push(H3("Registro y comparación con el equipo"), tablaOperativa(ids),
        P("T ref = tiempo de referencia del equipo (experto, medido). T obj = tiempo objetivo sugerido para un usuario nuevo. Δ T = T usuario − T ref. Errores = marcas N + S + D. Ayudas = marcas A. Esta tabla alimenta también los casos 5, 9 y 10.", { tam: 17, cursiva: true, alinear: AlignmentType.LEFT }), VACIO(80));
    } else if (c.n === 5 || c.n === 9 || c.n === 10) {
      registro.push(H3("Registro"), P("Los datos de T07, T08 y T09 se toman de la tabla de registro del caso 3 (sección 6.3); aquí solo se calcula la métrica de este caso.", { tam: 19, alinear: AlignmentType.LEFT }));
    } else {
      registro.push(H3("Registro y comparación con el equipo"), tablaOperativa(ids), VACIO(80));
    }
  }
  const calculo = [H3("Cálculo de la métrica"), tablaCalculo(calculoCaso(c)), VACIO(80), H3("Think Aloud: citas y hallazgos"), tablaThinkAloud(), VACIO(120)];
  return [...cab, ...registro, ...calculo];
}

const resultados = [H1("6. Resultados por caso de prueba"), P("Cada caso trae: su definición del material de clase, las tareas con su ruta ideal medida, la tabla donde se registra al participante y se compara con el equipo, el cálculo de la métrica y un espacio para las citas del Think Aloud. Las celdas amarillas se llenan en la sesión.", { alinear: AlignmentType.LEFT }), ...CASOS.flatMap(seccionCaso)];

// ---------------------------------------------------------------- 7 (horizontal): resumen, estadística y comparación
const resumen = [
  H1("7. Resumen de las doce métricas y comparación equipo–usuario"),
  H2("7.1 Resumen de las doce métricas"),
  tabla(
    [700, 3500, 2600, 1500, 2400, 900, 2240],
    ["Caso", "Nombre", "Métrica ISO", "Valor obtenido", "Criterio", "¿Cumple?", "Hallazgo principal"],
    CASOS.map((c) => [String(c.n), c.nombre, c.metricaIso, "", c.criterio, "", ""]),
    { llenar: [3, 5, 6], centrar: [0, 5], altoFila: 520 },
  ),
  P("Al terminar, cuente cuántos casos cumplen: ____ de 12. La hoja de cálculo lo calcula en la pestaña «Metricas».", { antes: 120, alinear: AlignmentType.LEFT }),
  H2("7.2 Media y error estándar por métrica (n = 3 tareas por caso)"),
  tabla(
    [4200, 1500, 1500, 1500, 1500, 1800, 1840],
    ["Medida", "Tarea 1", "Tarea 2", "Tarea 3", "Media", "Desviación s", "Error estándar s/√3"],
    [
      ["Tiempo (s), caso 3: T07, T08, T09", "", "", "", "", "", ""],
      ["Tiempo (s), caso 6: T13, T14, T15", "", "", "", "", "", ""],
      ["Tiempo (s), caso 8: T19, T20, T21", "", "", "", "", "", ""],
      ["Tiempo (s), caso 11: T22, T23, T24", "", "", "", "", "", ""],
      ["Tiempo (s), caso 12: T25, T26, T27", "", "", "", "", "", ""],
      ["Errores, caso 9: T07, T08, T09", "", "", "", "", "", ""],
      ["Ayudas, caso 10: T07, T08, T09", "", "", "", "", "", ""],
      ["Clics del usuario, caso 3: T07, T08, T09", "", "", "", "", "", ""],
    ],
    { llenar: [1, 2, 3, 4, 5, 6], centrar: [1, 2, 3, 4, 5, 6], altoFila: 360 },
  ),
  H2("7.3 Comparación del participante con el equipo (tareas operativas)"),
  P("Razón = T usuario ÷ T ref. Eficiencia de clics = clics ideales ÷ clics del usuario (1,00 es la ruta ideal). Cumple el tiempo si T usuario ≤ T obj.", { tam: 19, alinear: AlignmentType.LEFT }),
  tabla(
    [1000, 3600, 1100, 1100, 1200, 1100, 1100, 1200, 1100, 1340],
    ["Tarea", "Descripción", "T ref (s)", "T obj (s)", "T usuario (s)", "Razón", "Clics ideales", "Clics usuario", "Eficiencia de clics", "¿Cumple el tiempo?"],
    TAREAS.filter((t) => t.tipo === "operacion").map((t) => [{ t: `**${t.id}**`, fondo: COLOR.azulClaro }, t.titulo, coma(base(t.id).referenciaExpertoS), String(base(t.id).objetivoNovatoS), "", "", String(base(t.id).clics), "", "", ""]),
    { llenar: [4, 5, 7, 8, 9], centrar: [0, 2, 3, 4, 5, 6, 7, 8, 9], altoFila: 320, tam: 17 },
  ),
];

// ---------------------------------------------------------------- 8: cuestionarios
const cuestionarios = [
  H1("8. Cuestionarios de satisfacción (complementarios)"),
  P("Los dos cuestionarios son opcionales y **no reemplazan los doce casos**; se incluyen porque son baratos, estandarizados y aportan la percepción de la persona. Con un solo participante son indicativos.", { alinear: AlignmentType.LEFT }),
  H2("8.1 SEQ: facilidad percibida por tarea"),
  P(`${SEQ} Se pregunta al terminar cada tarea de las compras y de las funciones básica y avanzada.`, { alinear: AlignmentType.LEFT }),
  tabla(
    [2200, 2200, 2200, 2200, 4640],
    ["Tarea", "SEQ (1 a 7)", "Tarea", "SEQ (1 a 7)", "Comentario"],
    [["T07", "", "T19", "", ""], ["T08", "", "T20", "", ""], ["T09", "", "T21", "", ""], ["T25", "", "T26", "", ""], ["T27", "", "T22", "", ""], ["T23", "", "T24", "", ""]],
    { llenar: [1, 3, 4], centrar: [0, 1, 2, 3], altoFila: 330 },
  ),
  H2("8.2 SUS: escala de usabilidad del sistema"),
  P("Escala de 1 (totalmente en desacuerdo) a 5 (totalmente de acuerdo) (Brooke, 1996). Puntuación: en los ítems impares se resta 1 a la respuesta; en los pares, se resta la respuesta de 5; se suma todo y se multiplica por 2,5 para obtener un valor de 0 a 100.", { alinear: AlignmentType.LEFT }),
  tabla(
    [600, 8400, 1200, 1200, 2440],
    ["N.º", "Afirmación", "Respuesta (1 a 5)", "Puntos", "Cálculo"],
    SUS.map((s, i) => [String(i + 1), s, "", "", i % 2 === 0 ? "respuesta − 1" : "5 − respuesta"]),
    { llenar: [2, 3], centrar: [0, 2, 3], altoFila: 330 },
  ),
  P("Puntuación SUS = (suma de puntos) × 2,5 = ________", { antes: 120, negrita: true, alinear: AlignmentType.LEFT }),
];

// ---------------------------------------------------------------- 9: otras pruebas
const adicionales = [
  H1("9. Otras pruebas de usabilidad viables en pruebas de software"),
  P("El material de clase se apoya en usuarios que realizan tareas y en la observación de su comportamiento. En un proyecto de software hay más técnicas, algunas sin participantes y otras con herramientas que registran hacia dónde mira o hace clic la persona. La tabla resume las que revisamos y si valen la pena en este sprint con un solo participante. Los datos de Microsoft Clarity y de WebGazer.js se tomaron de sus páginas oficiales (consultadas en octubre de 2026); los de las demás herramientas, de búsquedas y reseñas de terceros. Los planes y precios cambian, por lo que se debe confirmar la oferta vigente en el sitio de cada proveedor antes de usarlas.", { alinear: AlignmentType.LEFT }),
  tabla(
    [2100, 2800, 1700, 3800, 3440],
    ["Técnica o herramienta", "Qué aporta", "¿Viable en este sprint?", "Herramientas y condiciones", "Limitaciones"],
    [
      ["Video de pantalla y voz con Think Aloud", "Por qué la persona duda, qué piensa y qué no entiende; es la base de los 12 casos.", "**Sí, obligatoria.** Con 1 usuario sirve.", "Camtasia (con un efecto de clic visible en el cursor para contar clics), OBS Studio, grabación de Teams o Zoom.", "Pensar en voz alta puede alargar los tiempos; se hace igual en todas las tareas para que la comparación sea justa."],
      ["Mapas de calor y grabaciones de sesión (clics y desplazamiento)", "Dónde hace clic, hasta dónde baja la página, clics repetidos o que no responden; el recorrido se puede reproducir como video.", "**Sí, recomendada y opcional.** Se instala con un fragmento de código.", "Microsoft Clarity: según su sitio oficial es gratuito, sin límites de tráfico, e incluye grabaciones de sesión y mapas de calor de clics y desplazamiento (Microsoft, s. f.). Hotjar (ahora parte de Contentsquare) ofrece un plan gratuito con límites; verificar el plan vigente.", "Pide crear un proyecto y agregar el script al sitio; no ve la página de Stripe (otro dominio); hay que avisarlo en el consentimiento. Con una sola persona el «mapa de calor» es solo su recorrido."],
      ["Seguimiento ocular con cámara web", "Hacia dónde mira la persona: zonas vistas e ignoradas y orden de lectura.", "**Exploratoria.** Sin hardware, pero con calibración y buena luz.", "WebGazer.js: código abierto (GPLv3) de Brown University y Pomona College; estima la mirada con la cámara y aprende de los clics (Papoutsaki et al., 2016). Su página oficial avisa que desde el 24 de febrero de 2026 las actualizaciones ya no están garantizadas (Brown WebGazer Team, 2026). Servicios en línea como RealEye o GazeRecorder.", "Menos preciso que un equipo dedicado: estudios independientes encuentran estimaciones más ruidosas (Kandel & Snedeker, 2024), sensibles a la luz y a la calibración; poco fiable para leer texto largo."],
      ["Seguimiento ocular con equipo dedicado", "Fijaciones y movimientos oculares con alta precisión.", "**No para este sprint.** Solo si la universidad tiene un rastreador y un laboratorio.", "Rastreadores de pantalla (por ejemplo, de la marca Tobii).", "Costo, instalación y calibración; con un solo participante no hay mapa agregado."],
      ["Mapas de atención predictivos con IA", "Dónde se espera que se fije la mirada en un diseño, sin participantes, a partir de capturas.", "**Sí, como filtro previo.** Se pueden subir las capturas de design/verificacion-rediseno/pantallas/.", "Attention Insight, Neurons, RealEye Attention Predictor. Sus proveedores declaran 90 a 96 % de coincidencia con rastreo real.", "La evidencia independiente es mixta: un piloto académico con interfaces reportó ROC-AUC de 0,75 a 0,84 (University of Novi Sad, 2024). Úsese como apoyo, no como sustituto de usuarios."],
      ["Pruebas de cinco segundos y de primer clic", "Primera impresión de una pantalla y a dónde hace clic primero la persona para cumplir una tarea.", "**Sí, a futuro.** Sirve para los casos 1 y 6 con más participantes remotos.", "Lyssna (cinco segundos, primer clic, árbol, preferencias), Optimal Workshop (árbol, clasificación y primer clic), Maze (primer clic limitado). Los planes gratuitos tienen topes que conviene verificar.", "Exigen reclutar participantes y miden capturas, no el flujo completo."],
      ["Prueba de árbol y clasificación de tarjetas", "Si la jerarquía del menú (Catálogo, Carrito, Mis pedidos, Mi cuenta) coincide con lo que la persona espera.", "**Media.** Más útil si se rediseña el menú.", "Optimal Workshop, Lyssna.", "Evalúa la organización de la información, no la interfaz visual."],
      ["Cuestionarios estandarizados (SUS y SEQ)", "Satisfacción percibida (SUS, 0 a 100) y dificultad percibida por tarea (SEQ, 1 a 7).", "**Sí.** Dos minutos y papel.", "Formularios de la sección 8 y la hoja de cálculo (Brooke, 1996).", "Un solo respondente no permite comparar con valores de referencia."],
      ["Modelo de nivel de pulsación (KLM)", "Predice el tiempo de un experto sin usuarios, contando acciones.", "**Ya aplicada** en la línea base.", "Card et al. (1980); script de Playwright del repositorio.", "Supone usuario experto y sin errores."],
      ["Evaluación heurística", "Problemas que detecta un experto sin usuarios, puntuados por severidad.", "**Sí.** Dos integrantes recorren las pantallas con las diez heurísticas de Nielsen.", "Lista de heurísticas y hoja de severidad de 0 a 4 (Nielsen, 1993).", "No reemplaza a personas reales; el equipo ya tiene una auditoría de interfaz previa (design/05-auditoria-ui.md)."],
      ["Auditorías automáticas de accesibilidad y recorrido con teclado", "Contraste, nombres accesibles, foco visible y operación sin mouse.", "**Ya aplicada** (sección 10).", "axe-core (reglas WCAG 2.1 A y AA) y un recorrido solo con teclado con Playwright.", "Detecta solo parte de los problemas de accesibilidad; se completa con prueba manual."],
    ],
    { tam: 16, tamCab: 16, noPartir: true },
  ),
  H2("9.1 Recomendación para este sprint"),
  ...NUMEROS(
    [
      "**Obligatorio:** video de pantalla y voz con Think Aloud, mediciones de tiempo, clics, errores y ayudas, y la comparación con la línea base (secciones 4 a 7).",
      "**Complemento barato:** SEQ por tarea y SUS al final (sección 8).",
      "**Evidencia visual de clics:** Microsoft Clarity activado durante la sesión (unos 20 minutos de preparación): da grabaciones y mapas de clics que respaldan lo contado en el video. Es opcional y requiere agregar un fragmento de código al sitio; no está implementado en el proyecto.",
      "**Apoyo al diseño sin usuarios:** mapas de atención predictivos sobre las capturas ya generadas y una evaluación heurística de dos integrantes, para los casos 1 y 2.",
      "**Trabajo futuro:** al menos ocho participantes, pruebas de cinco segundos y de primer clic en línea para los casos 1 y 6, y seguimiento ocular con cámara web en un entorno de luz controlada.",
    ],
    "lista0",
  ),
];

// ---------------------------------------------------------------- 10 a 12 (vertical) y anexos
function verificaciones() {
  const filas = [];
  if (REDISENO) {
    const total = REDISENO.length;
    const ok = REDISENO.filter((f) => f.vistas["1440"]?.ok && f.vistas["390"]?.ok).length;
    filas.push(["Capturas por pantalla y estado a 1440 y 390 px", `${ok} de ${total} estados sin observaciones (${total * 2} capturas): sin desplazamiento horizontal, sin vocabulario prohibido, sin controles sin nombre accesible ni imágenes sin texto alternativo.`, "design/verificacion-rediseno/tabla-verificacion.md"]);
  }
  if (TECLADO) {
    const resumenT = TECLADO.map((r) => `${r.ancho} px: ${r.paradas} paradas de Tab, ${r.hallazgos?.length ?? 0} hallazgos, ${r.pasos.filter((p) => p.ok).length} de ${r.pasos.length} pasos correctos`).join("; ");
    filas.push(["Recorrido solo con teclado hasta la pasarela de pagos", resumenT + ". Foco visible, nombre accesible y objetivos de 44 px en cada parada.", "design/verificacion-rediseno/teclado.md"]);
  }
  if (AXE) {
    const nodos = AXE.reduce((a, f) => a + Object.values(f.vistas).reduce((b, v) => b + (v.axe?.length ?? 0), 0), 0);
    filas.push(["Auditoría automática de accesibilidad (axe-core, WCAG 2.1 A y AA, incluye contraste 4,5:1)", `${AXE.length} estados a dos anchos: ${nodos === 0 ? "0 violaciones" : nodos + " violaciones"}.`, "design/verificacion-rediseno/axe.json"]);
  }
  filas.push(["Movimiento reducido (prefers-reduced-motion)", "Con la preferencia activada el carrusel de categorías queda quieto; sin ella se mueve.", "e2e/capturas/verificar-movimiento.mjs"]);
  return filas;
}

const previas = [
  H1("10. Verificaciones previas del equipo sobre el sistema"),
  P("Antes de la sesión, el equipo revisó la interfaz con pruebas automáticas. **No sustituyen la prueba con el usuario**, pero reducen el riesgo de que un fallo técnico contamine los resultados de usabilidad.", { alinear: AlignmentType.LEFT }),
  tabla([3000, 4640, 2200], ["Verificación", "Resultado", "Dónde está la evidencia"], verificaciones(), { primeraNegrita: true }),
];

const hallazgos = [
  H1("11. Hallazgos y recomendaciones"),
  P("Se llena después de revisar el video. Severidad de 0 (no es un problema) a 4 (catastrófico), según la escala de Nielsen (1993).", { alinear: AlignmentType.LEFT }),
  tabla(
    [500, 3300, 2000, 1000, 3040],
    ["N.º", "Hallazgo", "Evidencia (caso, tarea y minuto del video)", "Severidad 0–4", "Recomendación"],
    Array.from({ length: 8 }, (_, i) => [String(i + 1), "", "", "", ""]),
    { llenar: [1, 2, 3, 4], centrar: [0, 3], altoFila: 520 },
  ),
];

const conclusiones = [
  H1("12. Conclusiones"),
  P("Se escribe al terminar. Sugerencia de estructura, un párrafo por punto:", { alinear: AlignmentType.LEFT }),
  ...VINETAS([
    "Cuántos de los 12 casos de prueba cumplen su criterio y cuáles no, con el valor obtenido.",
    "Comparación del participante con la línea base del equipo: en qué tareas tardó más de lo esperado y por qué (según el Think Aloud).",
    "Los tres problemas de usabilidad más graves, con su evidencia y la mejora propuesta.",
    "Limitaciones: un solo usuario (el estándar recomienda ocho), entorno de la sesión, herramientas usadas.",
    "Qué otras pruebas de la sección 9 se recomiendan para el siguiente sprint.",
  ]),
  tabla([9840], ["Conclusiones del equipo"], [[""]], { llenar: [0], altoFila: 3600 }),
];

const referencias = [
  H1("Referencias"),
  ...[
    ...REFERENCIAS,
    "Kandel, M., & Snedeker, J. (2024). Assessing two methods of webcam-based eye tracking for child language research. Journal of Child Language. Cambridge University Press. https://www.cambridge.org/core/services/aop-cambridge-core/content/view/F28BD05F1D529D3ADE04F2E28A5EE4CB/S0305000924000175a.pdf/assessing-two-methods-of-webcam-based-eye-tracking-for-child-language-research.pdf",
    "Microsoft. (s. f.). Microsoft Clarity [Sitio web]. https://clarity.microsoft.com/",
    "University of Novi Sad. (2024). [Piloto que compara predicción de atención con IA y seguimiento ocular en diseño UI/UX] [Memoria de simposio]. https://www.grid.uns.ac.rs/symposium/download/2024/47.pdf",
    "Brown WebGazer Team. (2026). WebGazer.js [Sitio web]. Brown University. https://webgazer.cs.brown.edu/",
  ]
    .sort((a, b) => a.localeCompare(b, "es"))
    .map((r) => new Paragraph({ children: runs(r, { size: 20 }), spacing: { after: 100 }, indent: { left: 540, hanging: 540 }, alignment: AlignmentType.LEFT })),
];

const anexos = [
  SALTO(),
  H1("Anexo A. Consentimiento informado"),
  P("**Evaluación de usabilidad del canal digital ComproYa en Línea.** Universidad Central, Ingeniería de Software II."),
  P("Se me invita a participar en una prueba de usabilidad de una tienda en línea de práctica, desarrollada por estudiantes. Entiendo que: (1) se evalúa el sistema y no mi desempeño; (2) haré varias tareas de compra con datos ficticios, y la pasarela de pagos está en modo de prueba, por lo que no se usa ninguna tarjeta real ni se hace ningún cobro; (3) se grabará la pantalla y mi voz mientras pienso en voz alta, y, si lo autorizo, mi rostro; (4) las grabaciones se usarán solo para el curso, se identificarán con un código (P01) y no se publicarán; (5) puedo detener la prueba en cualquier momento sin consecuencias."),
  ficha(
    [["Acepto participar (sí/no)", "", true], ["Autorizo grabar pantalla y voz (sí/no)", "", true], ["Autorizo grabar mi rostro con la cámara (sí/no)", "", true], ["Nombre del participante", "", true], ["Firma", "", true], ["Fecha", "", true], ["Evaluador", "", true]],
    4300, 5540, { altoFila: 420 },
  ),
  H1("Anexo B. Guion del evaluador"),
  H3("Bienvenida"),
  P("«Gracias por venir. Estamos evaluando el sistema, no a ti: si algo te resulta confuso, es una oportunidad para mejorarlo. Voy a grabar tu pantalla y tu voz solo para el curso. Puedes parar cuando quieras. No te voy a poder ayudar durante las tareas porque necesitamos ver cómo lo usarías tú solo(a).»", { alinear: AlignmentType.LEFT }),
  H3("Pensar en voz alta"),
  P("«Mientras usas el sistema, di en voz alta todo lo que piensas: qué buscas, qué entiendes, qué te confunde, aunque parezca obvio. Si te quedas callado(a), te preguntaré: ¿qué estás pensando? Practiquemos: describe en voz alta cómo abrirías la página de tu correo.»", { alinear: AlignmentType.LEFT }),
  H3("Cómo se da cada tarea"),
  ...NUMEROS(["Entregar la tarjeta de la tarea y, además, leerla en voz alta.", "Confirmar que la persona la entendió («¿me la repites con tus palabras?») sin explicar cómo se hace.", "Decir «puedes comenzar» y arrancar el cronómetro.", "Detener el cronómetro en la condición de término; pausarlo mientras la persona responde preguntas.", "Preguntar el SEQ (1 a 7) y pasar a la siguiente tarea."], "lista1"),
  H3("Frases permitidas y prohibidas"),
  ...VINETAS(["**Permitidas:** «¿qué esperabas que pasara?», «¿qué estás buscando?», «¿qué piensas de lo que ves?», «¿qué harías ahora?».", "**Prohibidas:** «pulsa…», «es el botón de arriba», «casi», «bien», «mal», y cualquier nombre de un control que la persona aún no haya nombrado."]),
  H3("Cierre"),
  P("Preguntar: «¿qué fue lo más fácil?», «¿qué fue lo más difícil?», «¿qué cambiarías?». Aplicar el SUS (sección 8.2). Agradecer. Para la sesión 2, recordar solo la hora y que traiga la hoja «Datos de prueba».", { alinear: AlignmentType.LEFT }),
  H1("Anexo C. Hoja de campo (se llena durante la sesión)"),
  P("Una fila por tarea. Errores: N = navegación, S = selección, D = datos. Ayudas: nivel 1, 2 o 3. Consultas externas: C.", { tam: 19, alinear: AlignmentType.LEFT }),
  tabla(
    [800, 1050, 1050, 1000, 1500, 1400, 800, 2240],
    ["Tarea", "Inicio (mm:ss del video)", "Fin (mm:ss)", "Clics (marcas)", "Errores N / S / D", "Ayudas (nivel)", "C", "Notas"],
    TAREAS.map((t) => [{ t: `**${t.id}**`, fondo: COLOR.azulClaro }, "", "", "", "", "", "", ""]),
    { llenar: [1, 2, 3, 4, 5, 6, 7], centrar: [0], altoFila: 330, tam: 17 },
  ),
  H1("Anexo D. Protocolo de grabación y nombres de archivo"),
  ...VINETAS([
    "**Antes de grabar:** probar el micrófono diciendo una frase y escuchándola; cerrar notificaciones; abrir el navegador en ventana nueva sin extensiones ni sesión previa; poner el zoom del navegador al 100 %.",
    "**Camtasia:** grabar la pantalla completa con audio del micrófono; activar un efecto de clic visible en el cursor (en Camtasia están en los efectos de cursor, para el clic izquierdo) para que cada clic quede marcado y se pueda contar en el video. Alternativa: OBS Studio con un complemento de resaltado de clics.",
    "**Una grabación por bloque** (o por tarea, si se prefiere) y un nombre que no deje dudas: `CU2_P01_S1_B4_T07.mp4` (sesión 1, bloque 4, tarea 7) y `CU2_P01_S2_B9_T22.mp4` (sesión 2).",
    "**Tiempos:** anotar en la hoja de campo el minuto del video donde empieza y termina cada tarea; el tiempo es la diferencia, sin las pausas de preguntas.",
    "**Después:** guardar los videos y la hoja de campo en una carpeta con el código P01, hacer una copia de respaldo y registrar las rutas en el documento.",
  ]),
  H1("Anexo E. Cómo hacer más lento un estado del sistema"),
  P("Los estados «Reservando tus unidades», «Abriendo la pasarela segura» y «Estamos confirmando tu pago» duran menos de un segundo en una red rápida y la persona puede no verlos. Para observarlos (caso 7):", { alinear: AlignmentType.LEFT }),
  ...NUMEROS(["Abrir las herramientas del desarrollador del navegador (F12) y la pestaña «Red» (Network).", "En la lista de limitación de red (Throttling, que por defecto dice «Sin limitación») elegir un preajuste lento, como «3G lenta» o el más lento disponible.", "Hacer la tarea con la limitación activa y, al terminar el estado, volver a «Sin limitación».", "Anotar en observaciones que se usó la red lenta, para interpretar los tiempos de esa tarea."], "lista2"),
  H1("Anexo F. Datos de prueba que recibe el participante"),
  tabla([3800, 6040], ["Dato", "Valor"], DATOS_PRUEBA.map(([a, b]) => [a, b]), { primeraNegrita: true }),
  P("Si el documento, el correo o la cuenta ya se usaron en otra prueba, cambiar los últimos números o la parte «p01». El portal rechaza un correo o un documento repetido.", { antes: 100, tam: 19, alinear: AlignmentType.LEFT }),
  H1("Anexo G. Lista de verificación previa y reinicio"),
  H3("Antes de la sesión 1"),
  ...VINETAS([
    "Backend y frontend desplegados juntos y el catálogo del portal con fotos, nombres en español y precios en pesos (procedimiento en design/plan-ejecucion-bd-desplegada.md). Si no, la sesión se hace en el entorno local.",
    "Cupón LEALTAD10 existente en la base del portal que se prueba.",
    "Pago de prueba funcionando: una compra de ensayo llega a «Pedido confirmado» (el webhook de Stripe debe estar configurado).",
    "Productos de las tareas disponibles: licuadora, televisor, lavadora y refrigerador.",
    "Grabadora y micrófono probados; hoja de campo, hojas de tareas y «Datos de prueba» impresas; cronómetro de respaldo.",
    "Un ensayo completo del equipo (sin el participante) para confirmar el orden y la duración.",
  ]),
  H3("Entre bloques"),
  ...VINETAS(["Vaciar el carrito con «Quitar» (después de los bloques 2 y 3).", "Dejar el estado inicial que pide cada tarea (columna «Estado inicial»)."]),
  H3("Al terminar la sesión 2"),
  ...VINETAS(["Cancelar desde «Mis pedidos» los pedidos que quedaron sin pagar, para liberar las unidades reservadas.", "Guardar los videos, la hoja de campo y la hoja de cálculo con el código P01.", "Si se usó Clarity, exportar las grabaciones y desactivar el seguimiento."]),
];

// ---------------------------------------------------------------- Documento
const margenesV = VERTICAL.margin;
const sinPie = new Footer({ children: [new Paragraph({ children: [] })] });
const doc = new Document({
  creator: EQUIPO.integrantes.join(" y "),
  title: `${EQUIPO.titulo} — ComproYa en Línea`,
  description: "Evaluación de usabilidad (ISO/IEC 9126-2, 8.3) del Caso de Uso 2: plantilla preparada con línea base de tiempos y clics",
  styles: ESTILOS,
  numbering: { config: NUMERACIONES },
  features: { updateFields: true },
  sections: [
    {
      properties: { titlePage: true, page: { size: { width: 12240, height: 15840 }, margin: margenesV } },
      footers: { default: pie("Evaluación de Usabilidad: Caso de Uso 2"), first: sinPie },
      children: [...portada, ...intro, ...sistema, SALTO(), ...participante, ...metodo, SALTO(), ...plan],
    },
    {
      properties: { type: SectionType.NEXT_PAGE, page: { size: { width: 12240, height: 15840, orientation: PageOrientation.LANDSCAPE }, margin: { top: 1100, bottom: 1000, left: 1000, right: 1000 } } },
      footers: { default: pie("Evaluación de Usabilidad: Caso de Uso 2") },
      children: [...resultados, SALTO(), ...resumen, SALTO(), ...cuestionarios, SALTO(), ...adicionales],
    },
    {
      properties: { type: SectionType.NEXT_PAGE, page: { size: { width: 12240, height: 15840 }, margin: margenesV } },
      footers: { default: pie("Evaluación de Usabilidad: Caso de Uso 2") },
      children: [...previas, ...hallazgos, ...conclusiones, SALTO(), ...referencias, ...anexos],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
const destino = path.join(SALIDA, "Evaluacion_Usabilidad_CU2_ComproYa.docx");
writeFileSync(destino, buffer);
console.log(`Escrito ${path.relative(RAIZ, destino)} (${(buffer.length / 1024).toFixed(0)} KB)`);
