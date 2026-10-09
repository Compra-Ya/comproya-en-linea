// Prueba las fórmulas de la hoja de cálculo de los cinco participantes: carga docs/usabilidad/Registro_Medicion_CU2_ComproYa.xlsx,
// escribe datos de ejemplo distintos por persona (uno que cumple todo, otros que fallan casos concretos y uno con datos
// parciales), evalúa todas las fórmulas con HyperFormula (un motor distinto de Excel) y compara con el cálculo esperado, hecho
// aparte en JavaScript a partir de la definición de cada caso. No modifica el archivo.
// Requiere `npm install --no-save hyperformula`.
//
//   cd e2e && node usabilidad/probar-registro.mjs
import ExcelJS from "exceljs";
import { HyperFormula } from "hyperformula";
import path from "path";
import { fileURLToPath } from "url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(path.resolve(AQUI, "../../docs/usabilidad/Registro_Medicion_CU2_ComproYa.xlsx"));
const PART = ["P01", "P02", "P03", "P04", "P05"];
const fila = (id) => 4 + Number(id.slice(1));
const ids = (a, b) => Array.from({ length: Number(b.slice(1)) - Number(a.slice(1)) + 1 }, (_, i) => "T" + String(Number(a.slice(1)) + i).padStart(2, "0"));

// ---------------- datos de ejemplo: datos[participante][tarea] = { I, M, O, P, Q, S, T, U, V }
const datos = Object.fromEntries(PART.map((p) => [p, {}]));
const put = (p, id, v) => (datos[p][id] = { ...(datos[p][id] ?? {}), ...v });
const si = (p, lista) => lista.forEach((id) => put(p, id, { U: "Sí" }));
const obj = (id) => Math.ceil((wb.getWorksheet("P01").getCell(`G${fila(id)}`).value * 3) / 5) * 5;
const buenos = (p) => {
  si(p, [...ids("T01", "T03"), ...ids("T10", "T12"), ...ids("T16", "T18")]);
  for (const id of ids("T07", "T09")) put(p, id, { I: 100, M: 20, O: 0, P: 0, Q: 0, S: 0, T: 0, U: "Sí", V: 6 });
  for (const id of ids("T13", "T15")) put(p, id, { I: 10, M: 4, U: "Sí" });
  for (const id of ids("T19", "T21")) put(p, id, { I: 20, M: 3, U: "Sí" });
  for (const id of ids("T22", "T24")) put(p, id, { I: 60, M: 15, S: 0, U: "Sí" });
  for (const id of ids("T25", "T27")) put(p, id, { I: 20, M: 5, O: 0, P: 0, Q: 0, S: 0, U: "Sí" });
};
for (const p of ["P01", "P02", "P03", "P04"]) buenos(p);
// P02: falla casos 1 (T03 No), 3 (T07 pasa el tiempo objetivo) y 9 (3 errores en T09)
put("P02", "T03", { U: "No" });
put("P02", "T07", { I: obj("T07") + 30 });
put("P02", "T09", { O: 1, P: 1, Q: 1 });
// P03: falla casos 5 (consulta externa en T07), 7 (un estado mal descrito) y 10 (2 ayudas en T08)
put("P03", "T07", { T: 1 });
put("P03", "T18", { U: "No" });
put("P03", "T08", { S: 2 });
// P04: falla casos 8 (T20 supera 180 s), 11 (T23 no acertó) y 12 (3 errores en T27)
put("P04", "T20", { I: 200 });
put("P04", "T23", { U: "No" });
put("P04", "T27", { O: 2, P: 1, Q: 0 });
// P05: solo respondió T01 a T03
si("P05", ids("T01", "T03"));
// SUS: respuestas por participante
const susResp = { P01: Array(10).fill(0).map((_, i) => (i % 2 === 0 ? 5 : 1)), P02: Array(10).fill(4), P03: Array(10).fill(3), P04: Array(10).fill(0).map((_, i) => (i % 2 === 0 ? 4 : 2)), P05: [] };

for (const p of PART) {
  const h = wb.getWorksheet(p);
  for (const [id, v] of Object.entries(datos[p])) for (const [col, val] of Object.entries(v)) h.getCell(`${col}${fila(id)}`).value = val;
}
const su = wb.getWorksheet("SUS");
PART.forEach((p, k) => susResp[p].forEach((v, i) => (su.getCell(5 + i, 3 + k).value = v)));

