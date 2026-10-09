// Genera docs/usabilidad/Registro_Medicion_CU2_ComproYa.xlsx: hoja de cálculo para registrar las sesiones de los cinco
// participantes (una hoja por persona) y obtener las métricas de cada caso, por persona y del grupo (media y error estándar
// entre personas). Las celdas amarillas se llenan; todo lo demás se calcula. Tiempos de referencia y clics ideales salen de
// linea-base.json.
import ExcelJS from "exceljs";
import { readFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { CASOS, PARTICIPANTES, SUS, TAREAS } from "./tareas.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SALIDA = path.resolve(AQUI, "../../docs/usabilidad");
mkdirSync(SALIDA, { recursive: true });
const LB = JSON.parse(readFileSync(path.join(AQUI, "linea-base.json"), "utf8"));
const base = (id) => LB.tareas[id];
const NP = PARTICIPANTES.length;

const AZUL = "FF163D6D", AMARILLO = "FFFFF6D6", GRIS = "FFEDEDED", AZUL_CLARO = "FFE8EEF6";
const wb = new ExcelJS.Workbook();
wb.creator = "Equipo ComproYa";
wb.title = "Registro de medición de usabilidad CU-2";
wb.calcProperties.fullCalcOnLoad = true;

const borde = { top: { style: "thin", color: { argb: "FFBFC7D1" } }, bottom: { style: "thin", color: { argb: "FFBFC7D1" } }, left: { style: "thin", color: { argb: "FFBFC7D1" } }, right: { style: "thin", color: { argb: "FFBFC7D1" } } };
const relleno = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
function encabezado(fila, alto = 44) {
  fila.eachCell((c) => {
    c.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Calibri", size: 10 };
    c.fill = relleno(AZUL);
    c.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    c.border = borde;
  });
  fila.height = alto;
}
const entrada = (c) => { c.fill = relleno(AMARILLO); c.border = borde; };
const calculada = (c) => { c.border = borde; c.alignment = { vertical: "top", horizontal: "center", wrapText: true }; };
const gris = (c) => { c.fill = relleno(GRIS); c.border = borde; };
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
const colLetra = (n) => { let s = ""; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; };
const q = (hoja) => `'${hoja}'`; // los nombres P01… parecen referencias de celda: siempre entre comillas

// ------------------------------------------------------------ Instrucciones
const ins = wb.addWorksheet("Instrucciones", { views: [{ showGridLines: false }] });
ins.columns = [{ width: 4 }, { width: 124 }];
titulo(ins, "Registro de medición: Evaluación de Usabilidad, Caso de Uso 2", `ISO/IEC 9126-2, sección 8.3 · casos de prueba 1 a 12 · ${NP} participantes (${PARTICIPANTES[0]} a ${PARTICIPANTES[NP - 1]}) · ComproYa en Línea`);
const lineas = [
  ["Cómo se usa", true],
  ["1. Las celdas amarillas son las que se llenan. Todo lo demás se calcula solo: no escribas sobre las celdas blancas ni grises.", false],
  ["2. «Parametros»: factor del usuario nuevo y límites; los tiempos objetivo se recalculan. «Participantes»: perfil de cada persona.", false],
  [`3. Una hoja por persona (${PARTICIPANTES.join(", ")}): una fila por tarea (24 tareas; T04 a T06 están retiradas porque el caso 2 no se aplica). Anota tiempo en segundos, clics, errores (N navegación, S selección, D datos), ayudas, consultas externas, si completó o acertó, y el SEQ (1 a 7).`, false],
  ["4. «SUS»: las respuestas de 1 a 5 de cada persona. El caso 2 (íconos y textos) no se aplica en esta evaluación.", false],
  ["5. «Metricas»: el valor de cada caso por persona, si cumple, y del grupo: cuántas personas cumplen, la media y el error estándar entre personas.", false],
  ["6. «Grupo»: por tarea, el tiempo de cada persona con su media y error estándar, la razón con el tiempo del equipo, los clics, los errores y las ayudas; y un resumen general.", false],
  ["", false],
  ["De dónde salen los números de referencia", true],
  [`Clics ideales y tiempos de referencia salen de linea-base.json, generado el ${LB.generado.slice(0, 10)} por e2e/usabilidad/medir-linea-base.mjs sobre el sistema real: clics y teclas contados en la ruta ideal y espera del sistema cronometrada. El tiempo de referencia usa el modelo de nivel de pulsación (Card, Moran y Newell, 1980): T = K·0,28 + clics·1,30 + H·0,40 + M·1,35 + espera medida. El tiempo objetivo = referencia × factor del usuario nuevo, redondeado hacia arriba.`, false],
  ["Puedes reemplazar los tiempos de referencia (columna G de cada hoja de persona) por tus propios tiempos cronometrados en el portal desplegado; el tiempo objetivo se recalcula.", false],
  ["", false],
  ["Cómo se decide si el grupo cumple un caso", true],
  [`Cada persona cumple o no el criterio del caso (pestaña «Metricas»). El grupo cumple el caso si al menos el 80 % de las personas lo cumple (parámetro «Umbral de comprensión» en «Parametros»; es una decisión del equipo). Además se reportan la media y el error estándar del valor del caso entre personas (n = ${NP}).`, false],
  ["Con cinco personas los resultados son indicativos: el estándar recomienda ocho o más.", false],
  ["Los casos 5, 9 y 10 usan las mismas compras que el caso 3 (T07, T08 y T09); se registran una sola vez por persona.", false],
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
[
  ["Factor del usuario nuevo (tiempo objetivo = referencia × factor)", LB.metodo.factorNovato, "Supuesto del equipo"],
  ["Redondeo del tiempo objetivo (segundos, hacia arriba)", LB.metodo.redondeoS, "Decisión del equipo"],
  ["Límite de tiempo de la función básica, caso 8 (segundos)", 180, "Ejemplo del material de clase: 3 minutos"],
  ["Errores por tarea: el valor debe ser menor que", 3, "Valor predeterminado por el equipo, casos 9 y 12"],
  ["Ayudas por tarea: máximo permitido", 1, "Material de clase: 0 o 1 vez, casos 10 y 12"],
  ["Umbral de comprensión y de cumplimiento del grupo", 0.8, "Casos 1, 2, 4 y 7 por persona; y proporción de personas que debe cumplir un caso para que el grupo lo cumpla"],
].forEach(([a, b, c], i) => {
  const r = 3 + i;
  par.getCell(`A${r}`).value = a; par.getCell(`B${r}`).value = b; par.getCell(`C${r}`).value = c;
  par.getCell(`A${r}`).border = borde; par.getCell(`C${r}`).border = borde; par.getCell(`C${r}`).font = { italic: true, color: { argb: "FF555555" } };
  par.getCell(`C${r}`).alignment = { wrapText: true, vertical: "top" };
  entrada(par.getCell(`B${r}`)); par.getCell(`B${r}`).alignment = { horizontal: "center" };
});
par.getCell("B8").numFmt = "0%";
par.getCell("A11").value = "Constantes del modelo KLM (informativas; ya están incluidas en el tiempo de referencia)";
par.getCell("A11").font = { bold: true, color: { argb: AZUL } };
[["K: tecla (s)", LB.metodo.klm.K], ["P: apuntar con el mouse (s)", LB.metodo.klm.P], ["BB: pulsar y soltar el botón (s)", LB.metodo.klm.BB], ["H: cambiar entre mouse y teclado (s)", LB.metodo.klm.H], ["M: preparación mental, una por paso (s)", LB.metodo.klm.M]].forEach(([a, b], i) => {
  par.getCell(`A${12 + i}`).value = a; par.getCell(`B${12 + i}`).value = b; par.getCell(`A${12 + i}`).border = borde; par.getCell(`B${12 + i}`).border = borde; par.getCell(`B${12 + i}`).alignment = { horizontal: "center" };
});

// ------------------------------------------------------------ Participantes
const pa = wb.addWorksheet("Participantes", { views: [{ state: "frozen", xSplit: 1, ySplit: 3 }] });
pa.columns = [{ width: 52 }, ...PARTICIPANTES.map(() => ({ width: 24 }))];
titulo(pa, "Perfil de los participantes");
pa.getRow(3).values = ["Dato", ...PARTICIPANTES];
encabezado(pa.getRow(3), 24);
["Edad", "Ocupación", "Nivel de estudios", "Frecuencia de compras en línea", "Tiendas en línea que ha usado", "Dispositivo y navegador habituales", "¿Conocía antes ComproYa? (debe ser no)", "¿Ha pagado antes con tarjeta en una pasarela web?", "Firmó el consentimiento (sí/no)", "Autoriza grabar pantalla, voz y rostro (sí/no)", "Fecha y hora de la sesión 1", "Fecha y hora de la sesión 2", "Evaluador", "Observador", "Navegador y versión del portal probado", "URL del portal probado"].forEach((campo, i) => {
  const r = 4 + i;
  pa.getCell(`A${r}`).value = campo; pa.getCell(`A${r}`).border = borde; pa.getCell(`A${r}`).fill = relleno(AZUL_CLARO); pa.getCell(`A${r}`).font = { bold: true };
  for (let p = 0; p < NP; p++) entrada(pa.getCell(`${colLetra(2 + p)}${r}`));
});

// ------------------------------------------------------------ Hojas por participante (tareas)
const COLS = [
  ["ID", 6], ["Caso", 6], ["Tarea", 30], ["Qué se le dice al participante", 56], ["Tipo", 12], ["Clics ideales", 9], ["T ref (s)\nequipo", 9], ["T obj (s)\nsugerido", 9],
  ["T usuario (s)", 10], ["Δ (s)\nusuario − ref", 10], ["Razón\nT usuario / T ref", 10], ["¿Cumple el tiempo?\n(T ≤ T obj)", 11], ["Clics usuario", 9], ["Eficiencia de clics\n(ideales / usuario)", 11],
  ["Errores N\n(navegación)", 10], ["Errores S\n(selección)", 10], ["Errores D\n(datos)", 10], ["Errores total", 9], ["Ayudas", 8], ["Consultas externas", 10], ["¿Completó o acertó?", 11], ["SEQ\n(1 a 7)", 8], ["Observaciones y Think Aloud", 44], ["T usuario / T obj", 10],
];
const FILA0 = 5;
const fila = (k) => FILA0 + k - 1; // T01 -> 5
const ultima = FILA0 + TAREAS.length - 1; // 31

for (const [pi, cod] of PARTICIPANTES.entries()) {
  const ta = wb.addWorksheet(cod, { views: [{ state: "frozen", xSplit: 3, ySplit: 4 }] });
  ta.columns = COLS.map(([, w]) => ({ width: w }));
  titulo(ta, `Registro de tareas del participante ${cod}`, "Amarillo = se llena. Las tareas de comprensión (T01 a T06, T10 a T12, T16 a T18) no llevan tiempo ni clics; se responden de palabra.");
  ta.getRow(4).values = COLS.map(([n]) => n);
  encabezado(ta.getRow(4));
  TAREAS.forEach((t) => {
    const r = fila(Number(t.id.slice(1)));
    const b = base(t.id);
    const op = t.tipo === "operacion";
    ta.getCell(`A${r}`).value = t.id; ta.getCell(`B${r}`).value = t.caso; ta.getCell(`C${r}`).value = t.titulo; ta.getCell(`D${r}`).value = t.enunciado;
    ta.getCell(`E${r}`).value = op ? "Operativa" : "Comprensión";
    for (const c of ["A", "B", "C", "D", "E"]) { const x = ta.getCell(`${c}${r}`); x.border = borde; x.alignment = { vertical: "top", wrapText: true, horizontal: c === "D" || c === "C" ? "left" : "center" }; x.fill = relleno(AZUL_CLARO); }
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
      ta.getCell(`G${r}`).fill = relleno("FFFFFFFF");
      for (const c of ["K", "N", "X"]) ta.getCell(`${c}${r}`).numFmt = "0.00";
      ta.getCell(`G${r}`).numFmt = "0.0"; ta.getCell(`J${r}`).numFmt = "0.0";
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
  for (let r = FILA0; r <= ultima; r++) {
    ta.getCell(`U${r}`).dataValidation = { type: "list", allowBlank: true, formulae: ['"Sí,No"'] };
    ta.getCell(`V${r}`).dataValidation = { type: "whole", operator: "between", allowBlank: true, formulae: [1, 7], showErrorMessage: true, errorTitle: "SEQ", error: "Escribe un número entero de 1 a 7." };
    for (const c of ["I", "M", "O", "P", "Q", "S", "T"]) ta.getCell(`${c}${r}`).dataValidation = { type: "decimal", operator: "greaterThanOrEqual", allowBlank: true, formulae: [0], showErrorMessage: true, errorTitle: "Dato", error: "Escribe un número mayor o igual a 0." };
    ta.getCell(`U${r}`).alignment = { horizontal: "center", vertical: "top" };
  }
  colorSiNo(ta, `L${FILA0}:L${ultima}`); colorSiNo(ta, `U${FILA0}:U${ultima}`);
  // T04 a T06: tareas retiradas (el caso 2 no se aplica)
  for (const k of [4, 5, 6]) {
    const r = fila(k);
    ta.getCell(`A${r}`).value = `T0${k}`; ta.getCell(`C${r}`).value = "Retirada: el caso 2 (íconos y textos) no se aplica";
    for (let c = 1; c <= COLS.length; c++) gris(ta.getCell(r, c));
    ta.getRow(r).height = 22;
  }
}

// ------------------------------------------------------------ SUS, una columna por persona
const su = wb.addWorksheet("SUS");
su.columns = [{ width: 6 }, { width: 70 }, ...PARTICIPANTES.map(() => ({ width: 9 })), ...PARTICIPANTES.map(() => ({ width: 9 })), { width: 10 }, { width: 12 }];
titulo(su, "SUS: escala de usabilidad del sistema (Brooke, 1996)", "Respuestas de 1 (totalmente en desacuerdo) a 5 (totalmente de acuerdo). Impares: respuesta − 1. Pares: 5 − respuesta. Total × 2,5.");
su.getRow(4).values = ["N.º", "Afirmación", ...PARTICIPANTES.map((p) => `${p}\nrespuesta`), ...PARTICIPANTES.map((p) => `${p}\npuntos`), "Media", "Error\nestándar"];
encabezado(su.getRow(4), 40);
SUS.forEach((s, i) => {
  const r = 5 + i;
  su.getCell(`A${r}`).value = i + 1; su.getCell(`B${r}`).value = s;
  for (const c of ["A", "B"]) { su.getCell(`${c}${r}`).border = borde; su.getCell(`${c}${r}`).alignment = { wrapText: true, vertical: "top", horizontal: c === "B" ? "left" : "center" }; }
  for (let p = 0; p < NP; p++) {
    const cr = colLetra(3 + p), cp = colLetra(3 + NP + p);
    entrada(su.getCell(`${cr}${r}`)); su.getCell(`${cr}${r}`).alignment = { horizontal: "center" };
    su.getCell(`${cr}${r}`).dataValidation = { type: "whole", operator: "between", allowBlank: true, formulae: [1, 5], showErrorMessage: true, errorTitle: "SUS", error: "Escribe un entero de 1 a 5." };
    su.getCell(`${cp}${r}`).value = { formula: `IF(${cr}${r}="","",IF(MOD($A${r},2)=1,${cr}${r}-1,5-${cr}${r}))` };
    calculada(su.getCell(`${cp}${r}`));
  }
});
su.getCell("B16").value = "Puntaje SUS de cada persona (0 a 100)"; su.getCell("B16").font = { bold: true };
for (let p = 0; p < NP; p++) {
  const cr = colLetra(3 + p), cp = colLetra(3 + NP + p);
  su.getCell(`${cp}16`).value = { formula: `IF(COUNT(${cr}5:${cr}14)<10,"",SUM(${cp}5:${cp}14)*2.5)` };
  su.getCell(`${cp}16`).font = { bold: true }; su.getCell(`${cp}16`).alignment = { horizontal: "center" }; su.getCell(`${cp}16`).numFmt = "0.0";
}
const c1 = colLetra(3 + NP), cN = colLetra(2 + 2 * NP), cM = colLetra(3 + 2 * NP), cE = colLetra(4 + 2 * NP);
su.getCell(`${cM}16`).value = { formula: `IF(COUNT(${c1}16:${cN}16)=0,"",AVERAGE(${c1}16:${cN}16))` };
su.getCell(`${cE}16`).value = { formula: `IF(COUNT(${c1}16:${cN}16)<2,"",STDEV(${c1}16:${cN}16)/SQRT(COUNT(${c1}16:${cN}16)))` };
for (const c of [cM, cE]) { su.getCell(`${c}16`).font = { bold: true }; su.getCell(`${c}16`).alignment = { horizontal: "center" }; su.getCell(`${c}16`).numFmt = "0.0"; }

// ------------------------------------------------------------ Métricas por caso y por persona
const me = wb.addWorksheet("Metricas", { views: [{ state: "frozen", ySplit: 4, xSplit: 2 }] });
const COL_VAL = (p) => colLetra(5 + 2 * p), COL_CUM = (p) => colLetra(6 + 2 * p); // E,F, G,H, ...
const G0 = 5 + 2 * NP; // primera columna del grupo
const [gN, gCumplen, gPct, gMedia, gEE, gOk, gNota] = [0, 1, 2, 3, 4, 5, 6].map((k) => colLetra(G0 + k));
me.columns = [{ width: 6 }, { width: 44 }, { width: 30 }, { width: 34 }, ...PARTICIPANTES.flatMap(() => [{ width: 9 }, { width: 9 }]), { width: 8 }, { width: 11 }, { width: 11 }, { width: 9 }, { width: 11 }, { width: 11 }, { width: 46 }];
titulo(me, "Métrica de cada caso de prueba: por persona y del grupo", "El valor es la proporción del criterio que cumple la persona (0 a 1; en el caso 2, controles comprendidos de 26). Queda vacío hasta que estén registradas las tareas del caso.");
me.getRow(4).values = ["Caso", "Nombre", "Métrica ISO/IEC 9126-2", "Criterio por persona", ...PARTICIPANTES.flatMap((p) => [`${p}\nvalor`, `${p}\n¿cumple?`]), "Personas\ncon dato", "Personas\nque cumplen", "% que\ncumplen", "Media\ndel valor", "Error\nestándar", "¿Cumple\nel grupo?", "Qué es el valor y notas"];
encabezado(me.getRow(4), 48);
const rg = (hoja, col, ids) => `${q(hoja)}!${col}${fila(Number(ids[0].slice(1)))}:${col}${fila(Number(ids[ids.length - 1].slice(1)))}`;
const prop = (col, hoja, ids) => `IF(COUNTA(${rg(hoja, "U", ids)})<3,"",COUNTIF(${rg(hoja, "U", ids)},"Sí")/3)`;
const umbral = (v) => `IF(${v}="","",IF(${v}>=Parametros!$B$8,"Sí","No"))`;
const igual1 = (v) => `IF(${v}="","",IF(${v}=1,"Sí","No"))`;
const FORM = {
  1: (h, ids) => ({ v: prop("U", h, ids), c: umbral, nota: "Pantallas con el propósito bien descrito, de 3." }),
  2: () => ({ v: '"—"', c: () => '"—"', nota: "No aplicado (decisión del equipo): sin tareas ni métrica." }),
  3: (h, ids) => ({ v: prop("U", h, ids), c: (v) => `IF(OR(${v}="",COUNT(${rg(h, "I", ids)})<3),"",IF(AND(${v}=1,COUNTIF(${rg(h, "L", ids)},"No")=0),"Sí","No"))`, nota: "Compras completadas sin ayuda y dentro del tiempo objetivo, de 3." }),
  4: (h, ids) => ({ v: prop("U", h, ids), c: umbral, nota: "Mensajes de error entendidos con la acción correcta, de 3." }),
  5: (h, ids) => ({ v: `IF(COUNT(${rg(h, "T", ids)})<3,"",SUMPRODUCT(--(${rg(h, "T", ids)}=0))/3)`, c: (v) => `IF(${v}="","",IF(AND(${v}=1,SUM(${rg(h, "T", ids)})=0),"Sí","No"))`, nota: "Compras (T07 a T09) sin consultas externas, de 3." }),
  6: (h, ids) => ({ v: prop("U", h, ids), c: igual1, nota: "Rutas sin error de navegación, de 3. Revisar la eficiencia de clics en «Grupo»." }),
  7: (h, ids) => ({ v: prop("U", h, ids), c: umbral, nota: "Estados del sistema descritos correctamente, de 3." }),
  8: (h, ids) => ({ v: `IF(COUNT(${rg(h, "I", ids)})<3,"",SUMPRODUCT(--(${rg(h, "I", ids)}<=Parametros!$B$5),--(${rg(h, "I", ids)}<=${rg(h, "H", ids)}))/3)`, c: igual1, nota: "Tareas dentro del límite de 180 s y del tiempo objetivo, de 3." }),
  9: (h, ids) => ({ v: `IF(COUNT(${rg(h, "R", ids)})<3,"",SUMPRODUCT(--(${rg(h, "R", ids)}<Parametros!$B$6))/3)`, c: igual1, nota: "Compras con menos errores que el valor predeterminado, de 3." }),
  10: (h, ids) => ({ v: `IF(COUNT(${rg(h, "S", ids)})<3,"",SUMPRODUCT(--(${rg(h, "S", ids)}<=Parametros!$B$7))/3)`, c: igual1, nota: "Compras con 0 o 1 ayuda, de 3." }),
  11: (h, ids) => ({ v: prop("U", h, ids), c: igual1, nota: "Tareas del día 2 sin reaprendizaje ni ayuda, de 3." }),
  12: (h, ids) => ({ v: `IF(OR(COUNT(${rg(h, "I", ids)})<3,COUNT(${rg(h, "R", ids)})<3,COUNT(${rg(h, "S", ids)})<3),"",SUMPRODUCT(--(${rg(h, "I", ids)}<=${rg(h, "H", ids)}),--(${rg(h, "R", ids)}<Parametros!$B$6),--(${rg(h, "S", ids)}<=Parametros!$B$7))/3)`, c: igual1, nota: "Tareas dentro del tiempo objetivo, con menos errores que el predeterminado y con 0 o 1 ayuda, de 3." }),
};
CASOS.forEach((c, i) => {
  const r = 5 + i;
  me.getCell(`A${r}`).value = c.n; me.getCell(`B${r}`).value = c.nombre; me.getCell(`C${r}`).value = c.metricaIso; me.getCell(`D${r}`).value = c.criterio;
  const valores = [];
  PARTICIPANTES.forEach((cod, p) => {
    const f = FORM[c.n](cod, c.tareas, p);
    const cv = COL_VAL(p), cc = COL_CUM(p);
    me.getCell(`${cv}${r}`).value = { formula: f.v };
    me.getCell(`${cc}${r}`).value = { formula: f.c(`${cv}${r}`) };
    me.getCell(`${cv}${r}`).numFmt = "0%";
    valores.push(`${cv}${r}`);
  });
  const lista = valores.join(",");
  me.getCell(`${gN}${r}`).value = { formula: `COUNT(${lista})` };
  me.getCell(`${gCumplen}${r}`).value = { formula: `COUNTIF(E${r}:${colLetra(4 + 2 * NP)}${r},"Sí")` };
  me.getCell(`${gPct}${r}`).value = { formula: `IF(${gN}${r}=0,"",${gCumplen}${r}/${gN}${r})` };
  me.getCell(`${gMedia}${r}`).value = { formula: `IF(${gN}${r}=0,"",AVERAGE(${lista}))` };
  me.getCell(`${gEE}${r}`).value = { formula: `IF(${gN}${r}<2,"",STDEV(${lista})/SQRT(${gN}${r}))` };
  me.getCell(`${gOk}${r}`).value = { formula: `IF(${gPct}${r}="","",IF(${gPct}${r}>=Parametros!$B$8,"Sí","No"))` };
  me.getCell(`${gNota}${r}`).value = FORM[c.n](PARTICIPANTES[0], c.tareas, 0).nota;
  me.getCell(`${gPct}${r}`).numFmt = "0%"; me.getCell(`${gMedia}${r}`).numFmt = "0%"; me.getCell(`${gEE}${r}`).numFmt = "0.00";
  for (let k = 1; k <= G0 + 6; k++) {
    const x = me.getCell(r, k);
    x.border = borde; x.alignment = { wrapText: true, vertical: "top", horizontal: k <= 4 || k === G0 + 6 ? "left" : "center" };
  }
  me.getCell(`A${r}`).alignment = { horizontal: "center", vertical: "top" };
  me.getRow(r).height = 48;
  if (c.aplicado === false) for (let k = 1; k <= G0 + 6; k++) gris(me.getCell(r, k));
});
colorSiNo(me, `E5:${gOk}16`);

// ------------------------------------------------------------ Grupo: por tarea y resumen
const gr = wb.addWorksheet("Grupo", { views: [{ state: "frozen", ySplit: 4, xSplit: 3 }] });
const GCOLS = [["ID", 6], ["Caso", 6], ["Tarea", 34], ["Tipo", 12], ["T ref (s)\nequipo", 9], ["T obj (s)\nsugerido", 9], ...PARTICIPANTES.map((p) => [`T ${p} (s)`, 9]), ["Media\n(s)", 9], ["Error\nestándar", 9], ["n", 5], ["Razón\nmedia /\nT ref", 9], ["Clics\nideales", 8], ["Clics\nmedios", 8], ["Eficiencia\nde clics", 9], ["Errores\nmedios", 9], ["Ayudas\nmedias", 9], ["Cumplen\nel tiempo", 10], ["Completaron\no acertaron", 12], ["SEQ\nmedio", 8]];
gr.columns = GCOLS.map(([, w]) => ({ width: w }));
titulo(gr, "Grupo: resultados por tarea y resumen", "Media y error estándar entre personas (s/√n). Todo se calcula a partir de las hojas de cada participante.");
gr.getRow(4).values = GCOLS.map(([n]) => n);
encabezado(gr.getRow(4), 48);
const cT0 = 7; // columna G = T de P01
const cMedia = colLetra(cT0 + NP), cEE = colLetra(cT0 + NP + 1), cn = colLetra(cT0 + NP + 2), cRazon = colLetra(cT0 + NP + 3), cIdeal = colLetra(cT0 + NP + 4), cClics = colLetra(cT0 + NP + 5), cEfic = colLetra(cT0 + NP + 6), cErr = colLetra(cT0 + NP + 7), cAyu = colLetra(cT0 + NP + 8), cCum = colLetra(cT0 + NP + 9), cOk = colLetra(cT0 + NP + 10), cSeq = colLetra(cT0 + NP + 11);
const a = (col, r) => PARTICIPANTES.map((c) => `${q(c)}!${col}${r}`).join(",");
TAREAS.forEach((t) => {
  const r = fila(Number(t.id.slice(1)));
  const op = t.tipo === "operacion" && base(t.id) && !base(t.id).error;
  gr.getCell(`A${r}`).value = t.id; gr.getCell(`B${r}`).value = t.caso; gr.getCell(`C${r}`).value = t.titulo; gr.getCell(`D${r}`).value = op ? "Operativa" : "Comprensión";
  for (let k = 1; k <= 4; k++) { const x = gr.getCell(r, k); x.border = borde; x.fill = relleno(AZUL_CLARO); x.alignment = { wrapText: true, vertical: "top", horizontal: k === 3 ? "left" : "center" }; }
  if (op) {
    gr.getCell(`E${r}`).value = { formula: `${q(PARTICIPANTES[0])}!G${r}` };
    gr.getCell(`F${r}`).value = { formula: `${q(PARTICIPANTES[0])}!H${r}` };
    PARTICIPANTES.forEach((c, p) => { gr.getCell(r, cT0 + p).value = { formula: `IF(${q(c)}!I${r}="","",${q(c)}!I${r})` }; });
    const rango = `${colLetra(cT0)}${r}:${colLetra(cT0 + NP - 1)}${r}`;
    gr.getCell(`${cMedia}${r}`).value = { formula: `IF(COUNT(${rango})=0,"",AVERAGE(${rango}))` };
    gr.getCell(`${cEE}${r}`).value = { formula: `IF(COUNT(${rango})<2,"",STDEV(${rango})/SQRT(COUNT(${rango})))` };
    gr.getCell(`${cn}${r}`).value = { formula: `COUNT(${rango})` };
    gr.getCell(`${cRazon}${r}`).value = { formula: `IF(OR(${cMedia}${r}="",E${r}="",E${r}=0),"",${cMedia}${r}/E${r})` };
    gr.getCell(`${cIdeal}${r}`).value = { formula: `${q(PARTICIPANTES[0])}!F${r}` };
    gr.getCell(`${cClics}${r}`).value = { formula: `IF(COUNT(${a("M", r)})=0,"",AVERAGE(${a("M", r)}))` };
    gr.getCell(`${cEfic}${r}`).value = { formula: `IF(OR(${cClics}${r}="",${cClics}${r}=0,${cIdeal}${r}=""),"",${cIdeal}${r}/${cClics}${r})` };
    gr.getCell(`${cCum}${r}`).value = { formula: `IF(${cn}${r}=0,"",(${PARTICIPANTES.map((c) => `(${q(c)}!L${r}="Sí")`).join("+")})&" de "&${cn}${r})` };
    for (const col of ["E", "F", cMedia, cEE, cRazon, cClics, cEfic]) gr.getCell(`${col}${r}`).numFmt = "0.0";
    for (const col of [cRazon, cEfic]) gr.getCell(`${col}${r}`).numFmt = "0.00";
  } else {
    for (let k = 5; k <= cT0 + NP + 6; k++) gris(gr.getCell(r, k));
  }
  gr.getCell(`${cErr}${r}`).value = { formula: `IF(COUNT(${a("R", r)})=0,"",AVERAGE(${a("R", r)}))` };
  gr.getCell(`${cAyu}${r}`).value = { formula: `IF(COUNT(${a("S", r)})=0,"",AVERAGE(${a("S", r)}))` };
  gr.getCell(`${cSeq}${r}`).value = { formula: `IF(COUNT(${a("V", r)})=0,"",AVERAGE(${a("V", r)}))` };
  {
    const nn = PARTICIPANTES.map((c) => `(${q(c)}!U${r}="Sí")+(${q(c)}!U${r}="No")`).join("+");
    const si = PARTICIPANTES.map((c) => `(${q(c)}!U${r}="Sí")`).join("+");
    gr.getCell(`${cOk}${r}`).value = { formula: `IF((${nn})=0,"",(${si})&" de "&(${nn}))` };
  }
  for (let k = 5; k <= cT0 + NP + 11; k++) { const x = gr.getCell(r, k); x.border = borde; x.alignment = { vertical: "top", horizontal: "center", wrapText: true }; }
  for (const col of [cErr, cAyu, cSeq]) gr.getCell(`${col}${r}`).numFmt = "0.0";
  gr.getRow(r).height = 30;
});
for (const k of [4, 5, 6]) {
  const r = fila(k);
  gr.getCell(`A${r}`).value = `T0${k}`; gr.getCell(`C${r}`).value = "Retirada: el caso 2 no se aplica";
  for (let c = 1; c <= cT0 + NP + 11; c++) gris(gr.getCell(r, c));
}
gr.getCell(`A${ultima + 3}`).value = "Resumen general";
gr.getCell(`A${ultima + 3}`).font = { bold: true, size: 12, color: { argb: AZUL } };
const rs = ultima + 4;
const unos = (c) => `(COUNTIF(${q(c)}!U${FILA0}:U${ultima},"Sí")+COUNTIF(${q(c)}!U${FILA0}:U${ultima},"No")>0)`;
const resumen = [
  ["Participantes con datos registrados", `${PARTICIPANTES.map(unos).join("+")}`, "de " + NP, "0"],
  ["Casos que cumple el grupo", `COUNTIF(Metricas!${gOk}5:${gOk}16,"Sí")`, "al menos el 80 % de las personas cumple el caso", "0"],
  ["Casos evaluados", `COUNTIF(Metricas!${gOk}5:${gOk}16,"Sí")+COUNTIF(Metricas!${gOk}5:${gOk}16,"No")`, "de 11 (el caso 2 no se aplica)", "0"],
  ["Porcentaje de casos que cumple el grupo", `IF(D${rs + 2}=0,"",D${rs + 1}/D${rs + 2})`, "casos que cumple el grupo ÷ casos evaluados", "0%"],
  ["Razón media T usuario / T ref (tareas operativas)", `IFERROR(AVERAGE(${cRazon}${FILA0}:${cRazon}${ultima}),"")`, "1,00 = igual que el experto; el objetivo suele ser 3,00", "0.00"],
  ["Eficiencia media de clics (ideales / usuario)", `IFERROR(AVERAGE(${cEfic}${FILA0}:${cEfic}${ultima}),"")`, "1,00 = ruta ideal", "0.00"],
  ["Errores medios por tarea", `IFERROR(AVERAGE(${cErr}${FILA0}:${cErr}${ultima}),"")`, "navegación + selección + datos", "0.00"],
  ["Ayudas medias por tarea", `IFERROR(AVERAGE(${cAyu}${FILA0}:${cAyu}${ultima}),"")`, "", "0.00"],
  ["SEQ medio (1 a 7)", `IFERROR(AVERAGE(${cSeq}${FILA0}:${cSeq}${ultima}),"")`, "mayor es más fácil", "0.0"],
  ["Puntaje SUS medio (0 a 100)", `SUS!${cM}16`, "media entre personas", "0.0"],
  ["Error estándar del SUS", `SUS!${cE}16`, "s / √n", "0.0"],
];
resumen.forEach(([lab, f, nota, fmt], i) => {
  const r = rs + i;
  gr.getCell(`A${r}`).value = lab; gr.mergeCells(`A${r}:C${r}`);
  gr.getCell(`D${r}`).value = { formula: f }; gr.getCell(`D${r}`).numFmt = fmt;
  gr.getCell(`E${r}`).value = nota; gr.mergeCells(`E${r}:L${r}`);
  for (const col of ["A", "D", "E"]) { const x = gr.getCell(`${col}${r}`); x.border = borde; x.alignment = { wrapText: true, vertical: "top", horizontal: col === "D" ? "center" : "left" }; }
  gr.getCell(`A${r}`).font = { bold: true }; gr.getCell(`E${r}`).font = { italic: true, color: { argb: "FF555555" } };
});

const destino = path.join(SALIDA, "Registro_Medicion_CU2_ComproYa.xlsx");
await wb.xlsx.writeFile(destino);
console.log(`Escrito docs/usabilidad/Registro_Medicion_CU2_ComproYa.xlsx (${NP} participantes)`);
