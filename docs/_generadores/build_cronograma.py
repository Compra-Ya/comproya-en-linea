"""Genera docs/cronograma/: plan de gestión del cronograma (plantilla 1.4 del docente) y el cronograma en Excel.

Ejecutar desde docs/_generadores con el Python del entorno virtual:  python build_cronograma.py <plantilla.docx>
"""
from __future__ import annotations

import datetime as dt
import sys
from pathlib import Path

import docx
from openpyxl import Workbook
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

import cronograma_graficos as gr
import cronograma_modelo as m
import plantilla as pl

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "cronograma"
FECHA_DOC = "17/11/2026"
PROYECTO = "Aplicación Web de Comercio Electrónico — Venta de Electrodomésticos y Productos de Retail"
ESTADO = "☐ Borrador  ☒ En revisión  ☐ Aprobado"
JIRA = "https://ucentral-team-ihdichmo.atlassian.net/jira/software/projects/SCRUM/boards/1"


ID_ACT = {"G-01": "ACT-01", "G-02": "ACT-02", "G-03": "ACT-03", "G-04": "ACT-04", "G-05": "ACT-05", "G-06": "ACT-06",
          "CIE": "ACT-08"}


def pred_txt(preds: list[str]) -> str:
    out = []
    for x in preds:
        out.append(ID_ACT.get(x, "Inicio S" + x[2:] if x.startswith("IS") else x))
    return ", ".join(out)


def d_txt(x: dt.date) -> str:
    return x.strftime("%d/%m/%Y")


def n1(x: float) -> str:
    return f"{x:.1f}".replace(".", ",")


def fechas(a: m.Actividad) -> tuple[dt.date, dt.date]:
    if a.tipo == "hito":
        ini = m.fecha_inicio(a.es) if a.id.startswith("IS") else m.fecha_fin(a.ef, 0)
        return ini, ini
    return m.fecha_inicio(a.es), m.fecha_fin(a.ef, a.duracion)


