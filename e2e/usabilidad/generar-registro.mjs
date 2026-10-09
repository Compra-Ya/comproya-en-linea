// Genera docs/usabilidad/Registro_Medicion_CU2_ComproYa.xlsx: hoja de cálculo para registrar la sesión y obtener las métricas.
// Las celdas amarillas se llenan; todo lo demás se calcula. Tiempos de referencia y clics ideales salen de linea-base.json.
import ExcelJS from "exceljs";
import { readFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { CASOS, INVENTARIOS, SUS, TAREAS } from "./tareas.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SALIDA = path.resolve(AQUI, "../../docs/usabilidad");
mkdirSync(SALIDA, { recursive: true });
const LB = JSON.parse(readFileSync(path.join(AQUI, "linea-base.json"), "utf8"));
const base = (id) => LB.tareas[id];

const AZUL = "FF163D6D", AMARILLO = "FFFFF6D6", GRIS = "FFEDEDED", AZUL_CLARO = "FFE8EEF6";
const wb = new ExcelJS.Workbook();
wb.creator = "Equipo ComproYa";
wb.title = "Registro de medición de usabilidad CU-2";
wb.calcProperties.fullCalcOnLoad = true;

const borde = { top: { style: "thin", color: { argb: "FFBFC7D1" } }, bottom: { style: "thin", color: { argb: "FFBFC7D1" } }, left: { style: "thin", color: { argb: "FFBFC7D1" } }, right: { style: "thin", color: { argb: "FFBFC7D1" } } };
function encabezado(fila) {
  fila.eachCell((c) => {
    c.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Calibri", size: 10 };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL } };
    c.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    c.border = borde;
  });
  fila.height = 44;
}
const entrada = (c) => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AMARILLO } }; c.border = borde; };
const calculada = (c) => { c.border = borde; c.alignment = { vertical: "top", horizontal: "center", wrapText: true }; };
const gris = (c) => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GRIS } }; c.border = borde; };
function titulo(hoja, texto, sub) {
  hoja.getCell("A1").value = texto;
  hoja.getCell("A1").font = { bold: true, size: 14, color: { argb: AZUL }, name: "Calibri" };
  if (sub) { hoja.getCell("A2").value = sub; hoja.getCell("A2").font = { italic: true, size: 10, color: { argb: "FF555555" }, name: "Calibri" }; }
}
function colorSiNo(hoja, rango) {
  hoja.addConditionalFormatting({ ref: rango, rules: [
    { type: "cellIs", operator: "equal", formulae: ['"Sí"'], style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFD5F0DD" } }, font: { color: { argb: "FF1E6B3A" }, bold: true } } },
    { type: "cellIs", operator: "equal", formulae: ['"No"'], style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFFBD9D3" } }, font: { color: { argb: "FF9B2C1C" }, bold: true } } },
  ] });
}

// ------------------------------------------------------------ Instrucciones
const ins = wb.addWorksheet("Instrucciones", { views: [{ showGridLines: false }] });
ins.columns = [{ width: 4 }, { width: 120 }];
titulo(ins, "Registro de medición: Evaluación de Usabilidad, Caso de Uso 2", "ISO/IEC 9126-2, sección 8.3 · casos de prueba 1 a 12 · un participante (P01) · ComproYa en Línea");
const lineas = [
  ["Cómo se usa", true],
  ["1. Las celdas amarillas son las que se llenan. Todo lo demás se calcula solo: no escribas sobre las celdas blancas ni grises.", false],
  ["2. Pestaña «Participante»: llena el perfil. Pestaña «Parametros»: puedes cambiar el factor del usuario nuevo y los límites; los tiempos objetivo se recalculan.", false],
  ["3. Pestaña «Tareas»: una fila por tarea (T01 a T27). Durante la sesión anota tiempo (segundos), clics, errores (N navegación, S selección, D datos), ayudas, consultas externas, si completó o acertó, y el SEQ (1 a 7).", false],
  ["4. Pestaña «Iconos»: para el caso 2, marca 1 si el participante comprendió el control sin ayuda y 0 si no.", false],
  ["5. Pestaña «Metricas»: aquí aparecen la métrica de cada caso, si cumple el criterio, y la media y el error estándar (n = 3 tareas por caso).", false],
  ["6. Pestaña «Resumen»: casos que cumplen, comparación equipo–usuario y puntaje SUS (llena las respuestas en «SUS_SEQ»).", false],
  ["", false],
  ["De dónde salen los números de referencia", true],
  [`Clics ideales y tiempos de referencia salen de linea-base.json, generado el ${LB.generado.slice(0, 10)} por e2e/usabilidad/medir-linea-base.mjs sobre el sistema real: clics y teclas contados en la ruta ideal y espera del sistema cronometrada. El tiempo de referencia usa el modelo de nivel de pulsación (Card, Moran y Newell, 1980): T = K·0,28 + clics·1,30 + H·0,40 + M·1,35 + espera medida. El tiempo objetivo = referencia × factor del usuario nuevo, redondeado hacia arriba.`, false],
  ["Puedes reemplazar los tiempos de referencia (columna G de «Tareas») por tus propios tiempos cronometrados en el portal desplegado: el tiempo objetivo se recalcula.", false],
  ["", false],
  ["Límites de este registro", true],
  ["Con un solo usuario, la media y el error estándar describen la variación entre las tres tareas de cada caso, no entre personas. El estándar recomienda ocho usuarios o más.", false],
  ["Los casos 5, 9 y 10 usan las mismas compras que el caso 3 (T07, T08 y T09); se registran una sola vez.", false],
];
lineas.forEach(([t, h], i) => {
  const c = ins.getCell(`B${4 + i}`);
  c.value = t;
  c.alignment = { wrapText: true, vertical: "top" };
  c.font = { name: "Calibri", size: h ? 12 : 10.5, bold: h, color: { argb: h ? AZUL : "FF222222" } };
});

// ------------------------------------------------------------ Parámetros
const par = wb.addWorksheet("Parametros");
par.columns = [{ width: 62 }, { width: 14 }, { width: 70 }];
titulo(par, "Parámetros (se pueden editar)");
const filasPar = [
  ["Factor del usuario nuevo (tiempo objetivo = referencia × factor)", LB.metodo.factorNovato, "Supuesto del equipo"],
  ["Redondeo del tiempo objetivo (segundos, hacia arriba)", LB.metodo.redondeoS, "Decisión del equipo"],
  ["Límite de tiempo de la función básica, caso 8 (segundos)", 180, "Ejemplo del material de clase: 3 minutos"],
  ["Errores por tarea: el valor debe ser menor que", 3, "Valor predeterminado por el equipo, caso 9 y caso 12"],
  ["Ayudas por tarea: máximo permitido", 1, "Material de clase: 0 o 1 vez, casos 10 y 12"],
  ["Umbral de comprensión (proporción mínima)", 0.8, "Casos 1, 2, 4 y 7 (80 %)"],
];
filasPar.forEach(([a, b, c], i) => {
  const r = 3 + i;
  par.getCell(`A${r}`).value = a; par.getCell(`B${r}`).value = b; par.getCell(`C${r}`).value = c;
  par.getCell(`A${r}`).border = borde; par.getCell(`C${r}`).border = borde; par.getCell(`C${r}`).font = { italic: true, color: { argb: "FF555555" } };
  entrada(par.getCell(`B${r}`)); par.getCell(`B${r}`).alignment = { horizontal: "center" };
});
par.getCell("B8").numFmt = "0%";
par.getCell("A11").value = "Constantes del modelo KLM (informativas; ya están incluidas en el tiempo de referencia)";
par.getCell("A11").font = { bold: true, color: { argb: AZUL } };
[["K: tecla (s)", LB.metodo.klm.K], ["P: apuntar con el mouse (s)", LB.metodo.klm.P], ["BB: pulsar y soltar el botón (s)", LB.metodo.klm.BB], ["H: cambiar entre mouse y teclado (s)", LB.metodo.klm.H], ["M: preparación mental, una por paso (s)", LB.metodo.klm.M]].forEach(([a, b], i) => {
  par.getCell(`A${12 + i}`).value = a; par.getCell(`B${12 + i}`).value = b; par.getCell(`A${12 + i}`).border = borde; par.getCell(`B${12 + i}`).border = borde; par.getCell(`B${12 + i}`).alignment = { horizontal: "center" };
});

// ------------------------------------------------------------ Participante
const pa = wb.addWorksheet("Participante");
pa.columns = [{ width: 62 }, { width: 60 }];
titulo(pa, "Participante P01");
["Código del participante", "Edad", "Ocupación", "Nivel de estudios", "Frecuencia de compras en línea", "Tiendas en línea que ha usado", "Dispositivo y navegador habituales", "¿Conocía antes ComproYa? (debe ser no)", "¿Ha pagado antes con tarjeta en una pasarela web?", "Firmó el consentimiento (sí/no)", "Autoriza grabar pantalla, voz y rostro (sí/no)", "Fecha y hora de la sesión 1", "Fecha y hora de la sesión 2", "Evaluador", "Observador", "Navegador y versión del portal probado", "URL del portal probado"].forEach((a, i) => {
  const r = 3 + i;
  pa.getCell(`A${r}`).value = a; pa.getCell(`A${r}`).border = borde; pa.getCell(`A${r}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL_CLARO } }; pa.getCell(`A${r}`).font = { bold: true };
  if (i === 0) { pa.getCell(`B${r}`).value = "P01"; pa.getCell(`B${r}`).border = borde; } else entrada(pa.getCell(`B${r}`));
});

// ------------------------------------------------------------ Tareas
const ta = wb.addWorksheet("Tareas", { views: [{ state: "frozen", xSplit: 3, ySplit: 4 }] });
const COLS = [
  ["ID", 6], ["Caso", 6], ["Tarea", 30], ["Qué se le dice al participante", 56], ["Tipo", 12], ["Clics ideales", 9], ["T ref (s)\nequipo", 9], ["T obj (s)\nsugerido", 9],
  ["T usuario (s)", 10], ["Δ (s)\nusuario − ref", 10], ["Razón\nT usuario / T ref", 10], ["¿Cumple el tiempo?\n(T ≤ T obj)", 11], ["Clics usuario", 9], ["Eficiencia de clics\n(ideales / usuario)", 11],
  ["Errores N\n(navegación)", 10], ["Errores S\n(selección)", 10], ["Errores D\n(datos)", 10], ["Errores total", 9], ["Ayudas", 8], ["Consultas externas", 10], ["¿Completó o acertó?", 11], ["SEQ\n(1 a 7)", 8], ["Observaciones y Think Aloud", 44], ["T usuario / T obj", 10],
];
ta.columns = COLS.map(([, w]) => ({ width: w }));
titulo(ta, "Registro de tareas y comparación equipo–usuario", "Amarillo = se llena. Las tareas de comprensión (T01 a T06, T10 a T12, T16 a T18) no llevan tiempo ni clics; se responden de palabra.");
ta.getRow(4).values = COLS.map(([n]) => n);
encabezado(ta.getRow(4));
const FILA0 = 5;
const fila = (k) => FILA0 + k - 1; // T01 -> 5
const L = { id: "A", ref: "G", obj: "H", user: "I", delta: "J", razon: "K", cumple: "L", clics: "M", efic: "N", eN: "O", eS: "P", eD: "Q", err: "R", ayu: "S", ext: "T", ok: "U", seq: "V", rv: "X", ideal: "F" };
TAREAS.forEach((t, i) => {
  const r = FILA0 + i;
  const b = base(t.id);
  const op = t.tipo === "operacion";
  ta.getCell(`A${r}`).value = t.id; ta.getCell(`B${r}`).value = t.caso; ta.getCell(`C${r}`).value = t.titulo; ta.getCell(`D${r}`).value = t.enunciado;
  ta.getCell(`E${r}`).value = op ? "Operativa" : "Comprensión";
  for (const c of ["A", "B", "C", "D", "E"]) { const x = ta.getCell(`${c}${r}`); x.border = borde; x.alignment = { vertical: "top", wrapText: true, horizontal: c === "D" || c === "C" ? "left" : "center" }; x.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL_CLARO } }; }
  if (op && b && !b.error) {
    ta.getCell(`F${r}`).value = b.clics; ta.getCell(`G${r}`).value = b.referenciaExpertoS;
    ta.getCell(`H${r}`).value = { formula: `IF(G${r}="","",ROUNDUP(G${r}*Parametros!$B$3/Parametros!$B$4,0)*Parametros!$B$4)` };
    ta.getCell(`J${r}`).value = { formula: `IF(OR(I${r}="",G${r}=""),"",I${r}-G${r})` };
    ta.getCell(`K${r}`).value = { formula: `IF(OR(I${r}="",G${r}="",G${r}=0),"",I${r}/G${r})` };
    ta.getCell(`L${r}`).value = { formula: `IF(OR(I${r}="",H${r}=""),"",IF(I${r}<=H${r},"Sí","No"))` };
    ta.getCell(`N${r}`).value = { formula: `IF(OR(M${r}="",M${r}=0,F${r}=""),"",F${r}/M${r})` };
    ta.getCell(`X${r}`).value = { formula: `IF(OR(I${r}="",H${r}="",H${r}=0),"",I${r}/H${r})` };
    for (const c of ["F", "G", "H", "J", "K", "L", "N", "X"]) calculada(ta.getCell(`${c}${r}`));
    for (const c of ["I", "M"]) entrada(ta.getCell(`${c}${r}`));
    ta.getCell(`G${r}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
    ta.getCell(`K${r}`).numFmt = "0.00"; ta.getCell(`N${r}`).numFmt = "0.00"; ta.getCell(`X${r}`).numFmt = "0.00"; ta.getCell(`G${r}`).numFmt = "0.0"; ta.getCell(`J${r}`).numFmt = "0.0";
  } else {
    for (const c of ["F", "G", "H", "I", "J", "K", "L", "M", "N", "X"]) gris(ta.getCell(`${c}${r}`));
  }
  ta.getCell(`R${r}`).value = { formula: `IF(COUNT(O${r}:Q${r})=0,"",SUM(O${r}:Q${r}))` };
  calculada(ta.getCell(`R${r}`));
  for (const c of ["O", "P", "Q", "S", "T", "V", "W"]) entrada(ta.getCell(`${c}${r}`));
  entrada(ta.getCell(`U${r}`));
  ta.getCell(`W${r}`).alignment = { wrapText: true, vertical: "top" };
  ta.getRow(r).height = op ? 54 : 62;
});
const ultima = FILA0 + TAREAS.length - 1; // 31
// Validaciones
for (let r = FILA0; r <= ultima; r++) {
  ta.getCell(`U${r}`).dataValidation = { type: "list", allowBlank: true, formulae: ['"Sí,No"'] };
  ta.getCell(`V${r}`).dataValidation = { type: "whole", operator: "between", allowBlank: true, formulae: [1, 7], showErrorMessage: true, errorTitle: "SEQ", error: "Escribe un número entero de 1 a 7." };
  for (const c of ["I", "M", "O", "P", "Q", "S", "T"]) ta.getCell(`${c}${r}`).dataValidation = { type: "decimal", operator: "greaterThanOrEqual", allowBlank: true, formulae: [0], showErrorMessage: true, errorTitle: "Dato", error: "Escribe un número mayor o igual a 0." };
  ta.getCell(`U${r}`).alignment = { horizontal: "center", vertical: "top" };
}
colorSiNo(ta, `L${FILA0}:L${ultima}`); colorSiNo(ta, `U${FILA0}:U${ultima}`);
// T04 a T06: el resultado se toma de la hoja Iconos
const bloquesIconos = { T04: [5, 14], T05: [15, 22], T06: [23, 30] };
for (const [id, [a, b]] of Object.entries(bloquesIconos)) {
  const r = fila(Number(id.slice(1)));
  ta.getCell(`U${r}`).value = { formula: `IF(COUNT(Iconos!E${a}:E${b})=0,"",SUM(Iconos!E${a}:E${b})&" de "&ROWS(Iconos!E${a}:E${b}))` };
  ta.getCell(`U${r}`).dataValidation = undefined; ta.getCell(`U${r}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: GRIS } };
}

// ------------------------------------------------------------ Iconos (caso 2)
const ic = wb.addWorksheet("Iconos", { views: [{ state: "frozen", ySplit: 4 }] });
ic.columns = [{ width: 8 }, { width: 6 }, { width: 62 }, { width: 52 }, { width: 14 }, { width: 14 }, { width: 44 }];
titulo(ic, "Caso 2: comprensión de íconos y textos", "Marca 1 si la persona describió el control correctamente sin ayuda, 0 si no. «Globo de ayuda» = el texto que aparece al pasar el mouse.");
ic.getRow(4).values = ["Tarea", "N.º", "Elemento de la interfaz", "Significado esperado (rúbrica)", "¿Comprendió sin ayuda? (1/0)", "¿Vio el globo de ayuda? (1/0)", "Lo que dijo el participante"];
encabezado(ic.getRow(4));
let rI = 5;
for (const id of ["T04", "T05", "T06"]) {
  INVENTARIOS[id].forEach(([elem, esperado], i) => {
    ic.getCell(`A${rI}`).value = id; ic.getCell(`B${rI}`).value = i + 1; ic.getCell(`C${rI}`).value = elem; ic.getCell(`D${rI}`).value = esperado;
    for (const c of ["A", "B", "C", "D"]) { const x = ic.getCell(`${c}${rI}`); x.border = borde; x.alignment = { wrapText: true, vertical: "top", horizontal: c === "A" || c === "B" ? "center" : "left" }; }
    for (const c of ["E", "F", "G"]) entrada(ic.getCell(`${c}${rI}`));
    for (const c of ["E", "F"]) { ic.getCell(`${c}${rI}`).dataValidation = { type: "list", allowBlank: true, formulae: ['"0,1"'] }; ic.getCell(`${c}${rI}`).alignment = { horizontal: "center" }; }
    ic.getRow(rI).height = 32;
    rI++;
  });
}
ic.getCell(`C${rI + 1}`).value = "A: controles comprendidos sin ayuda"; ic.getCell(`E${rI + 1}`).value = { formula: `SUM(E5:E${rI - 1})` };
ic.getCell(`C${rI + 2}`).value = "B: controles del inventario"; ic.getCell(`E${rI + 2}`).value = { formula: `ROWS(E5:E${rI - 1})` };
ic.getCell(`C${rI + 3}`).value = "X = A / B (criterio: ≥ 0,80)"; ic.getCell(`E${rI + 3}`).value = { formula: `IF(COUNT(E5:E${rI - 1})<ROWS(E5:E${rI - 1}),"",E${rI + 1}/E${rI + 2})` }; ic.getCell(`E${rI + 3}`).numFmt = "0%";
for (let k = 1; k <= 3; k++) { ic.getCell(`C${rI + k}`).font = { bold: true }; ic.getCell(`E${rI + k}`).font = { bold: true }; ic.getCell(`E${rI + k}`).alignment = { horizontal: "center" }; }

// ------------------------------------------------------------ Métricas por caso
const me = wb.addWorksheet("Metricas", { views: [{ state: "frozen", ySplit: 4, xSplit: 2 }] });
me.columns = [{ width: 6 }, { width: 44 }, { width: 34 }, { width: 38 }, { width: 9 }, { width: 9 }, { width: 11 }, { width: 11 }, { width: 11 }, { width: 13 }, { width: 46 }];
titulo(me, "Métrica de cada caso de prueba", "Se calcula sola a partir de «Tareas» e «Iconos». Queda vacía hasta que estén registradas las tres tareas del caso.");
me.getRow(4).values = ["Caso", "Nombre", "Métrica ISO/IEC 9126-2", "Criterio", "A", "B", "Valor", "¿Cumple?", "Media", "Error estándar\n(s / √3)", "Qué es el valor y notas"];
encabezado(me.getRow(4));
const rng = (col, ids) => `Tareas!${col}${fila(Number(ids[0].slice(1)))}:${col}${fila(Number(ids[ids.length - 1].slice(1)))}`;
const FORM = {
  1: (ids) => ({ E: `IF(COUNTA(${rng("U", ids)})<3,"",COUNTIF(${rng("U", ids)},"Sí"))`, H: `IF(G{r}="","",IF(G{r}>=Parametros!$B$8,"Sí","No"))`, nota: "X = A / B: pantallas con el propósito bien descrito." }),
  2: () => ({ E: `Iconos!E${rI + 1}`, F: `Iconos!E${rI + 2}`, G: `Iconos!E${rI + 3}`, H: `IF(G{r}="","",IF(G{r}>=Parametros!$B$8,"Sí","No"))`, nota: "X = A / B: controles comprendidos sin ayuda, de 26." }),
  3: (ids) => ({ E: `IF(COUNTA(${rng("U", ids)})<3,"",COUNTIF(${rng("U", ids)},"Sí"))`, H: `IF(OR(G{r}="",COUNT(${rng("I", ids)})<3),"",IF(AND(G{r}=1,COUNTIF(${rng("L", ids)},"No")=0),"Sí","No"))`, I: `IF(COUNT(${rng("I", ids)})<3,"",AVERAGE(${rng("I", ids)}))`, J: `IF(COUNT(${rng("I", ids)})<3,"",STDEV(${rng("I", ids)})/SQRT(3))`, nota: "X = A / B: compras completadas sin ayuda. Media y error estándar: tiempo en segundos." }),
  4: (ids) => ({ E: `IF(COUNTA(${rng("U", ids)})<3,"",COUNTIF(${rng("U", ids)},"Sí"))`, H: `IF(G{r}="","",IF(G{r}>=Parametros!$B$8,"Sí","No"))`, nota: "X = A / B: mensajes de error entendidos con la acción correcta." }),
  5: (ids) => ({ E: `IF(COUNT(${rng("T", ids)})<3,"",SUMPRODUCT(--(${rng("T", ids)}=0)))`, H: `IF(G{r}="","",IF(AND(G{r}=1,SUM(${rng("T", ids)})=0),"Sí","No"))`, nota: "X = A / B: compras sin consultas externas (T07, T08 y T09). Consultas totales en «Tareas», columna T." }),
  6: (ids) => ({ E: `IF(COUNTA(${rng("U", ids)})<3,"",COUNTIF(${rng("U", ids)},"Sí"))`, H: `IF(G{r}="","",IF(G{r}=1,"Sí","No"))`, nota: "X = A / B: rutas sin error de navegación. Revisar también la eficiencia de clics en «Tareas»." }),
  7: (ids) => ({ E: `IF(COUNTA(${rng("U", ids)})<3,"",COUNTIF(${rng("U", ids)},"Sí"))`, H: `IF(G{r}="","",IF(G{r}>=Parametros!$B$8,"Sí","No"))`, nota: "X = A / B: estados del sistema descritos correctamente." }),
  8: (ids) => ({ E: `IF(COUNT(${rng("I", ids)})<3,"",SUMPRODUCT(--(${rng("I", ids)}<=Parametros!$B$5),--(${rng("I", ids)}<=${rng("H", ids)})))`, H: `IF(G{r}="","",IF(G{r}=1,"Sí","No"))`, I: `IF(COUNT(${rng("I", ids)})<3,"",AVERAGE(${rng("I", ids)}))`, J: `IF(COUNT(${rng("I", ids)})<3,"",STDEV(${rng("I", ids)})/SQRT(3))`, nota: "A = tareas dentro del límite de 180 s y del tiempo objetivo. Media y error estándar: tiempo en segundos." }),
  9: (ids) => ({ E: `IF(COUNT(${rng("R", ids)})<3,"",SUMPRODUCT(--(${rng("R", ids)}<Parametros!$B$6)))`, H: `IF(G{r}="","",IF(G{r}=1,"Sí","No"))`, I: `IF(COUNT(${rng("R", ids)})<3,"",AVERAGE(${rng("R", ids)}))`, J: `IF(COUNT(${rng("R", ids)})<3,"",STDEV(${rng("R", ids)})/SQRT(3))`, nota: "A = compras con menos errores que el valor predeterminado. Media y error estándar: errores por tarea." }),
  10: (ids) => ({ E: `IF(COUNT(${rng("S", ids)})<3,"",SUMPRODUCT(--(${rng("S", ids)}<=Parametros!$B$7)))`, H: `IF(G{r}="","",IF(G{r}=1,"Sí","No"))`, I: `IF(COUNT(${rng("S", ids)})<3,"",AVERAGE(${rng("S", ids)}))`, J: `IF(COUNT(${rng("S", ids)})<3,"",STDEV(${rng("S", ids)})/SQRT(3))`, nota: "A = compras con 0 o 1 ayuda. Media y error estándar: ayudas por tarea." }),
  11: (ids) => ({ E: `IF(COUNTA(${rng("U", ids)})<3,"",COUNTIF(${rng("U", ids)},"Sí"))`, H: `IF(G{r}="","",IF(G{r}=1,"Sí","No"))`, I: `IF(COUNT(${rng("X", ids)})<3,"",AVERAGE(${rng("X", ids)}))`, J: `IF(COUNT(${rng("X", ids)})<3,"",STDEV(${rng("X", ids)})/SQRT(3))`, nota: "X = A / B: tareas del día 2 sin reaprendizaje. Media y error estándar: razón T usuario / T objetivo." }),
  12: (ids) => ({ E: `IF(OR(COUNT(${rng("I", ids)})<3,COUNT(${rng("R", ids)})<3,COUNT(${rng("S", ids)})<3),"",SUMPRODUCT(--(${rng("I", ids)}<=${rng("H", ids)}),--(${rng("R", ids)}<Parametros!$B$6),--(${rng("S", ids)}<=Parametros!$B$7)))`, H: `IF(G{r}="","",IF(G{r}=1,"Sí","No"))`, I: `IF(COUNT(${rng("I", ids)})<3,"",AVERAGE(${rng("I", ids)}))`, J: `IF(COUNT(${rng("I", ids)})<3,"",STDEV(${rng("I", ids)})/SQRT(3))`, nota: "A = tareas dentro del tiempo objetivo, con menos errores que el predeterminado y con 0 o 1 ayuda. Media y error estándar: tiempo en segundos." }),
};
CASOS.forEach((c, i) => {
  const r = 5 + i;
  const f = FORM[c.n](c.tareas);
  me.getCell(`A${r}`).value = c.n; me.getCell(`B${r}`).value = c.nombre; me.getCell(`C${r}`).value = c.metricaIso; me.getCell(`D${r}`).value = c.criterio;
  me.getCell(`E${r}`).value = { formula: f.E };
  me.getCell(`F${r}`).value = f.F ? { formula: f.F } : 3;
  me.getCell(`G${r}`).value = f.G ? { formula: f.G } : { formula: `IF(E${r}="","",E${r}/F${r})` };
  me.getCell(`H${r}`).value = { formula: f.H.replaceAll("{r}", r) };
  if (f.I) { me.getCell(`I${r}`).value = { formula: f.I }; me.getCell(`J${r}`).value = { formula: f.J }; } else { me.getCell(`I${r}`).value = "—"; me.getCell(`J${r}`).value = "—"; }
  me.getCell(`K${r}`).value = f.nota;
  for (const col of "ABCDEFGHIJK") { const x = me.getCell(`${col}${r}`); x.border = borde; x.alignment = { wrapText: true, vertical: "top", horizontal: "ABCD".includes(col) || col === "K" ? "left" : "center" }; }
  me.getCell(`A${r}`).alignment = { horizontal: "center", vertical: "top" };
  me.getCell(`G${r}`).numFmt = c.n === 2 ? "0%" : "0.00"; me.getCell(`I${r}`).numFmt = "0.00"; me.getCell(`J${r}`).numFmt = "0.00";
  me.getRow(r).height = 48;
});
colorSiNo(me, "H5:H16");
// Valor para casos 8, 9, 10, 12: se muestra A/B (proporción de tareas que cumplen)

// ------------------------------------------------------------ SUS y SEQ
const su = wb.addWorksheet("SUS_SEQ");
su.columns = [{ width: 6 }, { width: 80 }, { width: 16 }, { width: 12 }];
titulo(su, "SUS: escala de usabilidad del sistema (Brooke, 1996)", "Respuestas de 1 (totalmente en desacuerdo) a 5 (totalmente de acuerdo). Impares: respuesta − 1. Pares: 5 − respuesta. Total × 2,5.");
su.getRow(4).values = ["N.º", "Afirmación", "Respuesta (1 a 5)", "Puntos"];
encabezado(su.getRow(4));
SUS.forEach((s, i) => {
  const r = 5 + i;
  su.getCell(`A${r}`).value = i + 1; su.getCell(`B${r}`).value = s;
  su.getCell(`D${r}`).value = { formula: `IF(C${r}="","",IF(MOD(A${r},2)=1,C${r}-1,5-C${r}))` };
  entrada(su.getCell(`C${r}`)); su.getCell(`C${r}`).dataValidation = { type: "whole", operator: "between", allowBlank: true, formulae: [1, 5], showErrorMessage: true, errorTitle: "SUS", error: "Escribe un entero de 1 a 5." };
  for (const c of ["A", "B", "D"]) { su.getCell(`${c}${r}`).border = borde; su.getCell(`${c}${r}`).alignment = { wrapText: true, vertical: "top", horizontal: c === "B" ? "left" : "center" }; }
  su.getCell(`C${r}`).alignment = { horizontal: "center" };
});
su.getCell("B16").value = "Puntaje SUS (0 a 100)"; su.getCell("B16").font = { bold: true };
su.getCell("D16").value = { formula: `IF(COUNT(C5:C14)<10,"",SUM(D5:D14)*2.5)` }; su.getCell("D16").font = { bold: true }; su.getCell("D16").alignment = { horizontal: "center" }; su.getCell("D16").numFmt = "0.0";

// ------------------------------------------------------------ Resumen
const re = wb.addWorksheet("Resumen");
re.columns = [{ width: 60 }, { width: 16 }, { width: 58 }];
titulo(re, "Resumen de la evaluación", "Todo se calcula a partir de las otras pestañas.");
const filasRe = [
  ["Casos de prueba que cumplen su criterio", `COUNTIF(Metricas!H5:H16,"Sí")`, "de los evaluados", "0"],
  ["Casos evaluados (con las tres tareas registradas)", `COUNTIF(Metricas!H5:H16,"Sí")+COUNTIF(Metricas!H5:H16,"No")`, "de 12", "0"],
  ["Porcentaje de casos que cumplen", `IF(B4=0,"",B3/B4)`, "casos que cumplen ÷ casos evaluados", "0%"],
  ["Razón media T usuario / T ref (tareas operativas)", `IFERROR(AVERAGE(Tareas!K5:K31),"")`, "1,00 = igual que el experto; el objetivo suele ser 3,00", "0.00"],
  ["Razón media T usuario / T objetivo", `IFERROR(AVERAGE(Tareas!X5:X31),"")`, "≤ 1,00 = dentro del tiempo objetivo", "0.00"],
  ["Eficiencia media de clics (ideales / usuario)", `IFERROR(AVERAGE(Tareas!N5:N31),"")`, "1,00 = ruta ideal", "0.00"],
  ["Errores totales", `IF(COUNT(Tareas!R5:R31)=0,"",SUM(Tareas!R5:R31))`, "navegación + selección + datos, todas las tareas", "0"],
  ["Ayudas totales", `IF(COUNT(Tareas!S5:S31)=0,"",SUM(Tareas!S5:S31))`, "", "0"],
  ["Consultas externas totales", `IF(COUNT(Tareas!T5:T31)=0,"",SUM(Tareas!T5:T31))`, "", "0"],
  ["SEQ medio (1 a 7)", `IFERROR(AVERAGE(Tareas!V5:V31),"")`, "mayor es más fácil", "0.0"],
  ["Puntaje SUS (0 a 100)", `SUS_SEQ!D16`, "con un solo participante es indicativo", "0.0"],
];
re.getRow(2).height = 18;
filasRe.forEach(([a, f, c, fmt], i) => {
  const r = 3 + i;
  re.getCell(`A${r}`).value = a; re.getCell(`B${r}`).value = { formula: f }; re.getCell(`C${r}`).value = c;
  re.getCell(`B${r}`).numFmt = fmt;
  for (const col of "ABC") { const x = re.getCell(`${col}${r}`); x.border = borde; x.alignment = { wrapText: true, vertical: "top", horizontal: col === "B" ? "center" : "left" }; }
  re.getCell(`A${r}`).font = { bold: true }; re.getCell(`C${r}`).font = { italic: true, color: { argb: "FF555555" } };
});

const destino = path.join(SALIDA, "Registro_Medicion_CU2_ComproYa.xlsx");
await wb.xlsx.writeFile(destino);
console.log("Escrito docs/usabilidad/Registro_Medicion_CU2_ComproYa.xlsx");
