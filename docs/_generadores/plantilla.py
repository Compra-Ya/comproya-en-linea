"""Utilidades para instanciar las plantillas .docx del docente sin cambiar su estilo.

Se edita el XML de la plantilla (python-docx + lxml): se conservan fuentes, tamaños,
sombreados, encabezados y el orden de las secciones. Solo cambia el texto de los
marcadores entre corchetes y se agregan filas clonando la última fila de cada tabla.

Uso:  python -m venv venv && venv/Scripts/pip install python-docx
"""
from __future__ import annotations

import copy
import re
from pathlib import Path
from typing import Iterable, Sequence

import docx
from docx.shared import Cm
from docx.table import Table, _Cell
from docx.text.paragraph import Paragraph
from docx.oxml.ns import qn

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"


# --------------------------------------------------------------------------- texto
def _split_bold(text: str) -> list[tuple[str, bool]]:
    """Divide 'texto **negrita** texto' en segmentos (texto, es_negrita)."""
    partes = re.split(r"(\*\*[^*]+\*\*)", text)
    out: list[tuple[str, bool]] = []
    for parte in partes:
        if not parte:
            continue
        if parte.startswith("**") and parte.endswith("**"):
            out.append((parte[2:-2], True))
        else:
            out.append((parte, False))
    return out or [("", False)]


def set_paragraph_text(p: Paragraph, text: str) -> None:
    """Reemplaza el texto del párrafo conservando el formato de su primer run."""
    # Algunas celdas de la plantilla envuelven su texto de ejemplo en un control de contenido (w:sdt): se desenvuelve
    # para que su run cuente como el primero (conserva el formato) y el ejemplo no quede junto al texto nuevo.
    for sdt in p._p.findall(qn("w:sdt")):
        contenido = sdt.find(qn("w:sdtContent"))
        if contenido is not None:
            for hijo in list(contenido):
                sdt.addprevious(hijo)
        sdt.getparent().remove(sdt)
    runs = p.runs
    base = runs[0]._r if runs else None
    if base is None:
        p.add_run("")
        base = p.runs[0]._r
    base_copy = copy.deepcopy(base)
    for r in list(p._p.findall(qn("w:r"))):
        p._p.remove(r)
    for fragmento, negrita in _split_bold(text):
        nuevo = copy.deepcopy(base_copy)
        for t in nuevo.findall(qn("w:t")):
            nuevo.remove(t)
        for br in nuevo.findall(qn("w:br")):
            nuevo.remove(br)
        rpr = nuevo.find(qn("w:rPr"))
        if rpr is not None:
            for b in rpr.findall(qn("w:b")) + rpr.findall(qn("w:bCs")):
                rpr.remove(b)
            if negrita:
                rpr.insert(0, rpr.makeelement(qn("w:b"), {}))
        elif negrita:
            rpr = nuevo.makeelement(qn("w:rPr"), {})
            rpr.append(rpr.makeelement(qn("w:b"), {}))
            nuevo.insert(0, rpr)
        t = nuevo.makeelement(qn("w:t"), {})
        t.text = fragmento
        t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
        nuevo.append(t)
        p._p.append(nuevo)


def set_cell(cell: _Cell, text: str) -> None:
    """Escribe texto en una celda; cada '\\n' crea un párrafo con el mismo formato."""
    lineas = str(text).split("\n")
    parrafos = cell.paragraphs
    primero = parrafos[0]
    molde = copy.deepcopy(primero._p)
    for extra in parrafos[1:]:
        extra._p.getparent().remove(extra._p)
    set_paragraph_text(primero, lineas[0])
    anterior = primero._p
    for linea in lineas[1:]:
        nuevo = copy.deepcopy(molde)
        anterior.addnext(nuevo)
        set_paragraph_text(Paragraph(nuevo, primero._parent), linea)
        anterior = nuevo


# --------------------------------------------------------------------------- formato
def limpiar_formato(doc) -> None:
    """Deja el documento legible al exportarlo a PDF con Word.

    Las plantillas del docente (exportadas de Google Docs) traen resaltado blanco en casi todo el texto: sobre las celdas de
    encabezado azules, Word pinta cajas blancas y el texto del encabezado no se lee. También traen resaltado amarillo en las
    viñetas de instrucciones y texto rojo (palabras clave) que, al reemplazar el contenido de una celda, se heredaba a toda la celda.
    Se quitan los resaltados y el rojo de las celdas de tabla; no cambia ningún texto.
    """
    cuerpo = doc.element.body
    for h in list(cuerpo.iter(qn("w:highlight"))):
        h.getparent().remove(h)
    for tc in list(cuerpo.iter(qn("w:tc"))):
        for c in list(tc.iter(qn("w:color"))):
            if c.get(qn("w:val"), "").lower() == "ff0000":
                c.getparent().remove(c)


