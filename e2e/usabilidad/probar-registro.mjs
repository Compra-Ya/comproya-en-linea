// Prueba las fórmulas del Excel de registro: escribe datos de ejemplo de cinco personas en «Registro» (una cumple todo, otras
// fallan casos concretos y una tiene datos parciales), evalúa las fórmulas con HyperFormula (otro motor distinto de Excel) y
// compara con el cálculo esperado, hecho aparte en JavaScript. No modifica el archivo.
// Requiere `npm install --no-save hyperformula`.   cd e2e && node usabilidad/probar-registro.mjs
import ExcelJS from "exceljs";
import { HyperFormula } from "hyperformula";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { CASOS, PARTICIPANTES, TAREAS } from "./sesion.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const LB = JSON.parse(readFileSync(path.join(AQUI, "linea-base.json"), "utf8"));
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(path.resolve(AQUI, "../../docs/usabilidad/Registro_Medicion_CU2_ComproYa.xlsx"));
const re = wb.getWorksheet("Registro");
const NT = TAREAS.length;
const fila = (pi, n) => 5 + pi * (NT + 1) + TAREAS.findIndex((t) => t.n === n);
const BAS = new Set(["T2", "T3", "T4"]);
const obj = (t) => { const x = Math.ceil((LB.tareas[t.ref].referenciaExpertoS * 3) / 5) * 5; return BAS.has(t.n) ? Math.min(x, 180) : x; };
const tarea = (n) => TAREAS.find((t) => t.n === n);

// ---- datos de ejemplo: d[pi][n] = { E, F, G, H, I, J }
const d = PARTICIPANTES.map(() => ({}));
const bueno = (pi) => {
  for (const t of TAREAS) {
    if (t.tipo === "hacer") d[pi][t.n] = { E: Math.floor(obj(t) / 2), F: LB.tareas[t.ref].clics + 1, G: 0, H: 0, I: "Sí", J: 6 };
    else d[pi][t.n] = { I: "Sí", ...(t.seq ? { J: 5 } : {}) };
  }
};
[0, 1, 2, 3].forEach(bueno);
d[1]["T1"].I = "No";                    // P02: no entendió la primera pantalla (caso 1)
d[1]["T6"].E = obj(tarea("T6")) + 20;     // P02: pasó el tiempo objetivo en la compra 1 (caso 3, caso 12 no)
d[1]["T8"].G = 3;                        // P02: 3 errores en la compra 3 (caso 9)
d[2]["T7"].H = 2;                        // P03: 2 ayudas en la compra 2 (casos 5 y 10)
d[2]["T8a"].I = "No";                    // P03: no entendió un estado (caso 7)
d[3]["T3"].E = 200;                      // P04: 200 s en la tarea 3 (caso 8)
d[3]["T10"].I = "No";                    // P04: no logró quitar el descuento (caso 12)
for (const n of ["T1", "T5", "T6a"]) d[4][n] = { I: "Sí" }; // P05: solo respondió las tres primeras preguntas
d[4]["T1"].J = 4; d[4]["T5"].J = 3;

for (const [pi, tareas] of d.entries()) for (const [n, v] of Object.entries(tareas)) for (const [col, val] of Object.entries(v)) re.getCell(`${col}${fila(pi, n)}`).value = val;
re.getCell(`K${fila(0, "T1")}`).value = "Es una tienda para comprar en línea";

