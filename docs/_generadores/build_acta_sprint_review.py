"""Genera docs/ejecucion/Acta_Sprint_Review_2_ComproYa.docx: acta de la Sprint Review del sprint 2 para que el Product Owner
acepte (o no) el incremento. La prepara el equipo; la decisión, la fecha de la reunión y las firmas las escribe quien participa.

  python build_acta_sprint_review.py

No registra ninguna aceptación: mientras el acta esté en blanco, el KPI «Aceptación del incremento» (docs/ejecucion) sigue «No medible».
Los criterios son los de las historias HU-113 a HU-116 en Jira (consulta del 23-nov-2026).
"""
from __future__ import annotations

from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

SALIDA = Path(__file__).resolve().parent.parent / "ejecucion" / "Acta_Sprint_Review_2_ComproYa.docx"
AZUL = RGBColor(0x16, 0x3D, 0x6D)

CRITERIOS = [
    ("HU-113 · Consultar mis pedidos", "El Cliente digital consulta la lista de sus pedidos con productos, total y estado.", "TEST-012", "S2-PR-05, S2-PS-01"),
    ("HU-113 · Consultar mis pedidos", "Un Cliente digital solo puede ver, cancelar y consultar el comprobante de sus propios pedidos; con la sesión de otro cliente el acceso se rechaza.", "TEST-012", "S2-PI-06, S2-PS-01"),
    ("HU-114 · Consultar ventas", "La lista muestra las ventas (pedidos pagados y vigentes; los cancelados no cuentan) de a 20 por página, con fecha, cliente, productos, total y estado.", "TEST-012", "S2-PR-02, S2-PI-03, S2-PI-04, S2-PS-03"),
    ("HU-114 · Consultar ventas", "Se puede filtrar por fecha (días de Colombia, UTC−5) y por estado, y se muestra el total vendido del periodo.", "TEST-012", "S2-PR-01, S2-PI-03, S2-PI-04, S2-PS-03"),
    ("HU-114 · Consultar ventas", "Solo se accede con la cuenta interna del Coordinador de Canal Digital.", "TEST-012", "S2-PI-03, S2-PI-07"),
    ("HU-115 · Cancelar pedido", "Dado un pedido creado y sin pagar, cuando su dueño lo cancela, el pedido queda Cancelado y sus unidades se liberan en ≤ 5 minutos (RN-07).", "TEST-013", "S2-PI-01, S2-PR-03, S2-PS-02"),
    ("HU-115 · Cancelar pedido", "Si lo intenta otro cliente, o si el pedido ya está pagado, la cancelación se rechaza.", "TEST-013", "S2-PI-02, S2-PI-05, S2-PS-02"),
    ("HU-116 · Ingresar como Coordinador", "Dado alguien sin la sesión de la cuenta interna, o con la sesión de un cliente, el panel /admin pide ingresar y las funciones de administración se rechazan sin cambiar nada.", "TEST-007", "S2-PI-07, S2-PS-03"),
    ("HU-116 · Ingresar como Coordinador", "Ninguna pantalla de la tienda enlaza al panel /admin; se abre solo escribiendo la dirección.", "TEST-007", "S2-PS-03"),
    ("HU-116 · Ingresar como Coordinador", "La sesión interna dura 12 horas y es separada de la del cliente.", "TEST-007", "S2-PR-04, S2-PI-07"),
]


def sombrear(celda, color: str) -> None:
    tc_pr = celda._tc.get_or_add_tcPr()
    sh = OxmlElement("w:shd")
    sh.set(qn("w:val"), "clear")
    sh.set(qn("w:color"), "auto")
    sh.set(qn("w:fill"), color)
    tc_pr.append(sh)


def texto(celda, t: str, negrita: bool = False, tam: float = 9, color: RGBColor | None = None) -> None:
    celda.text = ""
    p = celda.paragraphs[0]
    p.paragraph_format.space_after = Pt(2)
    r = p.add_run(t)
    r.bold = negrita
    r.font.size = Pt(tam)
    r.font.name = "Arial"
    if color:
        r.font.color.rgb = color


def tabla(doc, cabecera: list[str], filas: list[list[str]], anchos_cm: list[float], tam: float = 9):
    t = doc.add_table(rows=1, cols=len(cabecera))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    for i, h in enumerate(cabecera):
        texto(t.rows[0].cells[i], h, negrita=True, tam=tam, color=RGBColor(0xFF, 0xFF, 0xFF))
        sombrear(t.rows[0].cells[i], "163D6D")
    for f in filas:
        cs = t.add_row().cells
        for i, v in enumerate(f):
            texto(cs[i], v, tam=tam)
    for fila in t.rows:
        for i, w in enumerate(anchos_cm):
            fila.cells[i].width = Cm(w)
    return t


def parrafo(doc, t: str, negrita: bool = False, tam: float = 10, antes: float = 0, despues: float = 4, centrado: bool = False):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(antes)
    p.paragraph_format.space_after = Pt(despues)
    if centrado:
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(t)
    r.bold = negrita
    r.font.size = Pt(tam)
    r.font.name = "Arial"
    return p


