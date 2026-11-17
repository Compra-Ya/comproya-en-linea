"""Genera docs/cronograma/: plan de gestión del cronograma (plantilla 1.4 del docente), cronograma en MS Project (XML) y gráficos.

Es la única entrega de cronograma del proyecto: el Word y el archivo Cronograma_ComproYa.xml salen del mismo modelo (cronograma_modelo.py),
fiel a Jira (36 subtareas con horas en los sprints 2 y 3; el sprint 1 como ventana del sprint).

  python build_cronograma.py <plantilla.docx>
"""
from __future__ import annotations

import datetime as dt
import sys
from pathlib import Path

import docx

import cronograma_criterios as cr
import cronograma_graficos as gr
import cronograma_modelo as m
import cronograma_msproject as xmlp
import plantilla as pl

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "cronograma"
FECHA_DOC = "17/11/2026"
PROYECTO = "Aplicación Web de Comercio Electrónico — Venta de Electrodomésticos y Productos de Retail"
ESTADO = "☐ Borrador  ☒ En revisión  ☐ Aprobado"
JIRA = "https://ucentral-team-ihdichmo.atlassian.net/jira/software/projects/SCRUM/boards/1"
DRIVE = "https://drive.google.com/drive/folders/1OHncXswrctcvNnlASFYxE8_a__SENTlS"
N, D = m.CORTO[m.NICOLAS], m.CORTO[m.DUVAN]


def d_txt(x: dt.date) -> str:
    return x.strftime("%d/%m/%Y")


def n1(x: float) -> str:
    return f"{x:.1f}".replace(".", ",")


def dur_txt(h: float) -> str:
    return f"{n1(h).replace(',0', '')} h ({n1(h / m.HORAS_POR_DIA)} d)" if h else "0 h (hito)"


def fechas(a: m.Actividad) -> tuple[dt.date, dt.date]:
    if a.horas == 0:
        return m.fecha_inicio(a.es), m.fecha_inicio(a.es)
    return m.fecha_inicio(a.es), m.fecha_fin(a.ef)