// ---- cálculo esperado
const lista = (n) => CASOS.find((c) => c.n === n).tareas;
const todos = (pi, ts, col) => ts.every((n) => d[pi][n]?.[col] !== undefined);
const cuenta = (pi, ts, f) => ts.filter((n) => f(d[pi][n])).length;
function esperado(pi, caso) {
  const ts = lista(caso);
  const v = (x) => ({ v: x, ok: null });
  switch (caso) {
    case 1: case 7: { if (!todos(pi, ts, "I")) return v(null); const x = cuenta(pi, ts, (r) => r.I === "Sí") / 3; return { v: x, ok: x >= 0.8 }; }
    case 3: { if (!todos(pi, ts, "I") || !todos(pi, ts, "H") || !todos(pi, ts, "E")) return v(null); const x = cuenta(pi, ts, (r) => r.I === "Sí" && r.H === 0) / 3; return { v: x, ok: x === 1 && ts.every((n) => d[pi][n].E <= obj(tarea(n))) }; }
    case 5: { if (!todos(pi, ts, "H")) return v(null); const x = cuenta(pi, ts, (r) => r.H === 0) / 3; return { v: x, ok: x === 1 }; }
    case 8: { if (!todos(pi, ts, "E")) return v(null); const x = ts.filter((n) => d[pi][n].E <= obj(tarea(n))).length / 3; return { v: x, ok: x === 1 }; }
    case 9: { if (!todos(pi, ts, "G")) return v(null); const x = cuenta(pi, ts, (r) => r.G < 3) / 3; return { v: x, ok: x === 1 }; }
    case 10: { if (!todos(pi, ts, "H")) return v(null); const x = cuenta(pi, ts, (r) => r.H <= 1) / 3; return { v: x, ok: x === 1 }; }
    case 12: { if (!(todos(pi, ts, "E") && todos(pi, ts, "G") && todos(pi, ts, "H") && todos(pi, ts, "I"))) return v(null); const x = ts.filter((n) => d[pi][n].I === "Sí" && d[pi][n].E <= obj(tarea(n)) && d[pi][n].G < 3 && d[pi][n].H <= 1).length / 3; return { v: x, ok: x === 1 }; }
  }
}
const media = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const ee = (a) => Math.sqrt(a.reduce((x, y) => x + (y - media(a)) ** 2, 0) / (a.length - 1)) / Math.sqrt(a.length);

// ---- hojas → HyperFormula
const hojas = {};
wb.eachSheet((h) => {
  const filas = [];
  h.eachRow({ includeEmpty: true }, (row, n) => {
    const arr = [];
    row.eachCell({ includeEmpty: true }, (c, col) => {
      let v = c.value;
      if (v && typeof v === "object" && "formula" in v) v = "=" + v.formula;
      else if (v && typeof v === "object" && "richText" in v) v = v.richText.map((x) => x.text).join("");
      else if (v && typeof v === "object" && "result" in v) v = v.result;
      arr[col - 1] = v ?? null;
    });
    filas[n - 1] = arr;
  });
  hojas[h.name] = filas.map((f) => f ?? []);
});
const hf = HyperFormula.buildFromSheets(hojas, { licenseKey: "gpl-v3", useArrayArithmetic: true });
const val = (hoja, celda) => hf.getCellValue(hf.simpleCellAddressFromString(celda, hf.getSheetId(hoja)));
const L = (n) => { let s = ""; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; };

let n = 0, fallas = 0;
const ver = (nombre, real, esp, tol = 1e-6) => {
  n++;
  const nulo = esp === null || esp === undefined;
  const bien = nulo ? real === "" || real === null : typeof esp === "number" ? typeof real === "number" && Math.abs(real - esp) < tol : real === esp;
  if (!bien) { fallas++; console.log(`FALLA ${nombre}: esperado ${JSON.stringify(esp)}, obtenido ${JSON.stringify(real)}`); }
};
const NP = PARTICIPANTES.length;

// Resultados: por persona y del grupo
CASOS.forEach((c, i) => {
  const r = 5 + i;
  const vs = [], cs = [];
  for (let p = 0; p < NP; p++) {
    const e = esperado(p, c.n);
    ver(`caso ${c.n} P0${p + 1} valor`, val("Resultados", `${L(4 + p)}${r}`), e.v);
    ver(`caso ${c.n} P0${p + 1} cumple`, val("Resultados", `${L(4 + NP + p)}${r}`), e.v === null ? null : e.ok ? "Sí" : "No");
    if (e.v !== null) { vs.push(e.v); cs.push(e.ok); }
  }
  const g = 4 + 2 * NP;
  ver(`caso ${c.n} n`, val("Resultados", `${L(g)}${r}`), vs.length);
  ver(`caso ${c.n} cumplen`, val("Resultados", `${L(g + 1)}${r}`), cs.filter(Boolean).length);
  ver(`caso ${c.n} %`, val("Resultados", `${L(g + 2)}${r}`), vs.length ? cs.filter(Boolean).length / vs.length : null);
  ver(`caso ${c.n} media`, val("Resultados", `${L(g + 3)}${r}`), vs.length ? media(vs) : null);
  ver(`caso ${c.n} EE`, val("Resultados", `${L(g + 4)}${r}`), vs.length >= 2 ? ee(vs) : null);
  ver(`caso ${c.n} grupo`, val("Resultados", `${L(g + 5)}${r}`), vs.length ? (cs.filter(Boolean).length / vs.length >= 0.8 ? "Sí" : "No") : null);
});