# ------------------------------------------------------------------------------ Excel
def construir_excel(ruta: Path) -> None:
    acts = m.modelo()
    por_id = {a.id: a for a in acts}
    wb = Workbook()
    ws = wb.active
    ws.title = "Cronograma"
    azul = PatternFill("solid", fgColor="1F3A8A")
    gris = PatternFill("solid", fgColor="F1F5F9")
    borde = Border(bottom=Side(style="thin", color="E2E8F0"))
    ws["A1"] = "Cronograma del proyecto — ComproYa en Línea"
    ws["A1"].font = Font(name="Arial", size=14, bold=True)
    ws["A2"] = ("Método de la ruta crítica (CPM) sobre días hábiles de un integrante (1 día = 3 horas-persona). "
                "Calendario lunes a viernes; 10 días hábiles por sprint. Rojo: ruta crítica; azul: trabajo; verde: gerencia.")
    ws["A2"].font = Font(name="Arial", size=9, color="64748B")
    cab = ["ID", "Actividad", "Tipo", "Sprint", "Responsable", "Horas", "Duración (días)", "Predecesoras",
           "Inicio", "Fin", "Inicio temprano (día)", "Fin temprano (día)", "Inicio tardío (día)", "Fin tardío (día)",
           "Holgura (días)", "Crítica"]
    fila_cab = 4
    for j, c in enumerate(cab, start=1):
        celda = ws.cell(row=fila_cab, column=j, value=c)
        celda.font = Font(name="Arial", size=9, bold=True, color="FFFFFF")
        celda.fill = azul
        celda.alignment = Alignment(wrap_text=True, vertical="center", horizontal="center")
    dias = m.CALENDARIO[:30]
    col_g0 = len(cab) + 1
    for i, dia in enumerate(dias):
        c = ws.cell(row=fila_cab, column=col_g0 + i, value=dia)
        c.number_format = "dd-mmm"
        c.font = Font(name="Arial", size=8, bold=True, color="FFFFFF")
        c.fill = azul
        c.alignment = Alignment(text_rotation=90, horizontal="center", vertical="center")
        ws.column_dimensions[get_column_letter(col_g0 + i)].width = 3.2
    ws.row_dimensions[fila_cab].height = 46

    # Orden de lectura: inicio, gerencia transversal, y por sprint: hitos, caja de tiempo, historias (6 fases) y cierre
    ids: list[str] = ["INI", "G-01", "G-07"]
    for n in (1, 2, 3):
        ids += [f"IS{n}", f"TB{n}"]
        for h in m.HISTORIAS:
            if h[4] == n:
                ids += [f"{h[0]}-{c}" for c, _ in m.FASES]
        ids.append(f"FS{n}")
        if n == 2:
            ids += ["G-02", "G-03"]
    ids += ["G-04", "G-05", "G-06", "CIE"]
    orden = [por_id[i] for i in ids]
    fila = fila_cab + 1
    primera = fila
    for a in orden:
        ini, fin = fechas(a)
        nombre = {"trabajo": "Trabajo", "hito": "Hito", "timebox": "Caja de tiempo", "gerencia": "Gerencia"}[a.tipo]
        vals = [a.id, a.nombre, nombre, a.sprint or "", a.responsable, a.horas or None, round(a.duracion, 2),
                ", ".join(a.preds), ini, fin, round(a.es, 2), round(a.ef, 2), round(a.ls, 2), round(a.lf, 2),
                round(a.holgura, 2), "Sí" if a.critica else "No"]
        for j, v in enumerate(vals, start=1):
            c = ws.cell(row=fila, column=j, value=v)
            c.font = Font(name="Arial", size=9, bold=a.critica and a.tipo in ("timebox", "hito"),
                          color="B91C1C" if a.critica else "0F172A")
            c.border = borde
            if j in (9, 10):
                c.number_format = "dd/mm/yyyy"
            if j == 2:
                c.alignment = Alignment(wrap_text=False)
        fila += 1
    ultima = fila - 1
    widths = [11, 70, 12, 7, 20, 7, 10, 28, 11, 11, 10, 10, 10, 10, 9, 8]
    for j, w in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(j)].width = w
    ws.freeze_panes = ws.cell(row=fila_cab + 1, column=3)
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.print_title_rows = f"{fila_cab}:{fila_cab}"
    ws.auto_filter.ref = f"A{fila_cab}:{get_column_letter(len(cab))}{ultima}"

    # Barras del diagrama de Gantt con formato condicional
    rango = f"{get_column_letter(col_g0)}{primera}:{get_column_letter(col_g0 + 29)}{ultima}"
    ini_c, fin_c = f"$I{primera}", f"$J{primera}"
    cab_c = f"{get_column_letter(col_g0)}${fila_cab}"
    ws.conditional_formatting.add(rango, FormulaRule(
        formula=[f'AND({cab_c}>={ini_c},{cab_c}<={fin_c},$P{primera}="Sí")'],
        fill=PatternFill("solid", bgColor="DC2626"), stopIfTrue=True))
    ws.conditional_formatting.add(rango, FormulaRule(
        formula=[f'AND({cab_c}>={ini_c},{cab_c}<={fin_c},$C{primera}="Gerencia")'],
        fill=PatternFill("solid", bgColor="16A34A"), stopIfTrue=True))
    ws.conditional_formatting.add(rango, FormulaRule(
        formula=[f'AND({cab_c}>={ini_c},{cab_c}<={fin_c},$C{primera}<>"Hito")'],
        fill=PatternFill("solid", bgColor="2563EB"), stopIfTrue=True))
    ws.conditional_formatting.add(rango, FormulaRule(
        formula=[f'AND({cab_c}={ini_c},$C{primera}="Hito")'],
        fill=PatternFill("solid", bgColor="F59E0B"), stopIfTrue=True))

    # Ruta crítica
    rc = wb.create_sheet("Ruta crítica")
    rc["A1"] = "Ruta crítica del proyecto (holgura 0 frente al fin del proyecto)"
    rc["A1"].font = Font(name="Arial", size=13, bold=True)
    rc.append([])
    rc.append(["ID", "Actividad", "Inicio", "Fin", "Duración (días hábiles)", "Holgura (días)"])
    for c in rc[3]:
        c.font = Font(name="Arial", size=9, bold=True, color="FFFFFF")
        c.fill = azul
    for a in sorted([x for x in acts if x.critica], key=lambda x: (x.es, x.id)):
        ini, fin = fechas(a)
        rc.append([a.id, a.nombre, ini, fin, round(a.duracion, 2), round(a.holgura_proy, 2)])
    for r in rc.iter_rows(min_row=4):
        for c in r:
            c.font = Font(name="Arial", size=9)
            if c.column in (3, 4):
                c.number_format = "dd/mm/yyyy"
    rc.append([])
    rc.append(["", "Rutas de trabajo con menor holgura (dentro de cada sprint)"])
    rc.cell(row=rc.max_row, column=2).font = Font(name="Arial", size=10, bold=True)
    for n in (1, 2, 3):
        hs = [x for x in acts if x.tipo == "trabajo" and x.sprint == n]
        mn = min(hs, key=lambda x: x.holgura)
        rc.append([f"Sprint {n}", f"{mn.historia} ({mn.fase}…) — la historia con menos holgura", "", "", "",
                   round(mn.holgura, 2)])
    rc.column_dimensions["A"].width = 11
    rc.column_dimensions["B"].width = 78
    for col in "CDEF":
        rc.column_dimensions[col].width = 16

    # Resumen
    rs = wb.create_sheet("Resumen y método")
    filas = [
        ("Proyecto", PROYECTO),
        ("Periodo", "19/10/2026 a 27/11/2026 (30 días hábiles; 3 sprints de 2 semanas)"),
        ("Actividades", f"{len(acts)} elementos: {sum(1 for a in acts if a.tipo == 'trabajo')} de trabajo "
                        f"(17 historias × 6 fases), 3 cajas de tiempo, 7 de gerencia y los hitos."),
        ("Horas planificadas", "Sprint 1: 60 h (reconstruidas; no se registraron en Jira) · Sprint 2: 56 h · Sprint 3: 43 h "
                               f"= {sum(a.horas for a in acts if a.tipo == 'trabajo'):g} h-persona"),
        ("Ruta crítica", "Inicio → Sprint 1 → Sprint 2 → Sprint 3 → Cierre (27/11/2026); holgura 0. El trabajo de cada "
                         "sprint cabe dentro de su caja de tiempo con holgura."),
        ("Método", "CPM: pasada hacia adelante y hacia atrás sobre dependencias fin–inicio; la caja de tiempo de cada "
                   "sprint (10 días) y las ventanas del Aula virtual son restricciones de fecha."),
        ("Unidad", "Día hábil de un integrante = 3 horas-persona (supuesto del equipo, Plan de gestión de requisitos)."),
        ("Festivos", "02/11/2026 y 16/11/2026 (Colombia) son el primer día de los sprints 2 y 3: riesgo de capacidad "
                     "(54 h por sprint si no se trabajan)."),
        ("Fuentes", f"Jira (proyecto SCRUM): {JIRA}. Horas por fase de los sprints 2 y 3 tomadas de las subtareas de Jira."),
        ("Limitación", "CPM no nivela recursos: no considera que Nicolás y Duván solo pueden hacer una tarea a la vez."),
    ]
    for k, (a, b) in enumerate(filas, start=1):
        rs.cell(row=k, column=1, value=a).font = Font(name="Arial", size=10, bold=True)
        c = rs.cell(row=k, column=2, value=b)
        c.font = Font(name="Arial", size=10)
        c.alignment = Alignment(wrap_text=True, vertical="top")
    rs.column_dimensions["A"].width = 22
    rs.column_dimensions["B"].width = 120
    ruta.parent.mkdir(parents=True, exist_ok=True)
    wb.save(ruta)