// ---------------- cálculo esperado (a partir de las definiciones)
const media = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const ee = (a) => Math.sqrt(a.reduce((x, y) => x + (y - media(a)) ** 2, 0) / (a.length - 1)) / Math.sqrt(a.length);
const d = (p, id, k) => datos[p][id]?.[k];
const todos = (p, lista, k) => lista.every((id) => d(p, id, k) !== undefined);
const errTotal = (p, id) => (["O", "P", "Q"].some((k) => d(p, id, k) !== undefined) ? ["O", "P", "Q"].reduce((a, k) => a + (d(p, id, k) ?? 0), 0) : undefined);
function esperado(p, n) {
  const sums = (lista) => (todos(p, lista, "U") ? lista.filter((id) => d(p, id, "U") === "Sí").length / 3 : null);
  const res = (v, ok) => ({ v, ok: v === null ? null : ok });
  switch (n) {
    case 1: { const v = sums(ids("T01", "T03")); return res(v, v >= 0.8); }
    case 2: return { v: "—", ok: "—" }; // caso 2 no aplicado: la hoja muestra «—»
    case 3: { const L = ids("T07", "T09"); const v = sums(L); if (v === null || !todos(p, L, "I")) return res(null); return res(v, v === 1 && L.every((id) => d(p, id, "I") <= obj(id))); }
    case 4: { const v = sums(ids("T10", "T12")); return res(v, v >= 0.8); }
    case 5: { const L = ids("T07", "T09"); if (!todos(p, L, "T")) return res(null); const v = L.filter((id) => d(p, id, "T") === 0).length / 3; return res(v, v === 1 && L.every((id) => d(p, id, "T") === 0)); }
    case 6: { const v = sums(ids("T13", "T15")); return res(v, v === 1); }
    case 7: { const v = sums(ids("T16", "T18")); return res(v, v >= 0.8); }
    case 8: { const L = ids("T19", "T21"); if (!todos(p, L, "I")) return res(null); const v = L.filter((id) => d(p, id, "I") <= 180 && d(p, id, "I") <= obj(id)).length / 3; return res(v, v === 1); }
    case 9: { const L = ids("T07", "T09"); if (L.some((id) => errTotal(p, id) === undefined)) return res(null); const v = L.filter((id) => errTotal(p, id) < 3).length / 3; return res(v, v === 1); }
    case 10: { const L = ids("T07", "T09"); if (!todos(p, L, "S")) return res(null); const v = L.filter((id) => d(p, id, "S") <= 1).length / 3; return res(v, v === 1); }
    case 11: { const v = sums(ids("T22", "T24")); return res(v, v === 1); }
    case 12: { const L = ids("T25", "T27"); if (!todos(p, L, "I") || L.some((id) => errTotal(p, id) === undefined) || !todos(p, L, "S")) return res(null); const v = L.filter((id) => d(p, id, "I") <= obj(id) && errTotal(p, id) < 3 && d(p, id, "S") <= 1).length / 3; return res(v, v === 1); }
  }
}

// ---------------- hoja → HyperFormula
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
const valor = (hoja, celda) => hf.getCellValue(hf.simpleCellAddressFromString(celda, hf.getSheetId(hoja)));
const letra = (n) => String.fromCharCode(64 + n);

let comprobadas = 0, fallas = 0;
const verificar = (nombre, real, esp, tol = 1e-6) => {
  comprobadas++;
  const nulo = esp === null || esp === undefined;
  const bien = nulo ? real === "" || real === null : typeof esp === "number" ? typeof real === "number" && Math.abs(real - esp) < tol : real === esp;
  if (!bien) { fallas++; console.log(`FALLA ${nombre}: esperado ${JSON.stringify(esp)}, obtenido ${JSON.stringify(real)}`); }
};

// Metricas: por persona y del grupo
for (let n = 1; n <= 12; n++) {
  const r = 4 + n;
  const vals = [], cum = [];
  PART.forEach((p, k) => {
    const e = esperado(p, n);
    verificar(`Metricas caso ${n} ${p} valor`, valor("Metricas", `${letra(5 + 2 * k)}${r}`), e.v);
    verificar(`Metricas caso ${n} ${p} cumple`, valor("Metricas", `${letra(6 + 2 * k)}${r}`), e.ok === null ? null : e.ok === "—" ? "—" : e.ok ? "Sí" : "No");
    if (typeof e.v === "number") { vals.push(e.v); cum.push(e.ok); }
  });
  verificar(`Metricas caso ${n} n`, valor("Metricas", `O${r}`), vals.length);
  verificar(`Metricas caso ${n} cumplen`, valor("Metricas", `P${r}`), cum.filter(Boolean).length);
  verificar(`Metricas caso ${n} %`, valor("Metricas", `Q${r}`), vals.length ? cum.filter(Boolean).length / vals.length : null);
  verificar(`Metricas caso ${n} media`, valor("Metricas", `R${r}`), vals.length ? media(vals) : null);
  verificar(`Metricas caso ${n} EE`, valor("Metricas", `S${r}`), vals.length >= 2 ? ee(vals) : null);
  verificar(`Metricas caso ${n} grupo`, valor("Metricas", `T${r}`), vals.length ? (cum.filter(Boolean).length / vals.length >= 0.8 ? "Sí" : "No") : null);
}

