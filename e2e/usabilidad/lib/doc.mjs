// Ayudantes compartidos para armar los documentos Word de la evaluación de usabilidad (docx 9).
import {
  AlignmentType, BorderStyle, Footer, HeadingLevel, LevelFormat, PageNumber, Paragraph, ShadingType, Table, TableCell, TableLayoutType,
  TableRow, TextRun, VerticalAlign, WidthType, PageBreak,
} from "docx";

export const COLOR = { azul: "163D6D", azulClaro: "E8EEF6", naranja: "B9480D", llenar: "FFF6D6", gris: "F2F2F2", linea: "BFC7D1", verde: "E3F4EA", rojo: "FDE8E4" };
export const FUENTE = "Calibri";

// Páginas (DXA; 1440 = 1 pulgada). Carta.
export const VERTICAL = { size: { width: 12240, height: 15840 }, margin: { top: 1300, bottom: 1200, left: 1200, right: 1200 } };
export const ANCHO_V = 12240 - 2400; // 9840
export const ANCHO_H = 15840 - 2000; // 13840
export const HORIZONTAL = { size: { width: 12240, height: 15840, orientation: "landscape" }, margin: { top: 1100, bottom: 1000, left: 1000, right: 1000 } };

// «**negrita**» y «_cursiva_» dentro de un texto.
export function runs(texto, base = {}) {
  const partes = String(texto).split(/(\*\*[^*]+\*\*|_[^_]+_)/g).filter((p) => p !== "");
  return partes.map((p) => {
    if (p.startsWith("**") && p.endsWith("**")) return new TextRun({ text: p.slice(2, -2), bold: true, font: FUENTE, ...base });
    if (p.startsWith("_") && p.endsWith("_") && p.length > 2) return new TextRun({ text: p.slice(1, -1), italics: true, font: FUENTE, ...base });
    return new TextRun({ text: p, font: FUENTE, ...base });
  });
}

export const P = (texto, o = {}) =>
  new Paragraph({
    children: runs(texto, { size: o.tam ?? 21, bold: o.negrita, color: o.color, italics: o.cursiva }),
    alignment: o.alinear ?? AlignmentType.JUSTIFIED,
    spacing: { before: o.antes ?? 0, after: o.despues ?? 120, line: o.interlineado ?? 276 },
    keepNext: o.siguiente,
    indent: o.sangria ? { left: o.sangria } : undefined,
  });
export const PC = (texto, o = {}) => P(texto, { alinear: AlignmentType.CENTER, ...o });
export const SALTO = () => new Paragraph({ children: [new PageBreak()] });
export const VACIO = (despues = 120) => new Paragraph({ children: [], spacing: { after: despues } });

export const H1 = (texto) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: texto, font: FUENTE })], spacing: { before: 280, after: 160 }, keepNext: true });
export const H2 = (texto) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: texto, font: FUENTE })], spacing: { before: 220, after: 120 }, keepNext: true });
export const H3 = (texto) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: texto, font: FUENTE })], spacing: { before: 160, after: 90 }, keepNext: true });

export const VINETAS = (items, o = {}) =>
  items.map((t) => new Paragraph({ numbering: { reference: "vinetas", level: 0 }, children: runs(t, { size: o.tam ?? 21 }), spacing: { after: 70, line: 264 }, alignment: AlignmentType.LEFT }));
export const NUMEROS = (items, ref = "numeros", o = {}) =>
  items.map((t) => new Paragraph({ numbering: { reference: ref, level: 0 }, children: runs(t, { size: o.tam ?? 21 }), spacing: { after: 70, line: 264 }, alignment: AlignmentType.LEFT }));

const borde = { style: BorderStyle.SINGLE, size: 4, color: COLOR.linea };
const bordes = { top: borde, bottom: borde, left: borde, right: borde };

// Celda: contenido = texto o lista de textos (un párrafo por elemento). opciones: ancho, fondo, negrita, color, alinear, span, tam.
export function celda(contenido, o = {}) {
  const lista = Array.isArray(contenido) ? contenido : [contenido ?? ""];
  return new TableCell({
    width: { size: o.ancho, type: WidthType.DXA },
    columnSpan: o.span,
    borders: bordes,
    verticalAlign: o.vAlign ?? VerticalAlign.TOP,
    shading: o.fondo ? { type: ShadingType.CLEAR, fill: o.fondo, color: "auto" } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: lista.map(
      (t) =>
        new Paragraph({
          children: runs(t, { size: o.tam ?? 18, bold: o.negrita, color: o.color }),
          alignment: o.alinear ?? AlignmentType.LEFT,
          spacing: { after: 30, line: 250 },
        }),
    ),
  });
}