# ------------------------------------------------------------------------------ DOCX
JUSTIF = {
    ("HU-104", "HU-103"): "Las unidades disponibles (RN-03) se calculan con las existencias leídas del ERP.",
    ("HU-103", "HU-107"): "El carrito limita las cantidades por las unidades disponibles de cada producto.",
    ("HU-107", "HU-108"): "Se confirma el pedido a partir de los productos del carrito.",
    ("HU-110", "HU-108"): "Las unidades se reservan en el ERP antes de cobrar (RN-04).",
    ("HU-105", "HU-108"): "El pedido pertenece a un cliente con cuenta e inicio de sesión.",
    ("HU-105", "HU-106"): "El consentimiento se asocia a la cuenta del cliente.",
    ("HU-108", "HU-109"): "El código de descuento se aplica al confirmar el pedido (RN-06).",
    ("HU-104", "HU-110"): "La reserva y la liberación usan la misma interfaz con el ERP (simulada).",
    ("HU-108", "HU-111"): "Se paga un pedido ya confirmado, con sus unidades reservadas.",
    ("HU-110", "HU-111"): "Si el pago falla se liberan las unidades reservadas.",
    ("HU-111", "HU-112"): "El comprobante existe solo después del pago confirmado.",
    ("HU-108", "HU-113"): "La lista muestra los pedidos creados al confirmar.",
    ("HU-105", "HU-113"): "Cada cliente solo ve sus pedidos con su sesión.",
    ("HU-116", "HU-114"): "La lista de ventas solo se muestra con la cuenta interna del Coordinador.",
    ("HU-111", "HU-114"): "Las ventas son los pedidos pagados y vigentes.",
    ("HU-108", "HU-115"): "Solo se cancela un pedido ya creado y no pagado (RN-07).",
    ("HU-110", "HU-115"): "Al cancelar se liberan las unidades por la interfaz con el ERP.",
    ("HU-105", "HU-116"): "La cuenta interna reutiliza el ingreso con sesión de la cuenta digital.",
    ("HU-116", "HU-101"): "Solo el Coordinador autenticado publica productos.",
    ("HU-104", "HU-101"): "El código homologado se valida en el maestro del ERP (RN-01).",
    ("HU-102", "HU-117"): "Se mide el rendimiento de la búsqueda.",
    ("HU-108", "HU-117"): "Se mide el rendimiento de la confirmación del pedido.",
    ("HU-111", "HU-117"): "La prueba con usuarios recorre la compra completa hasta el pago.",
}

CRITERIOS = {
    "HU-101": ("Como Coordinador de Canal Digital, quiero crear y publicar un producto con su código homologado, su precio digital "
               "y sus existencias, para que los clientes lo puedan comprar.", "Producto visible en ≤ 5 minutos; rechazo de código "
               "no homologado y de precio bajo el costo (TEST-001).", "1.1.1"),
    "HU-102": ("Como Cliente digital, quiero buscar por texto o por categoría, para encontrar el producto que quiero comprar.",
               "Búsqueda desde 3 caracteres solo con productos publicados; filtro por categoría (TEST-002).", "1.1.2"),
    "HU-103": ("Como Cliente digital, quiero ver cuántas unidades puedo pedir de un producto, para no pedir lo que no hay.",
               "Existencias 20, umbral 5 y sin reservas → 15 unidades; nunca cifra negativa (TEST-003, RN-03).", "1.1.3"),
    "HU-104": ("Necesidad técnica: leer las existencias y validar los códigos homologados a través de la interfaz con el ERP "
               "(simulada).", "Existencias y códigos solo por la interfaz con el ERP (TEST-004).", "1.1.4"),
    "HU-105": ("Como Cliente digital, quiero crear mi cuenta e ingresar con mi correo, para comprar y ver mis pedidos.",
               "Cuenta con documento y correo únicos, contraseña de 8 o más caracteres; ingreso rechazado con datos "
               "incorrectos (TEST-005).", "1.2.1"),
    "HU-106": ("Como Cliente digital, quiero aceptar o revocar el tratamiento de mis datos y pedir que los supriman, para "
               "controlar mi información.", "Aceptar o revocar en ≤ 2 interacciones; supresión ejecutada en ≤ 72 h "
               "(TEST-006, RN-08).", "1.2.2"),
    "HU-107": ("Como Cliente digital, quiero agregar, cambiar y quitar productos de mi carrito, para armar mi compra antes de pagar.",
               "Máximo 10 unidades por producto; el carrito de invitado se une al de la cuenta (TEST-008).", "1.3.1"),
    "HU-108": ("Como Cliente digital, quiero confirmar mi pedido con mi dirección de envío, para que me lo despachen a mi casa.",
               "Pedido con totales del servidor y unidades reservadas antes del cobro (TEST-009, RN-04).", "1.3.2"),
    "HU-109": ("Como Cliente digital, quiero aplicar un código de descuento a mi pedido, para pagar menos.",
               "El código se redime una sola vez por pedido aunque se reintente (TEST-010, RN-06).", "1.3.3"),
    "HU-110": ("Necesidad técnica: reservar y liberar las unidades de un pedido a través de la interfaz con el ERP (simulada).",
               "Reserva al confirmar; liberación al cancelar o al fallar el pago (TEST-011).", "1.3.4"),
    "HU-111": ("Como Cliente digital, quiero pagar mi pedido con tarjeta en la página de la pasarela, para no entregar mis datos "
               "de tarjeta a la tienda.", "Pedido Pagado en ≤ 60 s con la notificación de la pasarela; solo se guarda el token "
               "(TEST-014, RN-05).", "1.4.1"),
    "HU-112": ("Como Cliente digital, quiero ver el comprobante cuando mi pago se confirme, para tener prueba de mi compra.",
               "El comprobante existe solo tras el pago confirmado y solo para el dueño del pedido (TEST-015).", "1.4.2"),
    "HU-113": ("Como Cliente digital, quiero ver la lista de mis pedidos y su estado, para saber cómo va mi compra.",
               "Pedidos con productos, total y estado; con la sesión de otro cliente el acceso se rechaza (TEST-012).", "1.3.5"),
    "HU-114": ("Como Coordinador de Canal Digital, quiero ver la lista de ventas por fecha y estado con el total vendido, para "
               "saber qué se ha vendido sin armar planillas.", "20 ventas por página, filtros por fecha y estado y total del "
               "periodo; solo con la cuenta interna (TEST-012).", "1.3.5"),
    "HU-115": ("Como Cliente digital, quiero cancelar un pedido que aún no pagué, para liberar lo que reservé.",
               "Pedido propio no pagado queda Cancelado y libera sus unidades en ≤ 5 min; uno pagado o ajeno no (TEST-013, RN-07).",
               "1.3.6"),
    "HU-116": ("Como Coordinador de Canal Digital, quiero ingresar con mi cuenta interna por la dirección /admin, para que solo yo "
               "pueda publicar productos y ver las ventas.", "Sin sesión interna las funciones de administración se rechazan; "
               "ninguna pantalla de la tienda enlaza a /admin (TEST-007).", "1.2.3"),
    "HU-117": ("Necesidad de calidad: medir el rendimiento de la búsqueda y de la confirmación, y aplicar la prueba con usuarios.",
               "Búsqueda P95 ≤ 1,5 s; confirmación P95 ≤ 3 s; 5 participantes con ≥ 80 % de tareas completadas (TEST-016, "
               "TEST-017).", "1.5.3"),
}