// Grupo: estadísticas por tarea (T07, T20, T27) y comparación con el equipo
for (const id of ["T07", "T09", "T20", "T27"]) {
  const r = fila(id);
  const t = PART.map((p) => d(p, id, "I")).filter((x) => x !== undefined);
  const refv = wb.getWorksheet("P01").getCell(`G${r}`).value;
  verificar(`Grupo ${id} media`, valor("Grupo", `L${r}`), media(t));
  verificar(`Grupo ${id} EE`, valor("Grupo", `M${r}`), ee(t));
  verificar(`Grupo ${id} n`, valor("Grupo", `N${r}`), t.length);
  verificar(`Grupo ${id} razón`, valor("Grupo", `O${r}`), media(t) / refv);
  const clics = PART.map((p) => d(p, id, "M")).filter((x) => x !== undefined);
  verificar(`Grupo ${id} clics medios`, valor("Grupo", `Q${r}`), media(clics));
  const ideal = wb.getWorksheet("P01").getCell(`F${r}`).value;
  verificar(`Grupo ${id} eficiencia`, valor("Grupo", `R${r}`), ideal / media(clics));
  const cumplen = PART.filter((p) => d(p, id, "I") !== undefined && d(p, id, "I") <= obj(id)).length;
  verificar(`Grupo ${id} cumplen el tiempo`, valor("Grupo", `U${r}`), `${cumplen} de ${t.length}`);
}
{
  const r = fila("T07");
  const sis = PART.filter((p) => d(p, "T07", "U") === "Sí").length;
  const con = PART.filter((p) => d(p, "T07", "U") !== undefined).length;
  verificar("Grupo T07 completaron", valor("Grupo", `V${r}`), `${sis} de ${con}`);
  verificar("Grupo T07 SEQ medio", valor("Grupo", `W${r}`), 6);
}

// SUS por persona y del grupo
const sus = (resp) => (resp.length === 10 ? resp.reduce((a, v, i) => a + (i % 2 === 0 ? v - 1 : 5 - v), 0) * 2.5 : null);
const susVals = [];
PART.forEach((p, k) => {
  const e = sus(susResp[p]);
  verificar(`SUS ${p}`, valor("SUS", `${letra(8 + k)}16`), e);
  if (e !== null) susVals.push(e);
});
verificar("SUS media", valor("SUS", "M16"), media(susVals));
verificar("SUS error estándar", valor("SUS", "N16"), ee(susVals));


// Resumen del grupo
const resumenFila = (etq) => {
  const dim = hf.getSheetDimensions(hf.getSheetId("Grupo"));
  for (let r = 0; r < dim.height; r++) if (hf.getCellValue({ sheet: hf.getSheetId("Grupo"), row: r, col: 0 }) === etq) return hf.getCellValue({ sheet: hf.getSheetId("Grupo"), row: r, col: 3 });
  return "no encontrada";
};
const gruposOk = []; for (let n = 1; n <= 12; n++) { const v = []; const c = []; PART.forEach((p) => { const e = esperado(p, n); if (typeof e.v === "number") { v.push(e.v); c.push(e.ok); } }); if (v.length) gruposOk.push(c.filter(Boolean).length / v.length >= 0.8); }
verificar("Resumen: participantes con datos", resumenFila("Participantes con datos registrados"), 5);
verificar("Resumen: casos que cumple el grupo", resumenFila("Casos que cumple el grupo"), gruposOk.filter(Boolean).length);
verificar("Resumen: casos evaluados", resumenFila("Casos evaluados"), gruposOk.length);
verificar("Resumen: porcentaje", resumenFila("Porcentaje de casos que cumple el grupo"), gruposOk.filter(Boolean).length / gruposOk.length);
verificar("Resumen: SUS medio", resumenFila("Puntaje SUS medio (0 a 100)"), media(susVals));

// resumen legible de lo que calculó la hoja con los datos de ejemplo
console.log("caso | personas con dato | cumplen | % | media | error estándar | ¿cumple el grupo?");
for (let n = 1; n <= 12; n++) {
  const r = 4 + n;
  const f = (c) => valor("Metricas", `${c}${r}`);
  const num = (x) => (typeof x === "number" ? x.toFixed(2) : x === "" ? "—" : String(x));
  console.log(`${String(n).padStart(2)} | ${f("O")} | ${f("P")} | ${num(f("Q"))} | ${num(f("R"))} | ${num(f("S"))} | ${f("T") || "—"}`);
}
// ninguna celda con error de fórmula
let conError = 0;
for (const nombre of hf.getSheetNames()) {
  const dim = hf.getSheetDimensions(hf.getSheetId(nombre));
  for (let r = 0; r < dim.height; r++) for (let c = 0; c < dim.width; c++) {
    const v = hf.getCellValue({ sheet: hf.getSheetId(nombre), row: r, col: c });
    if (v && typeof v === "object" && "type" in v) { conError++; if (conError <= 8) console.log(`ERROR en ${nombre} fila ${r + 1} col ${c + 1}: ${v.type} ${v.message ?? ""}`); }
  }
}
console.log(`Comprobaciones: ${comprobadas}; fallas: ${fallas}; celdas con error de fórmula: ${conError}`);
process.exit(fallas || conError ? 1 : 0);