def titulo(doc, t: str) -> None:
    p = parrafo(doc, t, negrita=True, tam=11, antes=10, despues=4)
    p.runs[0].font.color.rgb = AZUL


def construir() -> None:
    doc = Document()
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Cm(21.59), Cm(27.94)
    sec.left_margin = sec.right_margin = Cm(2)
    sec.top_margin = sec.bottom_margin = Cm(1.8)
    est = doc.styles["Normal"]
    est.font.name = "Arial"
    est.font.size = Pt(10)

    parrafo(doc, "Acta de la Sprint Review del sprint 2", negrita=True, tam=16, centrado=True, despues=2).runs[0].font.color.rgb = AZUL
    parrafo(doc, "ComproYa en Línea — Canal de Venta Digital B2C · Ingeniería de Software II · Universidad Central", tam=9, centrado=True, despues=2)
    parrafo(doc, "Documento AC-SR-002 · Preparada el 23/11/2026 · Estado: ☒ Preparada  ☐ Realizada  ☐ Firmada", tam=9, centrado=True, despues=8)

    titulo(doc, "1. Datos de la reunión")
    t = tabla(doc, ["Dato", "Contenido"], [
        ["Sprint", "Sprint 2 · Flujo gerencial (2 al 13 de noviembre de 2026; cerrado en Jira el 17/11/2026)"],
        ["Meta del sprint", "Ingreso del Coordinador de Canal Digital con su cuenta interna por /admin, lista de ventas con filtros por fecha y estado y total vendido, consulta de pedidos del cliente y cancelación antes de pagar."],
        ["Incremento", "Historias HU-113, HU-114, HU-115 y HU-116 (4 de 4 Finalizadas en Jira; 56 horas-persona). Evidencia: Segundo entregable, secciones 5 y 6 y Anexos A y B."],
        ["Product Owner", "Nicolás Santiago Cancimance Pabón"],
        ["Scrum Master", "Duván Camilo Serrano Rojas"],
        ["Fecha y medio de la reunión", "____ / ____ / 2026 · ______________________ (la escribe quien realiza la reunión)"],
    ], [4.2, 13.3])

    titulo(doc, "2. Ruta de demostración")
    for n, paso in enumerate([
        "Cliente digital: abrir «Mis pedidos» y ver los pedidos con su estado, total y siguiente acción permitida.",
        "Cliente digital: cancelar un pedido sin pagar y comprobar que queda Cancelado; comprobar que un pedido pagado no ofrece el botón de cancelar.",
        "Coordinador de Canal Digital: escribir /admin (sin enlace en la tienda), ingresar con la cuenta interna y abrir la lista de ventas.",
        "Coordinador: filtrar por estado y por fecha, ver el total vendido y abrir «Ver envío» de una venta.",
    ], start=1):
        parrafo(doc, f"{n}. {paso}", despues=2)

    titulo(doc, "3. Verificación de los criterios de aceptación")
    parrafo(doc, "El Product Owner marca cada criterio después de verlo funcionar. La prueba y los casos son los que ya pasaron en el segundo entregable (evidencia del 17/11/2026).", tam=9, despues=4)
    tabla(doc, ["Historia", "Criterio de aceptación (Jira)", "Prueba", "Casos", "¿Cumple?"],
          [[h, c, p, k, "☐ Sí   ☐ No"] for h, c, p, k in CRITERIOS], [3.0, 8.2, 1.7, 2.6, 2.0], tam=8)

    titulo(doc, "4. Decisión del Product Owner sobre el incremento")
    parrafo(doc, "☐ Acepta el incremento      ☐ Lo acepta con observaciones      ☐ No lo acepta", despues=4)
    tabla(doc, ["Observaciones, cambios pedidos y acuerdos para el sprint 3"], [["\n\n\n"]], [17.5])
    parrafo(doc, "Si el Product Owner acepta, el KPI «Aceptación del incremento» y «Incrementos conformes con la Definition of Done» del documento de gestión de la ejecución se recalculan con la fecha de esta acta; mientras esté en blanco siguen «No medible» y 0 de 1.", tam=8.5, antes=4, despues=2)

    titulo(doc, "5. Firmas")
    tabla(doc, ["Rol", "Nombre", "Firma y fecha"], [
        ["Product Owner", "Nicolás Santiago Cancimance Pabón", "\n"],
        ["Scrum Master", "Duván Camilo Serrano Rojas", "\n"],
        ["Dirección de ComproYa (si asiste)", "______________________________", "\n"],
    ], [5.2, 6.8, 5.5])
    parrafo(doc, "La fecha de firma la escribe cada firmante el día en que firma. Esta acta no se fecha hacia atrás: la Sprint Review del sprint 2 no se había realizado al cierre del sprint (17/11/2026).", tam=8.5, antes=4, despues=0)

    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(SALIDA))
    print("listo", SALIDA)


if __name__ == "__main__":
    construir()