def construir_docx(plantilla: Path, destino: Path) -> None:
    acts = m.modelo()
    por_id = {a.id: a for a in acts}
    doc = docx.Document(str(plantilla))
    cuerpo = pl.find_paragraph(doc, "Tiene como objetivo")

    # --- subtítulo con el proyecto (mismo patrón de los planes de alcance)
    marco = pl.find_paragraph(doc, "-- Marco de referencia")
    sub = pl.insert_paragraph_after(marco, f"{PROYECTO}", copy_format_from=cuerpo)
    pl.insert_paragraph_after(sub, "Tiendas ComproYa · Ingeniería de Software II · Universidad Central", copy_format_from=cuerpo)

    # --- 1. Control del documento
    t = pl.find_table(doc, "Identificación")
    pl.fill_pairs(t, [
        PROYECTO,
        "PGC-001 / 1.0",
        "Dirección de ComproYa (CEO, CFO y CTO), Tiendas ComproYa · área de Canal Digital",
        "Duván Camilo Serrano Rojas — responsable del proyecto",
        "Nicolás Santiago Cancimance Pabón",
        "Duván Camilo Serrano Rojas",
        FECHA_DOC,
        ESTADO,
    ])

    # --- 2. Alcance y supuestos
    p = pl.find_paragraph(doc, "[Describir fases, componentes")
    pl.set_paragraph_text(p, (
        "El cronograma cubre el proyecto «" + PROYECTO + "» de Tiendas ComproYa: 3 sprints de dos semanas (del 19-oct al 27-nov de "
        "2026) que construyen los 5 entregables de la EDT (1.1 Catálogo digital, 1.2 Cuenta digital, 1.3 Carrito y pedido, 1.4 Pago "
        "y 1.5 Gerencia del proyecto) mediante 17 historias de usuario (HU-101 a HU-117), cada una dividida en 6 subtareas "
        "(Requerimientos, Modelado, Diseño, Implementación, Pruebas y Entrega): 102 actividades de trabajo. Incluye las entregas "
        "de gerencia del curso (requisitos, cronograma, calidad, ejecución y segundo entregable). Quedan fuera las exclusiones de "
        "la Declaración de alcance: varias sucursales, ERP real, conexión con el POS, mercadeo, tableros, débito bancario, "
        "despacho y rastreo."))
    t = pl.find_table(doc, "Elemento", "Definición del proyecto")
    pl.fill_pairs(t, [
        "Inicio: lunes 19-oct-2026. Fin: viernes 27-nov-2026 (cierre del sprint 3 y del proyecto). Sprint 1: 19-oct a 30-oct "
        "(completado); sprint 2: 02-nov a 13-nov; sprint 3: 16-nov a 27-nov.",
        "Días hábiles de un integrante (1 día = 3 horas-persona, supuesto del equipo) y sprints de dos semanas. Las historias se "
        "estiman en horas-persona, no en puntos de historia.",
        "Lunes a viernes, 3 horas diarias por integrante, 10 días hábiles por sprint (capacidad de 60 horas-persona por sprint con "
        "2 integrantes). Zona horaria de Bogotá (UTC−5). Festivos de Colombia en el periodo: 02-nov y 16-nov, primer día de los "
        "sprints 2 y 3; el plan conserva los 10 días del Plan de gestión de requisitos y los trata como riesgo de capacidad (54 h "
        "por sprint si no se trabajan).",
        "Los dos integrantes participan en los tres sprints; el catálogo inicial se carga con datos de prueba; el Product Owner "
        "representa al Coordinador de Canal Digital en las Sprint Review; cinco participantes externos hacen la prueba de "
        "usabilidad del sprint 3; las horas del sprint 1 no se registraron en Jira y se reconstruyen (60 h).",
        "Fecha límite 27-nov-2026; equipo de dos personas; capacidad de 60 horas-persona por sprint; sin presupuesto monetario; "
        "ERP simulado y pasarela de pagos en modo de prueba; entregas del Aula virtual: requisitos 10-nov, cronograma 18-nov, "
        "calidad, segundo entregable y ejecución 24-nov.",
        "Pasarela de pagos en modo de prueba y su notificación al servidor (HU-111); interfaz con el ERP simulada (HU-104, "
        "HU-110); cinco participantes externos para la prueba con usuarios (HU-117); despliegue en la nube por acordar con la "
        "organización.",
    ])

    # --- 3. Roles
    t = pl.find_table(doc, "Rol", "Responsabilidades relacionadas")
    roles = [
        ("Patrocinador (Dirección de ComproYa: CEO, CFO y CTO)", None,
         "Aprueba la línea base del cronograma, los hitos principales y todo cambio que altere fechas, alcance o presupuesto."),
        ("Director del proyecto (Duván Camilo Serrano Rojas)", None,
         "Ajusta actividades dentro de las holguras y de la capacidad del sprint; escala al patrocinador cuando un hito se "
         "retrasa más de 2 días hábiles."),
        ("Product Owner (Nicolás Santiago Cancimance Pabón)", None,
         "Ordena el Product Backlog (HU-101 a HU-117) y acepta o rechaza el incremento en la Sprint Review."),
        ("Scrum Master (Duván Camilo Serrano Rojas)", None,
         "Facilita los eventos, protege el Sprint Goal y retira bloqueos; no asigna tareas al equipo."),
        ("Developers / equipo técnico (Nicolás y Duván)", None,
         "Estiman en horas, descomponen cada historia en 6 subtareas y deciden cómo hacer el trabajo del sprint."),
        ("Líder técnico / arquitecto (decisión del equipo)", None,
         "Recomienda sobre dependencias técnicas; la arquitectura (NestJS, PostgreSQL, Next.js, interfaces con el ERP y la "
         "pasarela) la decide el equipo."),
        ("Usuarios / cliente (Cliente digital y Coordinador de Canal Digital)", None,
         "Validan los entregables en la Sprint Review y en la prueba con usuarios; aceptan según los criterios de cada historia."),
    ]
    for i, (rol, _, auto) in enumerate(roles, start=1):
        pl.set_cell(t.rows[i].cells[0], rol)
        pl.set_cell(t.rows[i].cells[2], auto)

    # --- 4. Diccionario de actividades
    t = pl.find_table(doc, "ID", "Actividad / historia")
    filas = [
        ["ACT-01", "Acta de constitución, plan de gestión del alcance y declaración de alcance (EDT 1.5.1)",
         "Acta, plan de alcance, declaración de alcance y EDT", "Documentos aceptados por la Dirección de ComproYa",
         "Nicolás y Duván"],
        ["ACT-02", "Plan de gestión de requisitos (EDT 1.5.2)", "PGR-001 con los anexos 1 a 6 y backlog en Jira",
         "Entregado en el Aula virtual el 10-nov-2026", "Nicolás (PO y analista)"],
        ["ACT-03", "Plan de gestión del cronograma (este documento)", "PGC-001, red del proyecto y cronograma con ruta crítica",
         "Plantilla instanciada; cronograma con ruta crítica y red", "Duván"],
        ["ACT-04", "Plan de gestión de la calidad", "PGQ-001", "Plantilla instanciada con metas, métricas y pruebas", "Duván (QA)"],
        ["ACT-05", "Segundo entregable (segundo sprint)", "Casos de uso, análisis y diseño UML, implementación, pruebas y "
         "usabilidad", "Cada parte trazable a su historia y a sus pruebas", "Nicolás y Duván"],
        ["ACT-06", "Gestión de la ejecución", "PGE-001 con los KPI del segundo entregable y su soporte",
         "KPI de gobernanza, ingeniería y agilidad calculados con fuente", "Duván"],
        ["ACT-07", "Seguimiento y control de sprints (EDT 1.5.3, transversal)", "Tablero de Jira actualizado, Sprint Review y "
         "retrospectiva de cada sprint", "Estado de Jira al día al cierre de cada sprint", "Duván (Scrum Master)"],
        ["ACT-08", "Cierre del proyecto (EDT 1.5.4)", "Acta de cierre y lecciones aprendidas",
         "17 historias verificadas o declaradas pendientes con su motivo", "Nicolás y Duván"],
    ]
    for h in m.HISTORIAS:
        hid, jira, nombre, cu, sprint, resp, *_ = h
        historia, criterio, hoja = CRITERIOS[hid]
        filas.append([hid, f"{historia} (hoja {hoja}, Jira {jira}, sprint {sprint})",
                      f"Incremento: {nombre} ({cu})", criterio, resp])
    pl.fill_table(t, filas)
    pie = pl.paragraph_after_table(
        t, ("Cada historia se divide en 6 subtareas en el orden Requerimientos → Modelado → Diseño → Implementación → Pruebas → "
            "Entrega (102 actividades). El detalle con horas, fechas, predecesoras y holguras está en Cronograma_ComproYa.xlsx, "
            "hoja «Cronograma»."), cuerpo)

    # --- 5. Secuenciación
    p = pl.find_paragraph(doc, "[Definir cómo se identificarán")
    pl.set_paragraph_text(p, (
        "Las relaciones lógicas se identifican con cuatro reglas: (1) dentro de una historia las seis fases son dependencias "
        "obligatorias fin–inicio (FS) en el orden Requerimientos → Modelado → Diseño → Implementación → Pruebas → Entrega; "
        "(2) entre historias, la Implementación y las Pruebas de la sucesora no empiezan hasta que termina la Implementación de su "
        "predecesora (dependencia técnica, FS); (3) las historias de un sprint no empiezan antes del inicio del sprint y el sprint "
        "termina con su caja de tiempo y su Sprint Review (restricción de fecha); (4) dependencias externas: pasarela de pagos en "
        "modo de prueba (HU-111), interfaz con el ERP simulada (HU-104, HU-110) y cinco participantes externos (HU-117)."))
    t = pl.find_table(doc, "ID origen")
    nombres = {h[0]: h[2].split(" (")[0] for h in m.HISTORIAS}
    filas = []
    for h in m.HISTORIAS:
        for pr in h[7]:
            filas.append([pr, nombres[pr], h[0], nombres[h[0]], "☒ FS ☐ SS ☐ FF ☐ SF",
                          "Entre Implementaciones. " + JUSTIF[(pr, h[0])]])
    filas.append(["FS1 / FS2 / FS3", "Fin del sprint (Sprint Review y retrospectiva)", "IS2 / IS3", "Inicio del sprint siguiente",
                  "☒ FS", "Cada sprint empieza cuando termina el anterior; el trabajo debe caber en la caja de tiempo."])
    pl.fill_table(t, filas)
    anexar = pl.find_paragraph(doc, "Anexar Red del Proyecto")
    pl.set_paragraph_text(anexar, "Anexo B. Red del Proyecto (historias de usuario, dependencias, sprints y ruta crítica)")
    pl.picture_after_paragraph(anexar, SALIDA / "img" / "Red_del_Proyecto_ComproYa.png", 17.8)

    # --- 6. Estimación de recursos y duración
    p = pl.find_paragraph(doc, "[Describir las técnicas, datos históricos")
    pl.set_paragraph_text(p, (
        "Se estima por juicio experto del equipo y por analogía. Unidad: horas-persona; la duración en días hábiles resulta de "
        "dividir las horas entre 3 horas diarias de un integrante, y se separa de la duración calendario, que fija la caja de tiempo "
        "del sprint (10 días hábiles). Datos históricos: las subtareas de los sprints 2 y 3 en Jira traen sus horas (99 h); el "
        "sprint 1 no las registró y se reconstruyó repartiendo 60 h entre sus 11 historias según un peso relativo (1 a 3) y el "
        "perfil de fases de los sprints 2 y 3. No hay datos históricos para calibrar un rango: la precisión se mide al cierre de "
        "cada sprint (KPI de precisión de estimaciones)."))
    t = pl.find_table(doc, "Tipo de trabajo")
    fase_h = {c: sum(a.horas for a in acts if a.tipo == "trabajo" and a.fase == c) for c, _ in m.FASES}
    total_h = sum(fase_h.values())
    filas = [
        ["Análisis y requisitos (Requerimientos y Modelado)", "Juicio experto del equipo; analogía entre historias",
         "Horas-persona", "Sin rango calibrado; se mide al cierre del sprint",
         f"{n1(fase_h['RQ'] + fase_h['MO'])} h de {n1(total_h)} h; subtareas de Jira (sprints 2 y 3)"],
        ["Diseño y arquitectura", "Juicio experto del equipo", "Horas-persona", "Sin rango calibrado",
         f"{n1(fase_h['DI'])} h; subtareas de Jira"],
        ["Construcción", "Juicio experto por historia; analogía con historias de tamaño parecido", "Horas-persona",
         "Sin rango calibrado", f"{n1(fase_h['IM'])} h; sin velocidad histórica (no hay puntos de historia)"],
        ["Pruebas y calidad", "Juicio experto; HU-117 incluye 10 h de mediciones y la prueba con 5 usuarios", "Horas-persona",
         "Sin rango calibrado", f"{n1(fase_h['PR'])} h; Jira y plan de pruebas (TEST-001 a TEST-017)"],
        ["Despliegue y transición (Entrega)", "Juicio experto", "Horas-persona", "Sin rango calibrado",
         f"{n1(fase_h['EN'])} h; el despliegue en la nube depende de un acuerdo con la organización"],
        ["Gerencia del proyecto (EDT 1.5)", "Duración fijada por la ventana del Aula virtual", "Días hábiles",
         "Ventanas de 5 a 8 días", "Aperturas y cierres de cada entrega académica"],
    ]
    pl.fill_table(t, filas)

    # --- 7.1 Capacidad
    t = pl.find_table(doc, "Recurso / rol", "Disponibilidad")
    h_n = {n: sum(a.horas for a in acts if a.tipo == "trabajo" and a.sprint == n and a.responsable == m.NICOLAS) for n in (1, 2, 3)}
    h_d = {n: sum(a.horas for a in acts if a.tipo == "trabajo" and a.sprint == n and a.responsable == m.DUVAN) for n in (1, 2, 3)}
    pl.fill_table(t, [
        ["Nicolás Santiago Cancimance Pabón (Product Owner y desarrollador)", "100 % de 3 h diarias = 30 h por sprint",
         "19-oct a 27-nov-2026", "Festivos 02-nov y 16-nov (−3 h cada uno si no se trabajan)",
         f"Horas planificadas: sprint 1 {n1(h_n[1])} h (reconstruidas), sprint 2 {n1(h_n[2])} h, sprint 3 {n1(h_n[3])} h"],
        ["Duván Camilo Serrano Rojas (Scrum Master, QA y desarrollador)", "100 % de 3 h diarias = 30 h por sprint",
         "19-oct a 27-nov-2026", "Festivos 02-nov y 16-nov (−3 h cada uno si no se trabajan)",
         f"Horas planificadas: sprint 1 {n1(h_d[1])} h (reconstruidas), sprint 2 {n1(h_d[2])} h, sprint 3 {n1(h_d[3])} h"],
    ])

    # --- 7.2 Estimación ágil
    t = pl.find_table(doc, "Sprint", "Duración")
    pl.fill_table(t, [
        ["Sprint 1", "2 semanas (10 días hábiles)", "60 h; planificadas 60 h (reconstruidas)", "100 %",
         "Cerrado en Jira el 10-nov-2026 con 11 historias finalizadas; horas reales no registradas por historia"],
        ["Sprint 2", "2 semanas (10 días hábiles)", "60 h; comprometidas 56 h (93 %)", "100 % (90 % si no se trabaja el 02-nov)",
         "Con el festivo la capacidad baja a 54 h y el sprint quedaría sobrecomprometido en 2 h"],
        ["Sprint 3", "2 semanas (10 días hábiles)", "60 h; comprometidas 43 h (72 %)", "100 % (90 % si no se trabaja el 16-nov)",
         "Con el festivo la capacidad baja a 54 h; las 43 h caben"],
    ])

    # --- 8. Desarrollo del cronograma
    p = pl.find_paragraph(doc, "[Indicar herramienta, método de representación")
    gantt = ", ".join(f"HU {x}" for x in ())
    mn = {n: min((a for a in acts if a.tipo == "trabajo" and a.sprint == n), key=lambda a: a.holgura) for n in (1, 2, 3)}
    pl.set_paragraph_text(p, (
        "Herramientas: Cronograma_ComproYa.xlsx (Excel; actividades, método de la ruta crítica, holguras y diagrama de Gantt con "
        "formato condicional) y el tablero de Jira (proyecto SCRUM «Compra Ya»), que lleva el estado de cada historia y subtarea. "
        "Método de representación: diagrama de Gantt (Anexo C) y red del proyecto (Anexo B). Calendario: lunes a viernes, 10 días "
        "hábiles por sprint. Ruta crítica: Inicio → Sprint 1 (10 días) → Sprint 2 (10 días) → Sprint 3 (10 días) → Cierre del "
        "proyecto el 27-nov-2026: 30 días hábiles y holgura 0, porque cada sprint es una caja de tiempo de duración fija. El "
        "trabajo dentro de cada sprint tiene holgura: la historia con menos holgura es "
        f"{mn[1].historia} en el sprint 1 ({n1(mn[1].holgura)} días), {mn[2].historia} en el sprint 2 ({n1(mn[2].holgura)} días) y "
        f"{mn[3].historia} en el sprint 3 ({n1(mn[3].holgura)} días). Buffers: la holgura de las historias y los 2 festivos "
        "(02-nov y 16-nov). Reglas de actualización: el Scrum Master actualiza Jira a diario y recalcula el cronograma al cierre "
        "de cada sprint o cuando cambie una dependencia."))
    t = pl.find_table(doc, "ID", "Actividad / entregable")
    filas = []
    for n in (1, 2, 3):
        a = por_id[f"TB{n}"]
        ini, fin = fechas(a)
        filas.append([f"TB{n}", f"{m.SPRINTS[n]['nombre']} (caja de tiempo) — RUTA CRÍTICA", d_txt(ini), d_txt(fin),
                      f"{int(a.duracion)} días", "Inicio del sprint " + str(n), "Nicolás y Duván"])
        for h in m.HISTORIAS:
            if h[4] != n:
                continue
            fases = [por_id[f"{h[0]}-{c}"] for c, _ in m.FASES]
            es, ef = min(x.es for x in fases), max(x.ef for x in fases)
            horas = sum(x.horas for x in fases)
            preds = ", ".join(h[7]) if h[7] else "Inicio S" + str(n)
            filas.append([h[0], f"{h[2]} ({h[3]})", d_txt(m.fecha_inicio(es)), d_txt(m.fecha_fin(ef, 1)),
                          f"{n1(ef - es)} días ({n1(horas)} h)", preds, h[5]])
        if n == 2:
            for gid, tag in (("G-02", "ACT-02"), ("G-03", "ACT-03")):
                g = por_id[gid]
                ini, fin = fechas(g)
                filas.append([tag, g.nombre.split(" — ")[0], d_txt(ini), d_txt(fin), f"{int(g.duracion)} días", pred_txt(g.preds),
                              "Nicolás y Duván"])
    for gid, tag in (("G-04", "ACT-04"), ("G-05", "ACT-05"), ("G-06", "ACT-06")):
        g = por_id[gid]
        ini, fin = fechas(g)
        filas.append([tag, g.nombre.split(" — ")[0], d_txt(ini), d_txt(fin), f"{int(g.duracion)} días", pred_txt(g.preds),
                      "Nicolás y Duván"])
    filas.append(["ACT-08", "Cierre del proyecto (EDT 1.5.4) — hito", d_txt(dt.date(2026, 11, 27)), d_txt(dt.date(2026, 11, 27)),
                  "0 días", "FS3, ACT-04, ACT-05, ACT-06", "Nicolás y Duván"])
    pl.fill_table(t, filas)
    anexo_c = pl.paragraph_after_table(t, "Anexo C. Diagrama de Gantt con la ruta crítica (rojo)", cuerpo)
    pl.picture_after_paragraph(anexo_c, SALIDA / "img" / "Gantt_ComproYa.png", 17.8)

    # --- 8.1 Hitos
    t = pl.find_table(doc, "ID", "Hito / release")
    pl.fill_table(t, [
        ["H-01", "Plan de gestión de requisitos entregado", "10/11/2026",
         "PGR-001 con los anexos 1 a 6 y el backlog en Jira", "Dirección de ComproYa (patrocinador)"],
        ["H-02", "Cierre del sprint 1 · Flujo de compra", "30/10/2026",
         "11 historias finalizadas en Jira; flujo de compra de extremo a extremo", "Product Owner"],
        ["H-03", "Cierre del sprint 2 · Flujo gerencial", "13/11/2026",
         "HU-113 a HU-116 verificadas con sus pruebas (TEST-007, TEST-012, TEST-013)", "Product Owner"],
        ["H-04", "Entregas de calidad, segundo entregable y ejecución", "24/11/2026",
         "Documentos instanciados con la plantilla y con soporte documental de cada cifra", "Dirección de ComproYa (patrocinador)"],
        ["H-05", "Cierre del sprint 3 y del proyecto", "27/11/2026",
         "HU-101 y HU-117 verificadas; TEST-001 a TEST-017 aprobados; 17 historias verificadas o declaradas pendientes con su "
         "motivo", "Dirección de ComproYa (patrocinador)"],
    ])

    # --- 8.2 Releases y sprints
    t = pl.find_table(doc, "Release")
    pl.fill_table(t, [
        ["R1", "Que el Cliente digital compre con envío y pague con tarjeta en modo de prueba", "S1",
         "Cuenta y consentimiento, búsqueda, unidades disponibles, carrito, pedido con reserva, descuento, pago y comprobante",
         "30/10/2026", "11 historias finalizadas; pruebas del sprint aprobadas"],
        ["R2", "Que el Coordinador de Canal Digital publique productos y consulte ventas; medir la calidad", "S2–S3",
         "Consulta y cancelación de pedidos, ingreso por /admin, lista de ventas, publicación de productos y mediciones de calidad",
         "27/11/2026", "HU-101 y HU-113 a HU-117 verificadas; mediciones TEST-016 y TEST-017 hechas"],
    ])
    t = pl.find_table(doc, "Sprint", "Sprint Goal")
    pl.fill_table(t, [
        ["S1", m.SPRINTS[1]["nombre"] + ": entregar el flujo transaccional de compra del Cliente digital con reserva por la interfaz "
         "simulada con el ERP y pago en modo de prueba", "HU-102 a HU-112", "19/10/2026 – 30/10/2026",
         "Sprint Review del 30/10; Jira cerrado el 10/11"],
        ["S2", m.SPRINTS[2]["nombre"] + ": ingreso del Coordinador por /admin, lista de ventas con filtros y total, consulta de "
         "pedidos y cancelación antes de pagar", "HU-113, HU-114, HU-115, HU-116", "02/11/2026 – 13/11/2026",
         "Sprint Review del 13/11; pruebas TEST-007, TEST-012 y TEST-013"],
        ["S3", m.SPRINTS[3]["nombre"] + ": publicación de productos y mediciones de calidad (rendimiento y prueba con 5 usuarios)",
         "HU-101, HU-117", "16/11/2026 – 27/11/2026", "Sprint Review del 27/11; pruebas TEST-001, TEST-016 y TEST-017"],
    ])

    # --- 9. Seguimiento
    p = pl.find_paragraph(doc, "[Establecer la frecuencia")
    pl.set_paragraph_text(p, (
        "Las fuentes de datos son Jira (estado de historias y subtareas, con sus horas) y este cronograma. El valor planificado "
        "(PV) y el valor ganado (EV) se miden en horas-persona: PV son las horas de las subtareas que debían estar terminadas a la "
        "fecha de corte y EV las horas de las subtareas en estado Finalizado. Se compara el plan con la ejecución en la reunión "
        "semanal y al cierre de cada sprint."))
    t = pl.find_table(doc, "Indicador", "Definición / fórmula")
    pl.fill_table(t, [
        ["Variación del cronograma (SV)", "SV = EV − PV (horas-persona)", "Semanal", "Alerta si SV < −10 % del PV del sprint",
         "Scrum Master"],
        ["Índice de desempeño del cronograma (SPI)", "SPI = EV / PV", "Semanal", "Alerta si SPI < 0,90; escalar si < 0,80",
         "Scrum Master"],
        ["Desviación de hitos", "Fecha real − fecha planificada", "Por hito", "> 2 días hábiles se escala al patrocinador",
         "Director del proyecto"],
        ["Trabajo pendiente del sprint", "Horas de las subtareas no finalizadas respecto al Sprint Backlog", "Diaria",
         "Regla del equipo: revisar el plan si queda más del 50 % a mitad del sprint", "Developers"],
        ["Velocidad", "Horas-persona completadas por sprint (no hay puntos de historia)", "Por sprint",
         "Tendencia, no cuota", "Equipo"],
        ["Predictibilidad de sprint", "Historias completadas / historias comprometidas × 100", "Por sprint",
         "Rango acordado: ≥ 80 %", "Equipo"],
    ])

    corte = pl.paragraph_after_table(t, (
        "**Estado al corte del 17/11/2026 (Jira).** Sprint 1: cerrado en Jira el 10/11 frente al 30/10 planificado (desviación de hito de 11 días calendario, 7 días hábiles). "
        "Sprint 2: el 13/11, fin planificado, Jira tenía 11 de 56 horas finalizadas (SPI = 11/56 = 0,20) y ninguna historia cerrada, sin cambios de estado desde el 10/11; "
        "el 17/11 se cerraron las 16 subtareas restantes con la evidencia del segundo entregable (SPI = 56/56 = 1,00) y se cerró el sprint, con una desviación de 4 días calendario "
        "(2 días hábiles del calendario del plan). Sprint 3: iniciado el 17/11 en Jira, con 0 de 43 horas finalizadas. La causa de la desviación del sprint 2 es que "
        "el tablero no se actualizaba al terminar el trabajo (NC-004 y acción AC-05 del Plan de gestión de la calidad)."), cuerpo)
    # --- 10.1 Revisión y comunicación
    t = pl.find_table(doc, "Actividad / reunión")
    pl.fill_table(t, [
        ["Revisión del cronograma", "Semanal", "Duván (Director y Scrum Master) y Nicolás (Product Owner)",
         "Avance en horas, hitos, dependencias y holguras", "Cronograma_ComproYa.xlsx y tablero de Jira actualizados"],
        ["Daily Scrum", "Diaria, hasta 15 min", "Developers (Nicolás y Duván)",
         "Progreso hacia el Sprint Goal y bloqueos", "Estado de las subtareas en Jira"],
        ["Sprint Review", "Al cierre del sprint (30/10, 13/11 y 27/11)", "Scrum Team y la Dirección de ComproYa",
         "Incremento, criterios de aceptación y pruebas", "Decisiones del Product Owner y ajustes al backlog"],
        ["Retrospectiva", "Al cierre del sprint", "Scrum Team", "Qué mejorar del proceso y del cronograma",
         "Acciones de mejora con responsable"],
    ])

    # --- 11. Desviaciones
    p = pl.find_paragraph(doc, "[Definir cómo se detectan")
    pl.set_paragraph_text(p, (
        "Las desviaciones se detectan con los indicadores de la sección 9 y se registran como solicitud de cambio en el flujo de "
        "11.1. Un cambio que mueve un hito, el alcance o la capacidad se analiza contra la ruta crítica y las holguras antes de "
        "decidirse; las decisiones y su versión quedan en el registro de cambios."))
    t = pl.find_table(doc, "Situación / umbral")
    pl.fill_table(t, [
        ["Retraso de un hito mayor a 2 días hábiles", "Causa, impacto en la ruta crítica y en la entrega",
         "Recuperación con la holgura o replanificación", "Director del proyecto", "Patrocinador (Dirección de ComproYa)"],
        ["La capacidad del sprint cambia (por ejemplo, un festivo)", "Impacto en el Sprint Goal y en las horas comprometidas",
         "Negociar el alcance con el Product Owner y adaptar el plan", "Product Owner y Developers", "Director del proyecto"],
        ["Dependencia externa bloqueada (pasarela, ERP simulado, participantes)", "Impacto y alternativas",
         "Desbloqueo, sustitución o reordenamiento del backlog", "Product Owner", "Director del proyecto"],
        ["Cambio de prioridad", "Valor, riesgo y costo de la demora", "Reordenar el Product Backlog", "Product Owner",
         "Patrocinador si cambia el alcance"],
    ])
    t = pl.find_table(doc, "ID cambio")
    pl.fill_table(t, [
        ["CH-01", "Los 6 sprints de la Declaración de alcance (20-oct) se agrupan en 3 sprints de dos semanas (19-oct a 27-nov) "
         "con 60 h cada uno", "Cronograma y backlog: 17 historias en 3 sprints; la EDT conserva 5 entregables",
         "Registrado; pendiente de ratificar en la Declaración de alcance", "Dirección de ComproYa",
         "Plan de gestión de requisitos PGR-001 v1.0 (10/11/2026); este plan v1.0"],
        ["CH-02", "Festivos del 02-nov y 16-nov caen en el primer día de los sprints 2 y 3", "Capacidad −3 h por integrante por "
         "festivo (−6 h por sprint): el sprint 2 (56 h) quedaría sobrecomprometido en 2 h", "Diferido hasta confirmar si el equipo "
         "trabaja esos días", "Product Owner", "Este plan v1.0 (17/11/2026)"],
    ])

    # --- 12. Herramientas
    t = pl.find_table(doc, "Herramienta / repositorio")
    pl.fill_table(t, [
        ["Jira (proyecto SCRUM «Compra Ya»)", "Product Backlog, sprints, subtareas con horas y seguimiento", "Duván (Scrum Master)",
         JIRA, "Se actualiza a diario; el estado de cada subtarea refleja el trabajo verificado"],
        ["Repositorio documental y de código (GitHub Compra-Ya/comproya-en-linea)", "Actas, planes, versiones y código",
         "Nicolás y Duván", "https://github.com/Compra-Ya/comproya-en-linea (carpeta docs/)",
         "Un commit por cambio, con mensaje que cita la historia o el documento"],
        ["Excel (Cronograma_ComproYa.xlsx)", "Cronograma, ruta crítica y diagrama de Gantt", "Duván",
         "docs/cronograma/Cronograma_ComproYa.xlsx", "Se regenera con el modelo en docs/_generadores al cambiar el plan"],
    ])

    # --- Anexo A (lista de verificación)
    t = pl.find_table(doc, "Verificación", "Sí")
    obs = [
        ("☒", "Lunes a viernes, 10 días hábiles por sprint, horas-persona."),
        ("☒", "Cada historia tiene criterio y prueba (sección 4)."),
        ("☒", "Sección 5 y Anexo B."),
        ("☒", "Sección 6: técnicas y supuestos; sin rango calibrado."),
        ("☒", "Sección 7.1: 30 h por integrante y sprint."),
        ("☐", "La línea base está en revisión; falta la aprobación de la Dirección de ComproYa."),
        ("☒", "Sección 9."),
        ("☒", "Sección 11."),
        ("☒", "Sección 12."),
    ]
    for i, (marca, texto) in enumerate(obs, start=1):
        celdas = t.rows[i].cells
        pl.set_cell(celdas[1], marca)
        pl.set_cell(celdas[2], "☐" if marca == "☒" else "☒")
        pl.set_cell(celdas[3], "☐")
        pl.set_cell(celdas[4], texto)

    destino.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(destino))


if __name__ == "__main__":
    plantilla = Path(sys.argv[1])
    gr.dibujar_red(SALIDA / "img" / "Red_del_Proyecto_ComproYa.png")
    gr.dibujar_gantt(SALIDA / "img" / "Gantt_ComproYa.png")
    construir_excel(SALIDA / "Cronograma_ComproYa.xlsx")
    construir_docx(plantilla, SALIDA / "Plan_Gestion_Cronograma_ComproYa.docx")
    print("listo:", SALIDA)