# --------------------------------------------------------------------------- tablas
def fill_table(table: Table, data: Sequence[Sequence[str]], header_rows: int = 1) -> None:
    """Llena las filas de datos; clona la última fila si faltan y quita las sobrantes."""
    filas = table.rows
    plantilla_tr = copy.deepcopy(filas[-1]._tr)
    necesarias = header_rows + len(data)
    while len(table.rows) > necesarias:
        tr = table.rows[-1]._tr
        tr.getparent().remove(tr)
    while len(table.rows) < necesarias:
        table.rows[-1]._tr.addnext(copy.deepcopy(plantilla_tr))
    for i, fila in enumerate(data):
        celdas = table.rows[header_rows + i].cells
        for j, valor in enumerate(fila):
            if j < len(celdas):
                set_cell(celdas[j], valor)


def fill_pairs(table: Table, valores: Sequence[str], col: int = 1, start: int = 1) -> None:
    """Llena una tabla de dos columnas (campo | valor) fila por fila."""
    for i, v in enumerate(valores):
        set_cell(table.rows[start + i].cells[col], v)


# ------------------------------------------------------------------- búsqueda
def find_paragraph(doc: docx.document.Document, startswith: str) -> Paragraph:
    for p in doc.paragraphs:
        if p.text.strip().startswith(startswith):
            return p
    raise LookupError(f"No se encontró el párrafo que empieza por {startswith!r}")


def find_table(doc: docx.document.Document, first_header: str, second_header: str | None = None) -> Table:
    for t in doc.tables:
        celdas = t.rows[0].cells
        if celdas[0].text.strip().startswith(first_header):
            if second_header is None or (len(celdas) > 1 and celdas[1].text.strip().startswith(second_header)):
                return t
    raise LookupError(f"No se encontró la tabla con encabezado {first_header!r}")


def insert_paragraph_after(p: Paragraph, text: str = "", copy_format_from: Paragraph | None = None) -> Paragraph:
    fuente = copy_format_from or p
    nuevo = copy.deepcopy(fuente._p)
    p._p.addnext(nuevo)
    par = Paragraph(nuevo, p._parent)
    if par.runs:
        set_paragraph_text(par, text)
    else:
        par.add_run(text)
    return par


def insert_picture_after(p: Paragraph, image: Path, width_cm: float) -> Paragraph:
    nuevo = copy.deepcopy(p._p)
    p._p.addnext(nuevo)
    par = Paragraph(nuevo, p._parent)
    for r in list(par._p.findall(qn("w:r"))):
        par._p.remove(r)
    par.add_run().add_picture(str(image), width=Cm(width_cm))
    return par


def add_empty_line_after(p: Paragraph) -> Paragraph:
    nuevo = copy.deepcopy(p._p)
    p._p.addnext(nuevo)
    par = Paragraph(nuevo, p._parent)
    set_paragraph_text(par, "")
    return par


def table_after_heading(doc: docx.document.Document, heading_startswith: str) -> Table:
    """Primera tabla que aparece después del párrafo que empieza por el encabezado dado."""
    body = doc.element.body
    visto = False
    for el in body.iterchildren():
        if el.tag == qn("w:p"):
            texto = "".join(t.text or "" for t in el.iter(qn("w:t"))).strip()
            if texto.startswith(heading_startswith):
                visto = True
        elif el.tag == qn("w:tbl") and visto:
            return Table(el, doc)
    raise LookupError(f"No hay tabla después de {heading_startswith!r}")


def remove_paragraph(p: Paragraph) -> None:
    p._p.getparent().remove(p._p)


def paragraph_after_table(table: Table, text: str, like: Paragraph) -> Paragraph:
    """Inserta un párrafo (con el formato de `like`) justo después de una tabla."""
    nuevo = copy.deepcopy(like._p)
    table._tbl.addnext(nuevo)
    par = Paragraph(nuevo, like._parent)
    set_paragraph_text(par, text)
    return par


def picture_after_paragraph(p: Paragraph, image: Path, width_cm: float) -> Paragraph:
    return insert_picture_after(p, image, width_cm)


def normal_paragraph(doc: docx.document.Document, startswith: str) -> Paragraph:
    """Párrafo de cuerpo (estilo 'normal') que sirve de molde de formato."""
    return find_paragraph(doc, startswith)
