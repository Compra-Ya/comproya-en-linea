// Genera docs/usabilidad/Registro_Medicion_CU2_ComproYa.xlsx: el único archivo donde se anotan las sesiones.
// Se anota por persona y tarea: tiempo, clics, errores, ayudas, si lo logró o entendió, dificultad (1 a 7) y lo que dijo.
// Todo lo demás se calcula. Tiempos y clics de referencia: linea-base.json.
import ExcelJS from "exceljs";
import { readFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { CASOS, CASOS_NO_APLICADOS, CUENTAS, PARTICIPANTES, TAREAS } from "./sesion.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SALIDA = path.resolve(AQUI, "../../docs/usabilidad");
mkdirSync(SALIDA, { recursive: true });
const LB = JSON.parse(readFileSync(path.join(AQUI, "linea-base.json"), "utf8"));
const NP = PARTICIPANTES.length;

const AZUL = "FF163D6D", AMARILLO = "FFFFF6D6", GRIS = "FFEDEDED", CLARO = "FFE8EEF6";
const relleno = (c) => ({ type: "pattern", pattern: "solid", fgColor: { argb: c } });
const lado = { style: "thin", color: { argb: "FFBFC7D1" } };
const borde = { top: lado, bottom: lado, left: lado, right: lado };
const wb = new ExcelJS.Workbook();
wb.creator = "Equipo ComproYa";
wb.calcProperties.fullCalcOnLoad = true;
const letra = (n) => { let s = ""; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; };
function cab(fila, alto = 40) {
  fila.eachCell((c) => { c.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 }; c.fill = relleno(AZUL); c.alignment = { vertical: "middle", horizontal: "center", wrapText: true }; c.border = borde; });
  fila.height = alto;
}
const entrada = (c) => { c.fill = relleno(AMARILLO); c.border = borde; };
const gris = (c) => { c.fill = relleno(GRIS); c.border = borde; };
const calc = (c, h = "center") => { c.border = borde; c.alignment = { vertical: "top", horizontal: h, wrapText: true }; };
const titulo = (h, t, s) => { h.getCell("A1").value = t; h.getCell("A1").font = { bold: true, size: 14, color: { argb: AZUL } }; if (s) { h.getCell("A2").value = s; h.getCell("A2").font = { italic: true, color: { argb: "FF555555" } }; } };
const siNo = (h, ref) => h.addConditionalFormatting({ ref, rules: [
  { type: "cellIs", operator: "equal", formulae: ['"Sí"'], style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFD5F0DD" } }, font: { color: { argb: "FF1E6B3A" }, bold: true } } },
  { type: "cellIs", operator: "equal", formulae: ['"No"'], style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFFBD9D3" } }, font: { color: { argb: "FF9B2C1C" }, bold: true } } },
] });
const lb = (ref) => LB.tareas[ref];
const hacer = (t) => t.tipo === "hacer";

// ------------------------------------------------------------ Cómo usar
const co = wb.addWorksheet("Cómo usar", { views: [{ showGridLines: false }] });
co.columns = [{ width: 3 }, { width: 128 }];
titulo(co, "Registro de la prueba de usabilidad · ComproYa en Línea", "Un solo archivo: aquí se anota, y el resto se calcula solo.");
const lineas = [
  ["Qué se anota (solo en las celdas amarillas de «Registro»)", 1],
  ["Por cada persona y tarea: el **tiempo en segundos**, los **clics**, los **errores**, las **ayudas**, si **lo logró o lo entendió** (Sí/No), la **dificultad que dijo (1 a 7)** y **lo que dijo** en voz alta (una cita corta).", 0],
  ["Tiempo: 1 minuto 30 segundos = 90. Empieza cuando dices «puedes comenzar» y termina en «Termina cuando» (hoja «Tareas»); no cuentes el tiempo que tarda en responder tus preguntas.", 0],
  ["Clics: cada pulsación del mouse, incluidos los clics para entrar a un campo. Las teclas no cuentan.", 0],
  ["Errores: veces que se equivoca (entra a una pantalla que no era, pulsa un botón que no servía, escribe mal un dato).", 0],
  ["Ayudas: veces que pide ayuda, que tú intervienes o que busca fuera de la pantalla (otra persona, Google, un manual).", 0],
  ["Las tareas de «preguntar» (T1, T5, T6a, T6b, T7a, T8a) no llevan tiempo ni clics: marca Sí si la explicación fue correcta (la regla está en «Tareas») y escribe lo que dijo.", 0],
  ["", 0],
  ["Cómo aplicar la sesión (unos 40 minutos por persona)", 1],
  ["1. Antes: portal en ventana privada, sin sesión, carrito vacío; haz tú una compra de prueba; prueba la grabación de pantalla y voz.", 0],
  ["2. Al llegar: bienvenida, consentimiento firmado, datos para usar y practicar pensar en voz alta. **No le muestres ni le expliques el sistema.**", 0],
  ["3. Entrégale una tarea a la vez (guía del participante) y deja el portal como indica «Déjalo listo antes» en la hoja «Tareas».", 0],
  ["4. No ayudes, no nombres botones y no digas «bien» o «mal». Si pregunta cómo se hace, di «¿qué intentarías?» y anota una ayuda si insiste.", 0],
  ["5. Si el portal falla, anótalo en «Lo que dijo» como «falla técnica»: no es error de la persona; repite la tarea.", 0],
  ["6. Al terminar cada tarea, pregunta la dificultad (1 a 7). Al final, la pregunta «¿qué fue lo más difícil?» va en la fila F.", 0],
  ["", 0],
  ["Qué calcula el Excel", 1],
  ["«Resultados»: por caso de prueba, si cada persona cumple y si cumple el grupo (al menos el 80 % de las personas), con media y error estándar. «Tiempos»: por tarea, tiempo medio con error estándar, razón con el tiempo del equipo, clics y dificultad media.", 0],
  ["Con cinco personas los resultados son indicativos; el estándar recomienda ocho o más. No se aplican los casos 2, 4, 6 y 11 (íconos, mensajes de error, navegación y retención).", 0],
];
lineas.forEach(([t, h], i) => {
  const c = co.getCell(`B${4 + i}`);
  c.value = t.replace(/\*\*/g, "");
  c.alignment = { wrapText: true, vertical: "top" };
  c.font = { size: h ? 12 : 10.5, bold: !!h, color: { argb: h ? AZUL : "FF222222" } };
});

// ------------------------------------------------------------ Tareas (referencia)
const ta = wb.addWorksheet("Tareas", { views: [{ state: "frozen", ySplit: 5 }] });
ta.columns = [{ width: 8 }, { width: 40 }, { width: 11 }, { width: 46 }, { width: 38 }, { width: 11 }, { width: 11 }, { width: 10 }];
titulo(ta, "Tareas de la sesión (referencia)", "Los tiempos del equipo se midieron en el portal real (e2e/usabilidad/medir-linea-base.mjs). El objetivo sugerido para una persona nueva es el tiempo del equipo × el factor.");
ta.getCell("A3").value = "Factor"; ta.getCell("B3").value = 3; entrada(ta.getCell("B3"));
ta.getCell("C3").value = "Límite 1.ª función (s)"; ta.getCell("D3").value = 180; entrada(ta.getCell("D3"));
ta.getCell("D3").alignment = { horizontal: "left" };
ta.getRow(5).values = ["Tarea", "Qué es", "Tipo", "Déjalo listo antes", "Termina cuando", "Tiempo equipo (s)", "Tiempo objetivo (s)", "Clics ideales"];
cab(ta.getRow(5));
const BASICAS = new Set(["T2", "T3", "T4"]);
TAREAS.forEach((t, i) => {
  const r = 6 + i;
  ta.getCell(`A${r}`).value = t.n; ta.getCell(`A${r}`).numFmt = "@";
  ta.getCell(`B${r}`).value = t.titulo; ta.getCell(`C${r}`).value = hacer(t) ? "Hacer" : "Preguntar"; ta.getCell(`D${r}`).value = t.estado; ta.getCell(`E${r}`).value = t.termina;
  const b = hacer(t) ? lb(t.ref) : null;
  if (b) {
    ta.getCell(`F${r}`).value = b.referenciaExpertoS;
    const base = `ROUNDUP(F${r}*$B$3/5,0)*5`;
    ta.getCell(`G${r}`).value = { formula: BASICAS.has(t.n) ? `MIN(${base},$D$3)` : base };
    ta.getCell(`H${r}`).value = b.clics;
  }
  for (let c = 1; c <= 8; c++) { const x = ta.getCell(r, c); x.border = borde; x.alignment = { wrapText: true, vertical: "top", horizontal: c === 2 || c === 4 || c === 5 ? "left" : "center" }; }
  if (!b) for (const c of ["F", "G", "H"]) gris(ta.getCell(`${c}${r}`));
  ta.getRow(r).height = 44;
});
const ULT_T = 5 + TAREAS.length; // 20

// ------------------------------------------------------------ Participantes
const pa = wb.addWorksheet("Participantes");
pa.columns = [{ width: 9 }, { width: 34 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 8 }, { width: 22 }, { width: 24 }, { width: 14 }, { width: 28 }];
titulo(pa, "Participantes", "El documento y el correo son los de la cuenta de prueba que crea cada persona en la tienda (ficticios).");
pa.getRow(4).values = ["Código", "Nombre", "Fecha de la sesión", "Evaluador", "Observador", "Edad", "Ocupación", "¿Compra en línea? (frecuencia)", "Documento de prueba", "Correo de prueba"];
cab(pa.getRow(4));
PARTICIPANTES.forEach((p, i) => {
  const r = 5 + i;
  pa.getCell(`A${r}`).value = p.codigo;
  pa.getCell(`B${r}`).value = p.nombre || null;
  pa.getCell(`I${r}`).value = CUENTAS[i].documento; pa.getCell(`J${r}`).value = CUENTAS[i].correo;
  for (let c = 1; c <= 10; c++) { const x = pa.getCell(r, c); x.border = borde; if (c >= 2 && c <= 8) entrada(x); }
});

// ------------------------------------------------------------ Registro
const NREG = NP * (TAREAS.length + 1);
const R0 = 5, R1 = R0 + NREG - 1;
const re = wb.addWorksheet("Registro", { views: [{ state: "frozen", xSplit: 4, ySplit: 4 }] });
re.columns = [{ width: 8 }, { width: 26 }, { width: 7 }, { width: 34 }, { width: 10 }, { width: 8 }, { width: 8 }, { width: 8 }, { width: 11 }, { width: 11 }, { width: 52 }, { width: 10 }, { width: 10 }, { width: 10 }, { width: 9 }, { width: 8 }, { width: 10 }];
titulo(re, "Registro: una fila por persona y tarea", "Amarillo = se anota. Filtra por «Persona» para ver una sola. Gris = no aplica.");
re.getRow(4).values = ["Persona", "Nombre", "Tarea", "Qué es", "Tiempo (s)", "Clics", "Errores", "Ayudas", "¿Lo logró o lo entendió?", "Dificultad (1 a 7)", "Lo que dijo", "Tiempo equipo (s)", "Objetivo (s)", "¿En tiempo?", "Razón", "Clics ideales", "Eficiencia de clics"];
cab(re.getRow(4), 46);
let r = R0;
for (const p of PARTICIPANTES) {
  const filasP = [...TAREAS.map((t) => ({ t })), { final: true }];
  for (const { t, final } of filasP) {
    re.getCell(`A${r}`).value = p.codigo;
    re.getCell(`B${r}`).value = { formula: `IFERROR(VLOOKUP($A${r},Participantes!$A$5:$B$${4 + NP},2,0)&"","")` };
    re.getCell(`C${r}`).value = final ? "F" : t.n; re.getCell(`C${r}`).numFmt = "@";
    re.getCell(`D${r}`).value = final ? "Lo más difícil o confuso (pregunta final)" : t.titulo;
    for (let c = 1; c <= 17; c++) { const x = re.getCell(r, c); x.border = borde; x.alignment = { vertical: "top", wrapText: true, horizontal: c === 4 || c === 11 || c === 2 ? "left" : "center" }; }
    for (const c of ["A", "B", "C", "D"]) re.getCell(`${c}${r}`).fill = relleno(CLARO);
    entrada(re.getCell(`K${r}`));
    if (final) {
      for (const c of ["E", "F", "G", "H", "I", "J", "L", "M", "N", "O", "P", "Q"]) gris(re.getCell(`${c}${r}`));
    } else {
      const h = hacer(t);
      if (h) { for (const c of ["E", "F", "G", "H"]) entrada(re.getCell(`${c}${r}`)); } else { for (const c of ["E", "F", "G", "H"]) gris(re.getCell(`${c}${r}`)); }
      entrada(re.getCell(`I${r}`));
      if (t.seq) entrada(re.getCell(`J${r}`)); else gris(re.getCell(`J${r}`));
      if (h) {
        re.getCell(`L${r}`).value = { formula: `IFERROR(VLOOKUP($C${r},Tareas!$A$6:$H$${ULT_T},6,0),"")` };
        re.getCell(`M${r}`).value = { formula: `IFERROR(VLOOKUP($C${r},Tareas!$A$6:$H$${ULT_T},7,0),"")` };
        re.getCell(`N${r}`).value = { formula: `IF(OR(E${r}="",M${r}=""),"",IF(E${r}<=M${r},"Sí","No"))` };
        re.getCell(`O${r}`).value = { formula: `IF(OR(E${r}="",L${r}="",L${r}=0),"",E${r}/L${r})` };
        re.getCell(`P${r}`).value = { formula: `IFERROR(VLOOKUP($C${r},Tareas!$A$6:$H$${ULT_T},8,0),"")` };
        re.getCell(`Q${r}`).value = { formula: `IF(OR(F${r}="",F${r}=0,P${r}=""),"",P${r}/F${r})` };
        re.getCell(`O${r}`).numFmt = "0.00"; re.getCell(`Q${r}`).numFmt = "0.00";
      } else for (const c of ["L", "M", "N", "O", "P", "Q"]) gris(re.getCell(`${c}${r}`));
      re.getCell(`I${r}`).dataValidation = { type: "list", allowBlank: true, formulae: ['"Sí,No"'] };
      if (t.seq) re.getCell(`J${r}`).dataValidation = { type: "whole", operator: "between", allowBlank: true, formulae: [1, 7], showErrorMessage: true, errorTitle: "Dificultad", error: "Escribe un número entero de 1 a 7." };
      if (h) for (const c of ["E", "F", "G", "H"]) re.getCell(`${c}${r}`).dataValidation = { type: "decimal", operator: "greaterThanOrEqual", allowBlank: true, formulae: [0], showErrorMessage: true, errorTitle: "Dato", error: "Escribe un número mayor o igual a 0." };
    }
    re.getRow(r).height = 30;
    r++;
  }
}
siNo(re, `I${R0}:I${R1}`); siNo(re, `N${R0}:N${R1}`);
re.autoFilter = { from: "A4", to: `Q${R1}` };

// ------------------------------------------------------------ Resultados por caso
const rs = wb.addWorksheet("Resultados", { views: [{ state: "frozen", ySplit: 4, xSplit: 3 }] });
const c0 = 4; // D = primera persona (valor); luego un bloque de ¿cumple?
const cV = (p) => letra(c0 + p), cC = (p) => letra(c0 + NP + p);
const gN = letra(c0 + 2 * NP), gCum = letra(c0 + 2 * NP + 1), gPct = letra(c0 + 2 * NP + 2), gMed = letra(c0 + 2 * NP + 3), gEE = letra(c0 + 2 * NP + 4), gOk = letra(c0 + 2 * NP + 5);
rs.columns = [{ width: 6 }, { width: 46 }, { width: 40 }, ...Array(2 * NP).fill({ width: 8 }), { width: 9 }, { width: 9 }, { width: 8 }, { width: 8 }, { width: 9 }, { width: 10 }];
titulo(rs, "Resultados por caso de prueba", "El valor es la proporción de las tareas del caso que cumple la persona (0 a 1). El grupo cumple un caso si al menos el 80 % de las personas lo cumple.");
rs.getRow(4).values = ["Caso", "Nombre (material de clase)", "Regla para cada persona", ...PARTICIPANTES.map((p) => p.codigo), ...PARTICIPANTES.map((p) => p.codigo + " ¿cumple?"), "Personas con dato", "Personas que cumplen", "% que cumplen", "Media del valor", "Error estándar", "¿Cumple el grupo?"];
cab(rs.getRow(4), 48);
const rg = (c) => `Registro!$${c}$${R0}:$${c}$${R1}`;
const A = rg("A"), C = rg("C"), E = rg("E"), G = rg("G"), H = rg("H"), I = rg("I"), N = rg("N");
const en = (tareas) => "(" + tareas.map((n) => `(${C}="${n}")`).join("+") + ")";
const FORM = {
  1: { v: (p, e) => `IF(SUMPRODUCT((${A}=${p})*${e}*((${I}="Sí")+(${I}="No")))<3,"",SUMPRODUCT((${A}=${p})*${e}*(${I}="Sí"))/3)`, ok: (v) => `IF(${v}="","",IF(${v}>=0.8,"Sí","No"))` },
  3: { v: (p, e) => `IF(OR(SUMPRODUCT((${A}=${p})*${e}*((${I}="Sí")+(${I}="No")))<3,SUMPRODUCT((${A}=${p})*${e}*(${H}<>""))<3),"",SUMPRODUCT((${A}=${p})*${e}*(${I}="Sí")*(${H}<>"")*(${H}=0))/3)`,
    ok: (v, p, e) => `IF(OR(${v}="",SUMPRODUCT((${A}=${p})*${e}*(${E}<>""))<3),"",IF(AND(${v}=1,SUMPRODUCT((${A}=${p})*${e}*(${N}="No"))=0),"Sí","No"))` },
  5: { v: (p, e) => `IF(SUMPRODUCT((${A}=${p})*${e}*(${H}<>""))<3,"",SUMPRODUCT((${A}=${p})*${e}*(${H}<>"")*(${H}=0))/3)`, ok: (v) => `IF(${v}="","",IF(${v}=1,"Sí","No"))` },
  7: { v: (p, e) => `IF(SUMPRODUCT((${A}=${p})*${e}*((${I}="Sí")+(${I}="No")))<3,"",SUMPRODUCT((${A}=${p})*${e}*(${I}="Sí"))/3)`, ok: (v) => `IF(${v}="","",IF(${v}>=0.8,"Sí","No"))` },
  8: { v: (p, e) => `IF(SUMPRODUCT((${A}=${p})*${e}*(${E}<>""))<3,"",SUMPRODUCT((${A}=${p})*${e}*(${E}<>"")*(${N}="Sí"))/3)`, ok: (v) => `IF(${v}="","",IF(${v}=1,"Sí","No"))` },
  9: { v: (p, e) => `IF(SUMPRODUCT((${A}=${p})*${e}*(${G}<>""))<3,"",SUMPRODUCT((${A}=${p})*${e}*(${G}<>"")*(${G}<3))/3)`, ok: (v) => `IF(${v}="","",IF(${v}=1,"Sí","No"))` },
  10: { v: (p, e) => `IF(SUMPRODUCT((${A}=${p})*${e}*(${H}<>""))<3,"",SUMPRODUCT((${A}=${p})*${e}*(${H}<>"")*(${H}<=1))/3)`, ok: (v) => `IF(${v}="","",IF(${v}=1,"Sí","No"))` },
  12: { v: (p, e) => `IF(OR(SUMPRODUCT((${A}=${p})*${e}*(${E}<>""))<3,SUMPRODUCT((${A}=${p})*${e}*(${G}<>""))<3,SUMPRODUCT((${A}=${p})*${e}*(${H}<>""))<3,SUMPRODUCT((${A}=${p})*${e}*((${I}="Sí")+(${I}="No")))<3),"",SUMPRODUCT((${A}=${p})*${e}*(${I}="Sí")*(${N}="Sí")*(${G}<>"")*(${G}<3)*(${H}<>"")*(${H}<=1))/3)`, ok: (v) => `IF(${v}="","",IF(${v}=1,"Sí","No"))` },
};
CASOS.forEach((c, i) => {
  const row = 5 + i;
  rs.getCell(`A${row}`).value = c.n; rs.getCell(`B${row}`).value = c.nombre; rs.getCell(`C${row}`).value = c.regla;
  const e = en(c.tareas);
  const vals = [];
  PARTICIPANTES.forEach((_, p) => {
    const pc = `${cV(p)}$4`; // código de la persona (encabezado)
    const celV = `${cV(p)}${row}`;
    rs.getCell(celV).value = { formula: FORM[c.n].v(pc, e) };
    rs.getCell(celV).numFmt = "0%";
    rs.getCell(`${cC(p)}${row}`).value = { formula: FORM[c.n].ok(celV, pc, e) };
    vals.push(celV);
  });
  const lista = vals.join(",");
  rs.getCell(`${gN}${row}`).value = { formula: `COUNT(${lista})` };
  rs.getCell(`${gCum}${row}`).value = { formula: `COUNTIF(${cC(0)}${row}:${cC(NP - 1)}${row},"Sí")` };
  rs.getCell(`${gPct}${row}`).value = { formula: `IF(${gN}${row}=0,"",${gCum}${row}/${gN}${row})` };
  rs.getCell(`${gMed}${row}`).value = { formula: `IF(${gN}${row}=0,"",AVERAGE(${lista}))` };
  rs.getCell(`${gEE}${row}`).value = { formula: `IF(${gN}${row}<2,"",STDEV(${lista})/SQRT(${gN}${row}))` };
  rs.getCell(`${gOk}${row}`).value = { formula: `IF(${gPct}${row}="","",IF(${gPct}${row}>=0.8,"Sí","No"))` };
  for (const col of [gPct, gMed]) rs.getCell(`${col}${row}`).numFmt = "0%";
  rs.getCell(`${gEE}${row}`).numFmt = "0.00";
  for (let k = 1; k <= c0 + 2 * NP + 5; k++) { const x = rs.getCell(row, k); x.border = borde; x.alignment = { vertical: "top", wrapText: true, horizontal: k >= 4 ? "center" : "left" }; }
  rs.getRow(row).height = 36;
});
siNo(rs, `${cC(0)}5:${gOk}${4 + CASOS.length}`);
const fin = 5 + CASOS.length + 1;
rs.getCell(`B${fin}`).value = "Casos que cumple el grupo"; rs.getCell(`D${fin}`).value = { formula: `COUNTIF(${gOk}5:${gOk}${4 + CASOS.length},"Sí")` };
rs.getCell(`B${fin + 1}`).value = "Casos evaluados (con datos completos)"; rs.getCell(`D${fin + 1}`).value = { formula: `COUNTIF(${gOk}5:${gOk}${4 + CASOS.length},"Sí")+COUNTIF(${gOk}5:${gOk}${4 + CASOS.length},"No")` };
rs.getCell(`B${fin + 2}`).value = "Casos que no se aplican"; rs.getCell(`C${fin + 2}`).value = CASOS_NO_APLICADOS.map((c) => `${c.n} (${c.nombre})`).join("; ");
rs.getCell(`C${fin + 2}`).alignment = { wrapText: true, vertical: "top" }; rs.getRow(fin + 2).height = 48;
for (const k of [fin, fin + 1, fin + 2]) rs.getCell(`B${k}`).font = { bold: true };

// ------------------------------------------------------------ Tiempos por tarea
const ti = wb.addWorksheet("Tiempos", { views: [{ state: "frozen", ySplit: 4, xSplit: 2 }] });
const principales = TAREAS.filter((t) => t.seq);
ti.columns = [{ width: 7 }, { width: 42 }, { width: 10 }, { width: 10 }, ...Array(NP).fill({ width: 9 }), { width: 9 }, { width: 10 }, { width: 10 }, { width: 9 }, { width: 9 }, { width: 10 }, { width: 9 }, { width: 9 }, { width: 11 }];
titulo(ti, "Tiempos, clics y dificultad por tarea", "Media y error estándar entre personas (s / √n). Razón 1,00 = igual que el equipo.");
ti.getRow(4).values = ["Tarea", "Qué es", "Equipo (s)", "Objetivo (s)", ...PARTICIPANTES.map((p) => p.codigo), "Media (s)", "Error estándar", "Razón media", "Clics ideales", "Clics medios", "Eficiencia", "Errores medios", "Ayudas medias", "Dificultad media (1-7)"];
cab(ti.getRow(4), 46);
principales.forEach((t, i) => {
  const row = 5 + i;
  const h = hacer(t);
  ti.getCell(`A${row}`).value = t.n; ti.getCell(`A${row}`).numFmt = "@"; ti.getCell(`B${row}`).value = t.titulo;
  const base = h ? lb(t.ref) : null;
  const tl = `VLOOKUP($A${row},Tareas!$A$6:$H$${ULT_T}`;
  if (h) {
    ti.getCell(`C${row}`).value = { formula: `${tl},6,0)` };
    ti.getCell(`D${row}`).value = { formula: `${tl},7,0)` };
    PARTICIPANTES.forEach((p, k) => {
      const col = letra(5 + k);
      ti.getCell(`${col}${row}`).value = { formula: `IF(SUMPRODUCT((${A}=${col}$4)*(${C}=$A${row})*(${E}<>""))=0,"",SUMIFS(${E},${A},${col}$4,${C},$A${row}))` };
    });
    const a = `E${row}:${letra(4 + NP)}${row}`;
    const m = letra(5 + NP), ee = letra(6 + NP), rz = letra(7 + NP), ci = letra(8 + NP), cm = letra(9 + NP), ef = letra(10 + NP), em = letra(11 + NP), am = letra(12 + NP);
    ti.getCell(`${m}${row}`).value = { formula: `IF(COUNT(${a})=0,"",AVERAGE(${a}))` };
    ti.getCell(`${ee}${row}`).value = { formula: `IF(COUNT(${a})<2,"",STDEV(${a})/SQRT(COUNT(${a})))` };
    ti.getCell(`${rz}${row}`).value = { formula: `IF(OR(${m}${row}="",C${row}="",C${row}=0),"",${m}${row}/C${row})` };
    ti.getCell(`${ci}${row}`).value = { formula: `${tl},8,0)` };
    ti.getCell(`${cm}${row}`).value = { formula: `IFERROR(SUMIFS(${rg("F")},${C},$A${row})/COUNTIFS(${C},$A${row},${rg("F")},">=0"),"")` };
    ti.getCell(`${ef}${row}`).value = { formula: `IF(OR(${cm}${row}="",${cm}${row}=0),"",${ci}${row}/${cm}${row})` };
    ti.getCell(`${em}${row}`).value = { formula: `IFERROR(SUMIFS(${G},${C},$A${row})/COUNTIFS(${C},$A${row},${G},">=0"),"")` };
    ti.getCell(`${am}${row}`).value = { formula: `IFERROR(SUMIFS(${H},${C},$A${row})/COUNTIFS(${C},$A${row},${H},">=0"),"")` };
    for (const col of [m, ee, rz, ef, cm, em, am]) ti.getCell(`${col}${row}`).numFmt = col === rz || col === ef ? "0.00" : "0.0";
  } else {
    for (let c = 3; c <= 12 + NP; c++) gris(ti.getCell(row, c));
  }
  const sq = letra(13 + NP);
  ti.getCell(`${sq}${row}`).value = { formula: `IFERROR(SUMIFS(${rg("J")},${C},$A${row})/COUNTIFS(${C},$A${row},${rg("J")},">=0"),"")` };
  ti.getCell(`${sq}${row}`).numFmt = "0.0";
  for (let c = 1; c <= 13 + NP; c++) { const x = ti.getCell(row, c); x.border = borde; x.alignment = { vertical: "top", wrapText: true, horizontal: c === 2 ? "left" : "center" }; }
  ti.getRow(row).height = 30;
});

wb.worksheets.forEach((w) => { w.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 }; });
await wb.xlsx.writeFile(path.join(SALIDA, "Registro_Medicion_CU2_ComproYa.xlsx"));
console.log(`Escrito docs/usabilidad/Registro_Medicion_CU2_ComproYa.xlsx (${NP} personas, ${TAREAS.length} tareas, ${CASOS.length} casos aplicados)`);
