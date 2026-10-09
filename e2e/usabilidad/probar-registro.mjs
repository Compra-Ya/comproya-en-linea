// Prueba las fórmulas de la hoja de cálculo: carga docs/usabilidad/Registro_Medicion_CU2_ComproYa.xlsx, escribe datos de ejemplo de un
// participante imaginario, evalúa todas las fórmulas con HyperFormula (un motor distinto de Excel) y compara con el cálculo esperado
// hecho aparte en JavaScript. No modifica el archivo. Requiere `npm install --no-save hyperformula`.
//
//   cd e2e && node usabilidad/probar-registro.mjs
import ExcelJS from "exceljs";
import { HyperFormula } from "hyperformula";
import path from "path";
import { fileURLToPath } from "url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(path.resolve(AQUI, "../../docs/usabilidad/Registro_Medicion_CU2_ComproYa.xlsx"));

// ---- datos de ejemplo (fila de cada tarea = 4 + número)
const fila = (id) => 4 + Number(id.slice(1));
const ta = wb.getWorksheet("Tareas");
const poner = (id, col, v) => (ta.getCell(`${col}${fila(id)}`).value = v);
const ref = (id) => ta.getCell(`G${fila(id)}`).value; // tiempo de referencia
const obj = (id) => Math.ceil((ref(id) * 3) / 5) * 5; // tiempo objetivo esperado con factor 3 y redondeo 5
for (const id of ["T01", "T02", "T04"]) poner(id, "U", "Sí");
poner("T03", "U", "No");
// compras T07-T09
const compras = { T07: { t: 150, c: 25, n: 1, s: 0, d: 1, a: 0, x: 0, ok: "Sí" }, T08: { t: 100, c: 20, n: 0, s: 0, d: 0, a: 1, x: 0, ok: "Sí" }, T09: { t: 120, c: 19, n: 1, s: 1, d: 1, a: 0, x: 0, ok: "Sí" } };
for (const [id, v] of Object.entries(compras)) { poner(id, "I", v.t); poner(id, "M", v.c); poner(id, "O", v.n); poner(id, "P", v.s); poner(id, "Q", v.d); poner(id, "S", v.a); poner(id, "T", v.x); poner(id, "U", v.ok); poner(id, "V", 6); }
for (const id of ["T10", "T11", "T12"]) poner(id, "U", "Sí");
for (const id of ["T13", "T14", "T15"]) { poner(id, "U", "Sí"); poner(id, "I", 12); poner(id, "M", 5); }
poner("T16", "U", "Sí"); poner("T17", "U", "Sí"); poner("T18", "U", "No");
const basicas = { T19: 20, T20: 15, T21: 40 };
for (const [id, t] of Object.entries(basicas)) { poner(id, "I", t); poner(id, "M", 4); poner(id, "O", 0); poner(id, "P", 0); poner(id, "Q", 0); poner(id, "S", 0); poner(id, "U", "Sí"); }
for (const id of ["T22", "T23", "T24"]) { poner(id, "I", 90); poner(id, "M", 20); poner(id, "S", 0); poner(id, "U", "Sí"); }
const cupon = { T25: { t: 20, e: 1 }, T26: { t: 10, e: 0 }, T27: { t: 60, e: 2 } };
for (const [id, v] of Object.entries(cupon)) { poner(id, "I", v.t); poner(id, "M", 8); poner(id, "O", v.e); poner(id, "P", 0); poner(id, "Q", 0); poner(id, "S", 0); poner(id, "U", "Sí"); }
// íconos: 22 de 26 comprendidos
const ic = wb.getWorksheet("Iconos");
for (let r = 5; r <= 30; r++) ic.getCell(`E${r}`).value = r - 5 < 22 ? 1 : 0;
// SUS: todas 4
const su = wb.getWorksheet("SUS_SEQ");
for (let r = 5; r <= 14; r++) su.getCell(`C${r}`).value = 4;

// ---- hoja → HyperFormula
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
const valor = (hoja, celda) => {
  const id = hf.getSheetId(hoja);
  const ad = hf.simpleCellAddressFromString(celda, id);
  return hf.getCellValue(ad);
};