def construir_docx(plantilla: Path, destino: Path) -> None:
    lista = m.modelo()
    acts = {a.id: a for a in lista}
    tr = [a for a in lista if a.tipo == "trabajo"]
    horas_n = {n: sum(a.horas for a in tr if a.sprint == n and a.responsable == m.NICOLAS) for n in (2, 3)}
    horas_d = {n: sum(a.horas for a in tr if a.sprint == n and a.responsable == m.DUVAN) for n in (2, 3)}
    h_sprint = {n: sum(a.horas for a in tr if a.sprint == n) for n in (2, 3)}
    fase_h = {c: sum(a.horas for a in tr if a.fase == c) for c, _ in m.FASES}
    total_h = sum(fase_h.values())
    doc = docx.Document(str(plantilla))
    cuerpo = pl.find_paragraph(doc, "Tiene como objetivo")

    marco = pl.find_paragraph(doc, "-- Marco de referencia")
    sub = pl.insert_paragraph_after(marco, PROYECTO, copy_format_from=cuerpo)
    pl.insert_paragraph_after(sub, "Tiendas ComproYa · Ingeniería de Software II · Universidad Central", copy_format_from=cuerpo)

    # --- 1. Control del documento
    t = pl.find_table(doc, "Identificación")
    pl.fill_pairs(t, [
        PROYECTO, "PGC-001 / 1.0", "Dirección de ComproYa (CEO, CFO y CTO), Tiendas ComproYa · área de Canal Digital",
        "Duván Camilo Serrano Rojas — responsable del proyecto (el equipo de dos integrantes ejerce la dirección)",
        "Nicolás Santiago Cancimance Pabón", "Duván Camilo Serrano Rojas", FECHA_DOC, ESTADO,
    ])

    # --- 2. Alcance y supuestos
    p = pl.find_paragraph(doc, "[Describir fases, componentes")
    pl.set_paragraph_text(p, (
        "El cronograma cubre el proyecto «" + PROYECTO + "»: 3 sprints de dos semanas (del 19-oct al 27-nov de 2026, 30 días hábiles) que construyen los 5 "
        "entregables de la EDT (1.1 Catálogo digital, 1.2 Cuenta digital, 1.3 Carrito y pedido, 1.4 Pago y 1.5 Gerencia del proyecto) mediante 17 historias "
        "de usuario (HU-101 a HU-117 del Product Backlog de Jira). Las actividades de trabajo son las subtareas que Jira registra: las historias de los "
        "sprints 2 y 3 (HU-113 a HU-117 y HU-101) se dividen en 6 subtareas con sus horas (Modelado, Requerimientos, Diseño, Implementación, Pruebas y Entrega: "
        "36 subtareas, 99 horas-persona); las 11 historias del sprint 1 están finalizadas y sus horas no se registraron, por lo que se planifican como la "
        "ventana del sprint. Se agregan los paquetes de gerencia de la EDT (1.5): acta, plan de trabajo y backlog, seguimiento y cierre. Quedan fuera las "
        "exclusiones de la Declaración de alcance: varias sucursales, ERP real, conexión con el POS, mercadeo, tableros, débito bancario, despacho y rastreo."))
    t = pl.find_table(doc, "Elemento", "Definición del proyecto")
    pl.fill_pairs(t, [
        "Inicio: lunes 19-oct-2026 (Sprint Planning del sprint 1). Fin: viernes 27-nov-2026 (Sprint Review del sprint 3 y cierre). Sprint 1: 19-oct a 30-oct "
        "(completado); sprint 2: 02-nov a 13-nov; sprint 3: 16-nov a 27-nov.",
        "Horas-persona para el esfuerzo y días hábiles para la duración calendario; un día hábil de un integrante equivale a 3 horas-persona y cada sprint dura 10 "
        "días hábiles. No se usan puntos de historia.",
        "Lunes a viernes, 3 horas diarias por integrante (08:00 a 11:00), zona horaria de Bogotá (UTC−5). El 02-nov y el 16-nov son festivos en Colombia y el "
        "primer día de los sprints 2 y 3; el Plan de gestión de requisitos los cuenta como días hábiles (60 h por sprint) y este plan mantiene ese supuesto: si "
        "se descontaran, la capacidad de cada uno bajaría a 54 h.",
        "(1) Los dos integrantes participan en los tres sprints. (2) El Product Owner representa al Coordinador de Canal Digital en las Sprint Review. (3) El "
        "catálogo inicial se carga con datos de prueba. (4) Cinco personas externas hacen la prueba de usabilidad del sprint 3. (5) Cada historia tiene un solo "
        "responsable y una persona hace una historia a la vez. (6) Las horas del sprint 1 no se registraron: no se estiman. (7) El cierre del proyecto (ACT-04) "
        "ocupa 2 días hábiles de ambos integrantes (12 horas-persona): supuesto del equipo, no está en Jira.",
        "Fecha límite 27-nov-2026; equipo de dos personas; 60 horas-persona de capacidad por sprint; sin presupuesto monetario; ERP simulado y pasarela de pagos "
        "en modo de prueba. Entregas del Aula virtual: requisitos 10-nov, cronograma 18-nov, calidad, segundo entregable y ejecución 24-nov.",
        "Pasarela de pagos en modo de prueba y su notificación al servidor (HU-111); interfaz con el ERP simulada (HU-104, HU-110); cinco participantes externos "
        "para la prueba con usuarios (HU-117); aprobación de la Dirección de ComproYa en cada Sprint Review; despliegue en la nube por acordar.",
    ])

    # --- 3. Roles
    t = pl.find_table(doc, "Rol", "Responsabilidades relacionadas")
    roles = [
        ("Patrocinador (Dirección de ComproYa: CEO, CFO y CTO)", "Aprueba la línea base del cronograma, los hitos principales y todo cambio que altere fechas, alcance o presupuesto; "
         "recibe el escalamiento si un hito se retrasa más de 2 días hábiles."),
        ("Director del proyecto (Duván Camilo Serrano Rojas, con Nicolás)", "Ajusta actividades con holgura dentro de ella (4 h en HU-113 y HU-116; 5 h en HU-101) sin escalar."),
        ("Product Owner (Nicolás Santiago Cancimance Pabón)", "Ordena el Product Backlog (HU-101 a HU-117) y acepta o rechaza el incremento en la Sprint Review; si un sprint se atrasa, "
         "difiere la historia de menor prioridad (HU-117, Media)."),
        ("Scrum Master (Duván Camilo Serrano Rojas)", "Facilita los eventos, protege el Sprint Goal y retira bloqueos; no asigna tareas al equipo."),
        ("Developers / equipo técnico (Nicolás y Duván)", "Estiman en horas, descomponen cada historia en 6 subtareas y deciden cómo hacer el trabajo del sprint."),
        ("Líder técnico / arquitecto (rol asumido por los dos Developers)", "Recomienda sobre dependencias técnicas; la arquitectura (NestJS, PostgreSQL, Next.js, interfaces con el ERP y la "
         "pasarela) la decide el equipo."),
        ("Usuarios / cliente (Cliente digital y Coordinador de Canal Digital)", "Validan los entregables en la Sprint Review y en la prueba con usuarios; aceptan según los "
         "criterios de cada historia."),
    ]
    for i, (rol, auto) in enumerate(roles, start=1):
        pl.set_cell(t.rows[i].cells[0], rol)
        pl.set_cell(t.rows[i].cells[2], auto)

    # --- 4. Diccionario
    t = pl.find_table(doc, "ID", "Actividad / historia")
    filas = [
        ["ACT-01", "Acta de constitución: problema, objetivos, alcance inicial y roles (EDT 1.5.1)", "Acta de constitución", "Revisión y aceptación de la Dirección de ComproYa", "Nicolás y Duván"],
        ["ACT-02", "Plan de trabajo y backlog priorizado (EDT 1.5.2): planes de requisitos, alcance, cronograma, calidad y ejecución, declaración de alcance, Product Backlog "
         "y segundo entregable", "Documentos con la plantilla del docente y backlog en Jira", "Entregados en el Aula virtual en sus fechas (10, 18 y 24 de noviembre)", "Nicolás y Duván"],
        ["ACT-03", "Seguimiento y control de sprints (EDT 1.5.3): Sprint Review, matriz de trazabilidad y registro de cambios", "Tablero de Jira al día y acta de cada Sprint Review",
         "Estado de Jira actualizado al cerrar cada subtarea", "Nicolás con Duván (Scrum Master)"],
        ["ACT-04", "Cierre del proyecto (EDT 1.5.4): resultados de pruebas, informe de usabilidad y lista de pendientes", "Informe de cierre",
         "Revisión y aceptación de la Dirección de ComproYa", "Nicolás y Duván"],
    ]
    for h in m.HISTORIAS:
        hid, jira, nombre, cu, sprint, resp, deps = h
        historia, criterio, hoja = cr.CRITERIOS[hid]
        if hid in m.SUBTAREAS:
            b = m.SUBTAREAS[hid][0]
            sub_t = f"subtareas SCRUM-{b} a SCRUM-{b + 5}"
        elif hid in m.S1_CON_SUBTAREAS:
            b = m.S1_CON_SUBTAREAS[hid]
            sub_t = f"subtareas SCRUM-{b} a SCRUM-{b + 5} (sin horas)"
        else:
            sub_t = "sin subtareas en Jira"
        filas.append([hid, f"{historia} (hoja {hoja}, Jira {jira}, sprint {sprint})", f"Incremento: {nombre} ({cu}); {sub_t}", criterio, m.CORTO[resp]])
    pl.fill_table(t, filas)
    pl.paragraph_after_table(t, (
        "Las actividades de trabajo son las subtareas de Jira, identificadas con su clave (SCRUM-nn): HU-101 y HU-113 a HU-117 tienen 6 subtareas con horas (36 "
        "actividades, 99 horas-persona); HU-102 a HU-106 tienen 6 subtareas sin horas y HU-107 a HU-112 no tienen subtareas, por eso las 11 historias del sprint 1 se "
        "planifican como ventana del sprint. La sección 8 lista las 51 actividades con sus fechas, y el archivo Cronograma_ComproYa.xml las trae con sus vínculos."), cuerpo)

    # --- 5. Secuenciación
    p = pl.find_paragraph(doc, "[Definir cómo se identificarán")
    pl.set_paragraph_text(p, (
        "Las relaciones lógicas siguen cuatro reglas. (1) Dentro de cada historia las seis subtareas se encadenan fin–inicio (FS) en el orden de Jira: Modelado, "
        "Requerimientos, Diseño, Implementación, Pruebas y Entrega. (2) Dependencia técnica: la Implementación de una historia no empieza hasta que terminan las "
        "historias de las que depende («Depende de» del Product Backlog); las del sprint 1 ya estaban finalizadas. (3) Dependencia de recurso: cada integrante hace una "
        "historia a la vez (3 horas diarias): Nicolás hace HU-115, HU-114 y HU-101; Duván hace HU-116, HU-113 y HU-117, y la Entrega de una precede al Modelado de la siguiente. "
        "(4) Restricciones de fecha: ninguna historia empieza antes del Sprint Planning de su sprint (19-oct, 02-nov y 16-nov) ni termina después de su Sprint Review "
        "(30-oct, 13-nov y 27-nov). Dependencias externas: pasarela en modo de prueba (HU-111), interfaz simulada con el ERP (HU-104, HU-110) y cinco participantes (HU-117)."))
    t = pl.find_table(doc, "ID origen")
    e = m.id_entrega
    filas = [
        ["SCRUM-nn", "Cada subtarea de una historia", "SCRUM-nn+1", "La siguiente subtarea de la misma historia", "☒ FS ☐ SS ☐ FF ☐ SF", "Secuencia interna de las 36 subtareas: Modelado → Requerimientos → Diseño → Implementación → Pruebas → Entrega."],
        ["HU-108", "Confirmar pedido con envío (sprint 1)", "SCRUM-66", "Implementación de HU-113 Consultar mis pedidos", "☒ FS ☐ SS ☐ FF ☐ SF", "Técnica: la lista muestra pedidos ya confirmados."],
        ["HU-108", "Confirmar pedido con envío (sprint 1)", "SCRUM-78", "Implementación de HU-115 Cancelar pedido", "☒ FS ☐ SS ☐ FF ☐ SF", "Técnica: la cancelación opera sobre pedidos confirmados."],
        ["HU-105", "Crear cuenta e ingresar (sprint 1)", "SCRUM-84", "Implementación de HU-116 Ingresar como Coordinador", "☒ FS ☐ SS ☐ FF ☐ SF", "Técnica: la cuenta interna reutiliza el ingreso con sesión."],
        ["HU-111", "Pagar con tarjeta (sprint 1)", "SCRUM-72", "Implementación de HU-114 Consultar ventas", "☒ FS ☐ SS ☐ FF ☐ SF", "Técnica: las ventas son pedidos pagados."],
        [e("HU-116"), "Entrega de HU-116 Ingresar como Coordinador", "SCRUM-72", "Implementación de HU-114 Consultar ventas", "☒ FS ☐ SS ☐ FF ☐ SF", "Técnica: la lista de ventas solo se muestra con la sesión interna."],
        ["HU-104", "Existencias desde el ERP (sprint 1)", "SCRUM-30", "Implementación de HU-101 Publicar producto", "☒ FS ☐ SS ☐ FF ☐ SF", "Técnica: publicar exige validar el código homologado por la interfaz con el ERP."],
        [e("HU-116"), "Entrega de HU-116 Ingresar como Coordinador", "SCRUM-30", "Implementación de HU-101 Publicar producto", "☒ FS ☐ SS ☐ FF ☐ SF", "Técnica: publicar productos exige la sesión interna."],
        ["HU-111", "Pagar con tarjeta (sprint 1)", "SCRUM-30", "Implementación de HU-101 Publicar producto", "☒ FS ☐ SS ☐ FF ☐ SF", "Técnica: dependencia declarada en el Product Backlog."],
        ["HU-111", "Pagar con tarjeta (sprint 1)", "SCRUM-90", "Implementación de HU-117 Medir calidad", "☒ FS ☐ SS ☐ FF ☐ SF", "Técnica (supuesto del equipo): medir la confirmación y hacer la prueba con usuarios exige la compra y el pago completos."],
        [e("HU-115"), "Entrega de HU-115 Cancelar pedido", "SCRUM-69", "Modelado de HU-114 Consultar ventas", "☒ FS (recurso) ☐ SS ☐ FF ☐ SF", "Nicolás hace HU-115 antes que HU-114: así aprovecha la espera de la sesión interna (HU-116) y cierra sus 30 h del sprint."],
        [e("HU-116"), "Entrega de HU-116 Ingresar como Coordinador", "SCRUM-63", "Modelado de HU-113 Consultar mis pedidos", "☒ FS (recurso) ☐ SS ☐ FF ☐ SF", "Duván hace HU-116 antes que HU-113 porque HU-116 bloquea a HU-114 y a HU-101."],
        [e("HU-114"), "Entrega de HU-114 Consultar ventas", "SCRUM-27", "Modelado de HU-101 Publicar producto", "☒ FS (recurso) ☐ SS ☐ FF ☐ SF", "Mismo responsable (Nicolás) entre el sprint 2 y el sprint 3."],
        [e("HU-113"), "Entrega de HU-113 Consultar mis pedidos", "SCRUM-87", "Modelado de HU-117 Medir calidad", "☒ FS (recurso) ☐ SS ☐ FF ☐ SF", "Mismo responsable (Duván) entre el sprint 2 y el sprint 3."],
        [e("HU-101"), "Entrega de HU-101 Publicar producto", "ACT-04", "Cierre del proyecto", "☒ FS ☐ SS ☐ FF ☐ SF", "El cierre reúne los resultados de ambas historias del sprint 3."],
        [e("HU-117"), "Entrega de HU-117 Medir calidad", "ACT-04", "Cierre del proyecto", "☒ FS ☐ SS ☐ FF ☐ SF", "El cierre necesita los resultados de pruebas y el informe de usabilidad."],
    ]
    pl.fill_table(t, filas)
    anexar = pl.find_paragraph(doc, "Anexar Red del Proyecto")
    pl.set_paragraph_text(anexar, "Anexo B. Red del Proyecto (historias de usuario, dependencias técnicas y de recurso, y ruta crítica)")
    pl.picture_after_paragraph(anexar, SALIDA / "img" / "Red_del_Proyecto_ComproYa.png", 17.8)

    # --- 6. Estimación
    p = pl.find_paragraph(doc, "[Describir las técnicas, datos históricos")
    pl.set_paragraph_text(p, (
        "Se estima por juicio experto del equipo: cada historia se divide en 6 subtareas y las estima el equipo en horas-persona (resolución de 1 hora) al planificar el "
        "sprint. La duración en días hábiles resulta de dividir las horas entre 3 horas diarias de un integrante; por ejemplo, HU-114 requiere 19 horas-persona de "
        "Nicolás, es decir 6,33 días hábiles. Hay 99 horas estimadas en Jira (sprint 2: 56 h; sprint 3: 43 h). No hay datos históricos propios: las horas del sprint 1 no "
        "se registraron y no se reconstruyen, y por eso no se calcula un rango estadístico: la precisión se mide al cierre de cada sprint (KPI de precisión de estimaciones). "
        "La capacidad sin comprometer (4 h en el sprint 2 y 5 h en el sprint 3, sin contar el cierre) es el único margen del plan."))
    t = pl.find_table(doc, "Tipo de trabajo")
    pl.fill_table(t, [
        ["Análisis y requisitos (Modelado y Requerimientos)", "Juicio experto del equipo", "Horas-persona", "1 a 2 h por subtarea; resolución de 1 h",
         f"{n1(fase_h['MO'] + fase_h['RQ'])} h de {n1(total_h)} h; subtareas de Jira de los sprints 2 y 3"],
        ["Diseño y arquitectura", "Juicio experto del equipo", "Horas-persona", "2 a 3 h por subtarea", f"{n1(fase_h['DI'])} h; subtareas de Jira"],
        ["Construcción (Implementación)", "Juicio experto, con 3 h diarias por integrante", "Horas-persona", "4 a 8 h por subtarea",
         f"{n1(fase_h['IM'])} h; subtareas de Jira; capacidad de 30 h por integrante y sprint"],
        ["Pruebas y calidad", "Juicio experto; HU-117 incluye 10 h de mediciones y la prueba con 5 usuarios", "Horas-persona", "2 a 10 h por subtarea",
         f"{n1(fase_h['PR'])} h; subtareas de Jira y criterios TEST-nnn"],
        ["Despliegue y transición (Entrega)", "Juicio experto del equipo", "Horas-persona", "1 a 2 h por subtarea",
         f"{n1(fase_h['EN'])} h; el despliegue en la nube depende de un acuerdo con la organización"],
        ["Cierre del proyecto (ACT-04) y gerencia (ACT-02 y ACT-03)", "Supuesto del equipo (cierre); esfuerzo continuo (gerencia)", "Horas-persona",
         "Cierre: 2 días hábiles de ambos (12 h-persona)", "No están estimadas en Jira; el cierre ocupa los 2 días hábiles que quedan tras HU-117"],
    ])

    # --- 7.1 Capacidad
    t = pl.find_table(doc, "Recurso / rol", "Disponibilidad")
    pl.fill_table(t, [
        ["Nicolás Santiago Cancimance Pabón (Product Owner, analista de requisitos y Developer)", "100 % de 3 h diarias = 30 h por sprint", "19/10/2026 a 27/11/2026",
         "Festivos 02/11 y 16/11 (−3 h cada uno si no se trabajan)",
         f"Comprometido: sprint 2, {n1(horas_n[2])} h (HU-115 y HU-114, 100 %); sprint 3, {n1(horas_n[3])} h de HU-101 más 6 h de cierre = {n1(horas_n[3] + 6)} h ({round(100 * (horas_n[3] + 6) / 30)} %)"],
        ["Duván Camilo Serrano Rojas (Scrum Master, QA y Developer)", "100 % de 3 h diarias = 30 h por sprint", "19/10/2026 a 27/11/2026",
         "Festivos 02/11 y 16/11 (−3 h cada uno si no se trabajan)",
         f"Comprometido: sprint 2, {n1(horas_d[2])} h (HU-116 y HU-113, {round(100 * horas_d[2] / 30)} %); sprint 3, {n1(horas_d[3])} h de HU-117 más 6 h de cierre = {n1(horas_d[3] + 6)} h (100 %)"],
    ])

    # --- 7.2 Estimación ágil
    t = pl.find_table(doc, "Sprint", "Duración")
    pl.fill_table(t, [
        ["Sprint 1", "2 semanas (10 días hábiles)", "60 h; horas comprometidas no registradas", "100 %",
         "Cerrado en Jira el 10/11/2026 con 11 historias finalizadas; las horas no se registraron y no se estiman"],
        ["Sprint 2", "2 semanas (10 días hábiles)", f"60 h; comprometidas {n1(h_sprint[2])} h ({round(100 * h_sprint[2] / 60)} %)", "100 % (90 % si no se trabaja el 02/11)",
         "Con el festivo la capacidad baja a 54 h y el sprint quedaría sobrecomprometido en 2 h"],
        ["Sprint 3", "2 semanas (10 días hábiles)", f"60 h; {n1(h_sprint[3])} h de historias más 12 h de cierre = {n1(h_sprint[3] + 12)} h ({round(100 * (h_sprint[3] + 12) / 60)} %)",
         "100 % (90 % si no se trabaja el 16/11)", "Con el festivo la capacidad baja a 54 h y las 55 h lo sobrecomprometen en 1 h"],
    ])

    # --- 8. Desarrollo del cronograma
    crit = [a for a in lista if a.critica]
    p = pl.find_paragraph(doc, "[Indicar herramienta, método de representación")
    pl.set_paragraph_text(p, (
        "Herramientas: el archivo Cronograma_ComproYa.xml (formato de MS Project, también lo abre ProjectLibre) contiene las 51 actividades con sus vínculos, el calendario "
        "de 3 horas diarias, las restricciones de sprint, los 2 recursos y su asignación, y calcula la ruta crítica; Jira (proyecto «Compra Ya») conserva el Product Backlog, "
        "los sprints y las subtareas con su estado. Se representa con un diagrama de Gantt (Anexo C) y con la red del Anexo B. Calendario: lunes a viernes, 10 días hábiles por "
        "sprint. Ruta crítica: existe y tiene dos tramos, porque cada Sprint Review fija el fin de su sprint: sprint 2, HU-115 → HU-114 de Nicolás (SCRUM-75 a SCRUM-80 y "
        "SCRUM-69 a SCRUM-74, 30 h = 10 días hábiles, del 02/11 al 13/11); sprint 3, HU-117 de Duván con el cierre (SCRUM-87 a SCRUM-92 y ACT-04, 30 h = 10 días hábiles, del "
        f"16/11 al 27/11). Son {len(crit)} actividades con holgura de 0 h. Las demás tienen holgura: HU-116 y HU-113, 4 h; HU-101, 5 h. No hay colchones explícitos: el margen es la "
        "capacidad sin comprometer. Regla de actualización: cada vez que se cierra o reestima una subtarea en Jira se actualiza el archivo y se recalcula la ruta crítica; la línea "
        "base solo cambia con una decisión registrada según la sección 11."))
    t = pl.find_table(doc, "ID", "Actividad / entregable")

    def pred_txt(a: m.Actividad) -> str:
        return ", ".join(a.preds) if a.preds else "—"

    filas = []
    for aid in ("ACT-01", "ACT-02", "ACT-03"):
        a = acts[aid]
        ini, fin = fechas(a)
        filas.append([aid, a.nombre.split(":")[0], d_txt(ini), d_txt(fin), "0 d (hito)" if a.horas == 0 else f"{int(a.horas // 3)} d (esfuerzo continuo)", "—", "Equipo" if aid != "ACT-03" else "Nicolás con Duván"])
    for h in m.HISTORIAS:
        if h[4] == 1:
            a = acts[h[0]]
            ini, fin = fechas(a)
            filas.append([h[0], f"{h[2]} ({h[3]}) — sprint 1, finalizada", d_txt(ini), d_txt(fin), "10 d (ventana del sprint)", "—", m.CORTO[h[5]]])
    for hid in ["HU-115", "HU-114", "HU-116", "HU-113", "HU-117", "HU-101"]:
        base = m.SUBTAREAS[hid][0]
        for k, (cod, fase_n) in enumerate(m.FASES):
            a = acts[f"SCRUM-{base + k}"]
            ini, fin = fechas(a)
            filas.append([a.id, f"{fase_n} · {hid} {m.POR_HU[hid][2].split(' (')[0]}" + (" — CRÍTICA" if a.critica else ""), d_txt(ini), d_txt(fin), dur_txt(a.horas), pred_txt(a), m.CORTO[a.responsable]])
    a4 = acts["ACT-04"]
    ini, fin = fechas(a4)
    filas.append(["ACT-04", "Cierre del proyecto (EDT 1.5.4) — CRÍTICA", d_txt(ini), d_txt(fin), "6 h (2 d) por integrante; 12 h-persona", pred_txt(a4), "Nicolás y Duván"])
    pl.fill_table(t, filas)
    gantt = pl.paragraph_after_table(t, "Anexo C. Diagrama de Gantt con la ruta crítica (rojo)", cuerpo)
    pl.picture_after_paragraph(gantt, SALIDA / "img" / "Gantt_ComproYa.png", 17.8)

    # --- 8.1 Hitos
    t = pl.find_table(doc, "ID", "Hito / release")
    pl.fill_table(t, [
        ["H-01", "Plan de gestión de requisitos entregado", "10/11/2026", "PGR-001 con los anexos 1 a 6 y el backlog en Jira", "Dirección de ComproYa (patrocinador)"],
        ["H-02", "Cierre del sprint 1 · Flujo de compra", "30/10/2026", "11 historias finalizadas; flujo de compra de extremo a extremo con ERP simulado y pasarela en modo de prueba", "Product Owner"],
        ["H-03", "Cierre del sprint 2 · Flujo gerencial", "13/11/2026", "HU-113 a HU-116 verificadas con TEST-007, TEST-012 y TEST-013", "Product Owner"],
        ["H-04", "Entregas de calidad, segundo entregable y ejecución", "24/11/2026", "Documentos instanciados con la plantilla y con soporte documental de cada cifra", "Dirección de ComproYa (patrocinador)"],
        ["H-05", "Cierre del sprint 3 y del proyecto", "27/11/2026", "HU-101 y HU-117 verificadas; TEST-001 a TEST-017 aprobados; 17 historias verificadas o declaradas pendientes con su motivo (ACT-04)", "Dirección de ComproYa (patrocinador)"],
    ])

    # --- 8.2 Releases y sprints
    t = pl.find_table(doc, "Release")
    pl.fill_table(t, [
        ["R1", "Que el Cliente digital compre con envío y pague con tarjeta en modo de prueba, y que el Coordinador consulte ventas", "S1–S2",
         "Flujo de compra (cuenta, consentimiento, búsqueda, unidades, carrito, pedido con reserva, descuento, pago y comprobante) y flujo gerencial (mis pedidos, ventas, cancelación e ingreso interno)",
         "13/11/2026", "15 historias (HU-102 a HU-116) finalizadas; pruebas de los sprints aprobadas"],
        ["R2", "Que el Coordinador de Canal Digital publique productos con el precio bajo control y medir rendimiento y usabilidad", "S3",
         "Publicación de productos (HU-101) y mediciones de calidad (HU-117) con el cierre del proyecto", "27/11/2026",
         "HU-101 y HU-117 verificadas; TEST-016 y TEST-017 hechos; ACT-04 entregado"],
    ])
    t = pl.find_table(doc, "Sprint", "Sprint Goal")
    pl.fill_table(t, [
        ["S1", m.SPRINTS[1]["nombre"] + ": entregar el flujo transaccional de compra del Cliente digital con reserva por la interfaz simulada con el ERP y pago en modo de prueba",
         "HU-102 a HU-112 (11 historias)", "19/10/2026 – 30/10/2026", "Sprint Review del 30/10; Jira cerrado el 10/11"],
        ["S2", m.SPRINTS[2]["nombre"] + ": ingreso del Coordinador por /admin, lista de ventas con filtros y total, consulta de pedidos y cancelación antes de pagar",
         "HU-113, HU-114, HU-115, HU-116 (56 h)", "02/11/2026 – 13/11/2026", "Sprint Review del 13/11; pruebas TEST-007, TEST-012 y TEST-013; Jira cerrado el 17/11"],
        ["S3", m.SPRINTS[3]["nombre"] + ": publicación de productos y mediciones de calidad (rendimiento y prueba con 5 usuarios)",
         "HU-101 y HU-117 (43 h) y ACT-04 (12 h)", "16/11/2026 – 27/11/2026", "Sprint Review del 27/11; pruebas TEST-001, TEST-016 y TEST-017"],
    ])

    # --- 9. Seguimiento
    p = pl.find_paragraph(doc, "[Establecer la frecuencia")
    pl.set_paragraph_text(p, (
        "Las fuentes de datos son Jira (estado y horas de cada subtarea) y el archivo de MS Project. El valor planificado (PV) y el valor ganado (EV) se miden en horas-persona: PV son "
        "las horas de las subtareas que debían estar terminadas a la fecha de corte y EV las de las subtareas en estado Finalizado. Se compara el plan con la ejecución en la reunión "
        "semanal y al cierre de cada sprint."))
    t = pl.find_table(doc, "Indicador", "Definición / fórmula")
    pl.fill_table(t, [
        ["Variación del cronograma (SV)", "SV = EV − PV (horas-persona)", "Semanal", "Alerta si SV < −10 % del PV del sprint", "Scrum Master"],
        ["Índice de desempeño del cronograma (SPI)", "SPI = EV / PV", "Semanal", "Alerta si SPI < 0,90; escalar si < 0,80", "Scrum Master"],
        ["Desviación de hitos", "Fecha real − fecha planificada", "Por hito", "> 2 días hábiles se escala al patrocinador", "Director del proyecto"],
        ["Trabajo pendiente del sprint", "Horas de las subtareas no finalizadas respecto al Sprint Backlog", "Diaria", "Regla del equipo: revisar el plan si queda más del 50 % a mitad del sprint", "Developers"],
        ["Velocidad", "Horas-persona completadas por sprint (no hay puntos de historia)", "Por sprint", "Tendencia, no cuota", "Equipo"],
        ["Predictibilidad de sprint", "Historias completadas / historias comprometidas × 100", "Por sprint", "Rango acordado: ≥ 80 %", "Equipo"],
    ])
    pl.paragraph_after_table(t, (
        "**Estado al corte del 17/11/2026 (Jira).** Sprint 1: cerrado en Jira el 10/11 frente al 30/10 planificado (desviación de hito de 11 días calendario, 7 días hábiles). "
        "Sprint 2: el 13/11, fin planificado, Jira tenía 11 de 56 horas finalizadas (SPI = 11/56 = 0,20) y ninguna historia cerrada, sin cambios de estado desde el 10/11; el 17/11 se "
        "cerraron las 16 subtareas restantes con la evidencia del segundo entregable (SPI = 56/56 = 1,00) y se cerró el sprint, con una desviación de 4 días calendario (2 días hábiles "
        "del calendario del plan). Sprint 3: iniciado el 17/11 en Jira, con 0 de 43 horas finalizadas. La causa de la desviación del sprint 2 es que el tablero no se actualizaba al "
        "terminar el trabajo (NC-004 y acción AC-05 del Plan de gestión de la calidad)."), cuerpo)

    # --- 10.1 Revisión y comunicación
    t = pl.find_table(doc, "Actividad / reunión")
    pl.fill_table(t, [
        ["Revisión del cronograma", "Semanal", "Duván (Director y Scrum Master) y Nicolás (Product Owner)", "Avance en horas, hitos, dependencias y holguras", "Archivo de MS Project y tablero de Jira actualizados"],
        ["Daily Scrum", "Diaria, hasta 15 min", "Developers (Nicolás y Duván)", "Progreso hacia el Sprint Goal y bloqueos", "Estado de las subtareas en Jira"],
        ["Sprint Review", "Al cierre del sprint (30/10, 13/11 y 27/11)", "Scrum Team y la Dirección de ComproYa", "Incremento, criterios de aceptación y pruebas", "Decisiones del Product Owner y ajustes al backlog"],
        ["Retrospectiva", "Al cierre del sprint", "Scrum Team", "Qué mejorar del proceso y del cronograma", "Acciones de mejora con responsable"],
    ])

    # --- 11. Desviaciones
    p = pl.find_paragraph(doc, "[Definir cómo se detectan")
    pl.set_paragraph_text(p, (
        "Las desviaciones se detectan con los indicadores de la sección 9 y se registran como solicitud de cambio en el flujo de 11.1. Un cambio que mueve un hito, el alcance o la "
        "capacidad se analiza contra la ruta crítica y las holguras antes de decidirse; las decisiones y su versión quedan en el registro de cambios."))
    t = pl.find_table(doc, "Situación / umbral")
    pl.fill_table(t, [
        ["Retraso de un hito mayor a 2 días hábiles", "Causa, impacto en la ruta crítica y en la entrega", "Recuperación con la holgura o replanificación", "Director del proyecto", "Patrocinador (Dirección de ComproYa)"],
        ["La capacidad del sprint cambia (por ejemplo, un festivo)", "Impacto en el Sprint Goal y en las horas comprometidas", "Negociar el alcance con el Product Owner y adaptar el plan", "Product Owner y Developers", "Director del proyecto"],
        ["Dependencia externa bloqueada (pasarela, ERP simulado, participantes)", "Impacto y alternativas", "Desbloqueo, sustitución o reordenamiento del backlog", "Product Owner", "Director del proyecto"],
        ["Cambio de prioridad", "Valor, riesgo y costo de la demora", "Reordenar el Product Backlog", "Product Owner", "Patrocinador si cambia el alcance"],
    ])
    t = pl.find_table(doc, "ID cambio")
    pl.fill_table(t, [
        ["CH-01", "Los 6 sprints de la Declaración de alcance (20-oct) se agrupan en 3 sprints de dos semanas (19-oct a 27-nov) con 60 h cada uno",
         "Cronograma y backlog: 17 historias en 3 sprints; la EDT conserva 5 entregables", "Registrado; pendiente de ratificar en la Declaración de alcance",
         "Dirección de ComproYa", "Plan de gestión de requisitos PGR-001 v1.0 (10/11/2026); este plan v1.0"],
        ["CH-02", "Los festivos del 02-nov y 16-nov caen en el primer día de los sprints 2 y 3", "Capacidad −3 h por integrante por festivo (−6 h por sprint): el sprint 2 (56 h) quedaría "
         "sobrecomprometido en 2 h", "Diferido hasta confirmar si el equipo trabaja esos días", "Product Owner", "Este plan v1.0 (17/11/2026)"],
    ])

    # --- 12. Herramientas
    t = pl.find_table(doc, "Herramienta / repositorio")
    pl.fill_table(t, [
        ["Jira (proyecto SCRUM «Compra Ya»)", "Product Backlog, sprints, subtareas con horas y seguimiento", "Duván (Scrum Master)", JIRA, "Se actualiza a diario; cada subtarea se cierra el día en que termina"],
        ["Archivo Cronograma_ComproYa.xml (MS Project o ProjectLibre)", "Gantt, red, cálculo de la ruta crítica y holguras", "Duván y Nicolás", "docs/cronograma/Cronograma_ComproYa.xml y carpeta del curso en Google Drive",
         "Se actualiza al cerrar o reestimar una subtarea; la línea base cambia solo con una decisión de la sección 11"],
        ["Repositorio documental y de código (GitHub Compra-Ya/comproya-en-linea) y Google Drive", "Actas, planes, versiones y código", "Nicolás y Duván", f"https://github.com/Compra-Ya/comproya-en-linea (docs/) y {DRIVE}",
         "Un commit por cambio; en Drive cada entrega lleva código y versión (este plan: PGC-001 / 1.0)"],
    ])

    # --- Anexo A
    t = pl.find_table(doc, "Verificación", "Sí")
    obs = [("☒", "Lunes a viernes, 10 días hábiles por sprint, horas-persona."), ("☒", "Cada historia tiene criterio y prueba (sección 4)."), ("☒", "Sección 5 y Anexo B."),
           ("☒", "Sección 6: técnica y supuestos; sin rango calibrado."), ("☒", "Sección 7.1: 30 h por integrante y sprint."),
           ("☐", "La línea base está en revisión; falta la aprobación de la Dirección de ComproYa."), ("☒", "Sección 9."), ("☒", "Sección 11."), ("☒", "Sección 12.")]
    for i, (marca, texto) in enumerate(obs, start=1):
        c = t.rows[i].cells
        pl.set_cell(c[1], marca)
        pl.set_cell(c[2], "☐" if marca == "☒" else "☒")
        pl.set_cell(c[3], "☐")
        pl.set_cell(c[4], texto)

    destino.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(destino))


if __name__ == "__main__":
    plantilla = Path(sys.argv[1])
    gr.dibujar_red(SALIDA / "img" / "Red_del_Proyecto_ComproYa.png")
    gr.dibujar_gantt(SALIDA / "img" / "Gantt_ComproYa.png")
    print("XML de MS Project:", xmlp.escribir(SALIDA / "Cronograma_ComproYa.xml"))
    construir_docx(plantilla, SALIDA / "Plan_Gestion_Cronograma_ComproYa.docx")
    print("listo:", SALIDA)