// Tabla con encabezado azul. anchos suma el ancho útil. llenar = índices de columna que se sombrean para llenar a mano.
export function tabla(anchos, encabezados, filas, o = {}) {
  const total = anchos.reduce((a, b) => a + b, 0);
  const llenar = new Set(o.llenar ?? []);
  const cab = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: encabezados.map((h, i) => celda(h, { ancho: anchos[i], fondo: COLOR.azul, negrita: true, color: "FFFFFF", tam: o.tamCab ?? 17, alinear: AlignmentType.CENTER, vAlign: VerticalAlign.CENTER })),
  });
  const cuerpo = filas.map(
    (fila, r) =>
      new TableRow({
        cantSplit: o.noPartir ?? true,
        height: o.altoFila ? { value: o.altoFila, rule: "atLeast" } : undefined,
        children: fila.map((c, i) => {
          const esObjeto = c && typeof c === "object" && !Array.isArray(c);
          const contenido = esObjeto ? c.t : c;
          const op = esObjeto ? c : {};
          return celda(contenido, {
            ancho: anchos[i],
            tam: o.tam ?? 18,
            fondo: op.fondo ?? (llenar.has(i) ? COLOR.llenar : o.cebra && r % 2 ? COLOR.gris : undefined),
            negrita: op.negrita ?? (o.primeraNegrita && i === 0),
            alinear: op.alinear ?? (o.centrar?.includes(i) ? AlignmentType.CENTER : AlignmentType.LEFT),
          });
        }),
      }),
  );
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: anchos, layout: TableLayoutType.FIXED, rows: [cab, ...cuerpo] });
}

// Tabla de dos columnas «campo | valor» (valor sombreado si llenar).
export function ficha(filas, anchoCampo, anchoValor, o = {}) {
  return new Table({
    width: { size: anchoCampo + anchoValor, type: WidthType.DXA },
    columnWidths: [anchoCampo, anchoValor],
    layout: TableLayoutType.FIXED,
    rows: filas.map(
      ([campo, valor, llenar]) =>
        new TableRow({
          cantSplit: true,
          height: o.altoFila ? { value: o.altoFila, rule: "atLeast" } : undefined,
          children: [
            celda(campo, { ancho: anchoCampo, fondo: COLOR.azulClaro, negrita: true, tam: o.tam ?? 18 }),
            celda(valor, { ancho: anchoValor, fondo: llenar ? COLOR.llenar : undefined, tam: o.tam ?? 18 }),
          ],
        }),
    ),
  });
}

export const pie = (texto) =>
  new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: COLOR.linea, space: 4 } },
        children: [
          new TextRun({ text: `${texto}  ·  Página `, size: 16, font: FUENTE, color: "666666" }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, font: FUENTE, color: "666666" }),
        ],
      }),
    ],
  });

export const NUMERACIONES = [
  { reference: "vinetas", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
  { reference: "numeros", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 340 } } } }] },
  ...Array.from({ length: 40 }, (_, i) => ({
    reference: `lista${i}`,
    levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 300 } } } }],
  })),
];

export const ESTILOS = {
  default: { document: { run: { font: FUENTE, size: 21 } } },
  paragraphStyles: [
    { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, font: FUENTE, color: COLOR.azul }, paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 0 } },
    { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: FUENTE, color: COLOR.azul }, paragraph: { spacing: { before: 220, after: 120 }, outlineLevel: 1 } },
    { id: "TOC1", name: "toc 1", basedOn: "Normal", next: "Normal", run: { size: 22, font: FUENTE }, paragraph: { spacing: { before: 80, after: 40 } } },
    { id: "TOC2", name: "toc 2", basedOn: "Normal", next: "Normal", run: { size: 20, font: FUENTE }, paragraph: { spacing: { after: 30 }, indent: { left: 360 } } },
    { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 23, bold: true, font: FUENTE, color: COLOR.naranja }, paragraph: { spacing: { before: 160, after: 90 }, outlineLevel: 2 } },
  ],
};

export const fmtSeg = (s) => (s == null ? "—" : `${Number(s).toLocaleString("es-CO", { maximumFractionDigits: 1 })} s`);