// ---- esperado, calculado aparte
const media = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const desv = (a) => Math.sqrt(a.reduce((x, y) => x + (y - media(a)) ** 2, 0) / (a.length - 1));
const ee = (a) => desv(a) / Math.sqrt(a.length);
const comp = (n) => 4 + n;
const esperado = {};
const errores = { T07: 2, T08: 0, T09: 3 };
const tiemposCompra = [150, 100, 120];
esperado.G5 = 2 / 3; esperado.H5 = "No"; // caso 1: 2 de 3
esperado.E6 = 22; esperado.G6 = 22 / 26; esperado.H6 = "Sí"; // caso 2
esperado.G7 = 1; esperado.H7 = ["T07", "T08", "T09"].every((id) => compras[id].t <= obj(id)) ? "Sí" : "No"; esperado.I7 = media(tiemposCompra); esperado.J7 = ee(tiemposCompra); // caso 3
esperado.G8 = 1; esperado.H8 = "Sí"; // caso 4
esperado.G9 = 1; esperado.H9 = "Sí"; // caso 5
esperado.G10 = 1; esperado.H10 = "Sí"; // caso 6
esperado.G11 = 2 / 3; esperado.H11 = "No"; // caso 7
esperado.G12 = Object.entries(basicas).every(([id, t]) => t <= 180 && t <= obj(id)) ? 1 : 0; esperado.H12 = esperado.G12 === 1 ? "Sí" : "No"; esperado.I12 = media(Object.values(basicas)); esperado.J12 = ee(Object.values(basicas)); // caso 8
esperado.E13 = 2; esperado.G13 = 2 / 3; esperado.H13 = "No"; esperado.I13 = media(Object.values(errores)); esperado.J13 = ee(Object.values(errores)); // caso 9
esperado.G14 = 1; esperado.H14 = "Sí"; esperado.I14 = media([0, 1, 0]); esperado.J14 = ee([0, 1, 0]); // caso 10
esperado.G15 = 1; esperado.H15 = "Sí"; // caso 11
const okCupon = Object.entries(cupon).every(([id, v]) => v.t <= obj(id) && v.e < 3);
esperado.G16 = okCupon ? 1 : 0; esperado.H16 = okCupon ? "Sí" : "No"; esperado.I16 = media(Object.values(cupon).map((v) => v.t)); esperado.J16 = ee(Object.values(cupon).map((v) => v.t)); // caso 12

let fallas = 0, comprobadas = 0;
for (const [celda, esp] of Object.entries(esperado)) {
  const real = valor("Metricas", celda);
  const bien = typeof esp === "number" ? typeof real === "number" && Math.abs(real - esp) < 1e-6 : real === esp;
  comprobadas++;
  if (!bien) { fallas++; console.log(`FALLA Metricas!${celda}: esperado ${esp}, obtenido ${JSON.stringify(real)}`); }
}
const otras = [
  ["SUS_SEQ", "D16", 50, "SUS con todas las respuestas en 4"],
  ["Tareas", `H${fila("T07")}`, obj("T07"), "tiempo objetivo T07"],
  ["Tareas", `J${fila("T07")}`, 150 - ref("T07"), "Δ T07"],
  ["Tareas", `K${fila("T07")}`, 150 / ref("T07"), "razón T07"],
  ["Tareas", `N${fila("T07")}`, ta.getCell(`F${fila("T07")}`).value / 25, "eficiencia de clics T07"],
  ["Tareas", `R${fila("T07")}`, 2, "errores totales T07"],
  ["Tareas", `L${fila("T07")}`, "Sí", "cumple tiempo T07"],
  ["Iconos", "E34", 22 / 26, "X de íconos"],
  ["Resumen", "B3", Object.entries(esperado).filter(([c, v]) => c.startsWith("H") && v === "Sí").length, "casos que cumplen"],
  ["Resumen", "B4", 12, "casos evaluados"],
];
for (const [h, c, esp, nombre] of otras) {
  const real = valor(h, c);
  const bien = typeof esp === "number" ? typeof real === "number" && Math.abs(real - esp) < 1e-6 : real === esp;
  comprobadas++;
  if (!bien) { fallas++; console.log(`FALLA ${h}!${c} (${nombre}): esperado ${esp}, obtenido ${JSON.stringify(real)}`); }
}
// ninguna celda con error
let conError = 0;
for (const nombre of hf.getSheetNames()) {
  const dim = hf.getSheetDimensions(hf.getSheetId(nombre));
  for (let r = 0; r < dim.height; r++) for (let c = 0; c < dim.width; c++) {
    const v = hf.getCellValue({ sheet: hf.getSheetId(nombre), row: r, col: c });
    if (v && typeof v === "object" && "type" in v) { conError++; console.log(`ERROR en ${nombre} fila ${r + 1} col ${c + 1}: ${v.type} ${v.value ?? ""}`); }
  }
}
console.log(`Comprobaciones: ${comprobadas}; fallas: ${fallas}; celdas con error de fórmula: ${conError}`);
process.exit(fallas || conError ? 1 : 0);