// Registro: fórmulas por fila (objetivo, en tiempo, razón, eficiencia)
for (const [pi, n_] of [[1, "T6"], [3, "T3"], [0, "T7"]]) {
  const t = tarea(n_), r = fila(pi, n_), x = d[pi][n_];
  const ref = LB.tareas[t.ref];
  ver(`registro ${n_} objetivo`, val("Registro", `M${r}`), obj(t));
  ver(`registro ${n_} en tiempo`, val("Registro", `N${r}`), x.E <= obj(t) ? "Sí" : "No");
  ver(`registro ${n_} razón`, val("Registro", `O${r}`), x.E / ref.referenciaExpertoS);
  ver(`registro ${n_} eficiencia`, val("Registro", `Q${r}`), ref.clics / x.F);
}
ver("registro: nombre de P01", val("Registro", `B${fila(0, "T1")}`), "Ingrid Katerin Monroy Murcia");

// Tiempos por tarea (tarea 6 y 3)
const principales = TAREAS.filter((t) => t.seq);
for (const n_ of ["T6", "T3"]) {
  const row = 5 + principales.findIndex((t) => t.n === n_);
  const t = tarea(n_);
  const ts = d.map((p) => p[n_]?.E).filter((x) => x !== undefined);
  const cl = d.map((p) => p[n_]?.F).filter((x) => x !== undefined);
  const se = d.map((p) => p[n_]?.J).filter((x) => x !== undefined);
  const m = L(5 + NP);
  ver(`tiempos ${n_} media`, val("Tiempos", `${m}${row}`), media(ts));
  ver(`tiempos ${n_} EE`, val("Tiempos", `${L(6 + NP)}${row}`), ee(ts));
  ver(`tiempos ${n_} razón`, val("Tiempos", `${L(7 + NP)}${row}`), media(ts) / LB.tareas[t.ref].referenciaExpertoS);
  ver(`tiempos ${n_} clics medios`, val("Tiempos", `${L(9 + NP)}${row}`), media(cl));
  ver(`tiempos ${n_} dificultad media`, val("Tiempos", `${L(13 + NP)}${row}`), media(se));
}

// Resumen
const fin = 5 + CASOS.length + 1;
const gruposOk = CASOS.map((c) => { const vs = [], cs = []; for (let p = 0; p < NP; p++) { const e = esperado(p, c.n); if (e.v !== null) { vs.push(e.v); cs.push(e.ok); } } return vs.length ? cs.filter(Boolean).length / vs.length >= 0.8 : null; }).filter((x) => x !== null);
ver("resumen: casos que cumple el grupo", val("Resultados", `D${fin}`), gruposOk.filter(Boolean).length);
ver("resumen: casos evaluados", val("Resultados", `D${fin + 1}`), gruposOk.length);

// resumen legible
console.log("caso | personas | cumplen | % | media | EE | grupo");
CASOS.forEach((c, i) => {
  const r = 5 + i, g = 4 + 2 * NP;
  const f = (k) => { const x = val("Resultados", `${L(g + k)}${r}`); return typeof x === "number" ? x.toFixed(2) : x === "" ? "—" : x; };
  console.log(`${String(c.n).padStart(2)} | ${f(0)} | ${f(1)} | ${f(2)} | ${f(3)} | ${f(4)} | ${f(5)}`);
});

let conError = 0;
for (const nombre of hf.getSheetNames()) {
  const dim = hf.getSheetDimensions(hf.getSheetId(nombre));
  for (let r = 0; r < dim.height; r++) for (let c = 0; c < dim.width; c++) {
    const v = hf.getCellValue({ sheet: hf.getSheetId(nombre), row: r, col: c });
    if (v && typeof v === "object" && "type" in v) { conError++; if (conError <= 8) console.log(`ERROR en ${nombre} fila ${r + 1} col ${c + 1}: ${v.type} ${v.message ?? ""}`); }
  }
}
console.log(`Comprobaciones: ${n}; fallas: ${fallas}; celdas con error de fórmula: ${conError}`);
process.exit(fallas || conError ? 1 : 0);
