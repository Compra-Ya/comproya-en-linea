"""Genera docs/ejecucion/Gestion_Ejecucion_ComproYa.docx con la plantilla del docente (Gestión de la Ejecución del proyecto).

Calcula los KPI de gobernanza, ingeniería y agilidad a partir de la documentación del segundo entregable (sprint 2).
Cada cifra sale de un archivo de evidencia; lo que no se puede medir se declara «No medible» o «No aplica» con su motivo.

  python build_ejecucion.py <plantilla.docx>      (antes: recolectar_soporte_kpi.py)
"""
from __future__ import annotations

import copy
import json
import sys
from pathlib import Path

import docx
from docx.oxml.ns import qn
from docx.table import Table
from docx.text.paragraph import Paragraph

import plantilla as pl
import usabilidad_resumen as us

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "ejecucion"
EV = RAIZ / "entrega-2/evidencia"
PROYECTO = "Aplicación Web de Comercio Electrónico — Venta de Electrodomésticos y Productos de Retail"
N = "Nicolás Cancimance"
D = "Duván Serrano"


def pct(a: float, b: float) -> str:
    return f"{100 * a / b:.1f}".replace(".", ",") + " %"


def num(x: float, d: int = 1) -> str:
    return f"{x:.{d}f}".replace(".", ",")


def fecha_corta(iso: str) -> str:
    meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
    _, m, d = iso.split("-")
    return f"{int(d)}-{meses[int(m) - 1]}"


def cargar() -> dict:
    j = json.loads((EV / "jest-completo.json").read_text(encoding="utf-8"))
    cov = json.loads((EV / "cobertura-resumen.json").read_text(encoding="utf-8"))["total"]
    s2 = json.loads((EV / "sprint2-resultado.json").read_text(encoding="utf-8"))
    rend = json.loads((EV / "rendimiento-sprint2.json").read_text(encoding="utf-8"))["mediciones"]
    kpi = json.loads((SALIDA / "soporte/kpi-medidas.json").read_text(encoding="utf-8"))
    interno = (EV / "interno-resultado.md").read_text(encoding="utf-8")
    return dict(j=j, cov=cov, s2=s2, rend=rend, kpi=kpi, ok_int=interno.count("| OK |"), tot_int=interno.count("| OK |") + interno.count("| FALLA |"))


def definir(d: dict) -> dict:
    """Devuelve, por categoría, la lista de KPI: (nombre, cálculo con resultado, soporte, responsable, frecuencia, justificación|None)."""
    j, cov, s2, k = d["j"], d["cov"], d["s2"], d["kpi"]
    vent, ped = d["rend"][0], d["rend"][1]
    antes, despues = k["jira_sprint2"]["antes"], k["jira_sprint2"]["despues"]
    comp = k["jira_sprint2"]["comprometidas_h"]
    lineas = k["lineas_ejecutables_backend"]
    arq, conf = k["arquitectura"], k["configuracion"]
    au = k["npm_audit_produccion"]
    crit = au["backend"]["critical"] + au["frontend"]["critical"]
    altas = au["backend"]["high"] + au["frontend"]["high"]
    comp_ok = j["numPassedTests"]
    comp_tot = j["numTotalTests"]
    ga = k["github_actions"]
    n_ga, ok_ga = ga["ejecuciones_hasta_el_corte"], ga["exitosas"]
    f_ga = [e["fecha"] for e in ga["ejecuciones"]]
    rango_ga = f"{fecha_corta(min(f_ga))} al {fecha_corta(max(f_ga))}"
    pasos_ga = {e["paso_que_fallo"] for e in ga["ejecuciones"]}
    assert pasos_ga == {"Run google-github-actions/auth@v2"}, pasos_ga  # el texto de la justificación depende de esto
    SP = "docs/entrega-2/evidencia/"
    sesiones = us.sesiones_participantes()
    sat = us.resumen(sesiones, {}, {})
    if sat and sat["seq_medio"] is not None:
        satisfaccion = ("Satisfacción de interesados", f"Promedio de las puntuaciones obtenidas en encuestas = **{us.coma(sat['seq_medio'], 2)} de 7** (SEQ, {sat['seq_n']} respuestas de {sat['personas']} participante(s))",
                        "Segundo entregable, sección 7.4; docs/usabilidad/sesiones", D, "Mensual",
                        f"Promedio de la pregunta de facilidad (SEQ, de 1 a 7) que cada participante contestó al terminar cada tarea, grabada con e2e/usabilidad/grabar-sesion.mjs ({', '.join(sat['codigos'])}; {', '.join(sat['fechas'])}). Es una medición posterior al corte del 17-nov y solo de usuarios del Cliente digital; la meta del plan de calidad es ≥ 5,0.")
    else:
        satisfaccion = ("Satisfacción de interesados", "Promedio de las puntuaciones obtenidas en encuestas → **No medible**",
                        "Segundo entregable, sección 7.4 (sesión con participantes pendiente)", D, "Mensual",
                        "Depende de la sesión de usabilidad con participantes (segundo entregable, sección 7.4), que está pendiente; no se sustituye por una encuesta interna del equipo.")
    gob = [
        ("Cumplimiento de decisiones de gobernanza", "(Decisiones implementadas / Decisiones aprobadas) × 100 = 1 / 1 = **100 %**",
         "docs/cronograma, secciones 11.1 y Anexo A (CH-01 aprobado el 17/11/2026)", N, "Quincenal",
         "La línea base del cronograma se aprueba mediante el Acta AC-PGC-001, fechada el 17-nov-2026 (Anexo E del plan de cronograma, vigente desde la fecha de su última firma); la aprobación llega con los sprints 1 y 2 ya ejecutados. Con ella queda aprobada una decisión, CH-01 (3 sprints en lugar de 6), que ya está implementada en Jira (3 sprints, dos cerrados); CH-02 (festivos) sigue diferido y no cuenta."),
        ("Cumplimiento del alcance", f"(Entregables aceptados / Entregables planificados) × 100 = 4 / 4 = **100 %**",
         "Segundo entregable, Anexo B; " + SP + "jest-completo.json y sprint2-resultado.json", N, "Por sprint",
         "Entregable = historia del sprint 2 (HU-113 a HU-116). «Aceptado» se define como que las pruebas de aceptación de la historia (TEST-007, TEST-012 y TEST-013) pasan; la aceptación del Product Owner en la Sprint Review está pendiente y se cuenta en el KPI de aceptación del incremento."),
        ("Cobertura de implementación de requisitos", "(Requisitos implementados / Requisitos aprobados) × 100 = 6 / 6 = **100 %**",
         "PGR-001 (RF-120 a RF-123, RNF-110, RNF-111) y Segundo entregable, Anexo B", N, "Por sprint",
         "Los requisitos aprobados para el sprint 2 son 4 funcionales (RF-120 a RF-123) y 2 no funcionales de seguridad (RNF-110 y RNF-111) del PGR-001; «implementado» significa que existe código y una prueba aprobada que lo verifica."),
        ("Cumplimiento del cronograma", "(Hitos cumplidos / Hitos planificados) × 100 = 1 / 3 = **33,3 %**",
         "docs/cronograma, secciones 8.1 y Anexo C; Jira (cierre de sprints)", D, "Por hito",
         "Se consideran los 3 hitos con fecha igual o anterior al corte (17-nov): H-01 requisitos entregado el 10-nov (cumplido), H-02 cierre del sprint 1 planificado el 30-oct y cerrado en Jira el 10-nov (tarde) y H-03 cierre del sprint 2 planificado el 13-nov y cerrado el 17-nov (tarde). Un hito es «cumplido» solo si su fecha real es menor o igual a la planificada."),
        ("Variación del presupuesto", "((Costo real − Costo presupuestado) / Costo presupuestado) × 100 → **No aplica**",
         "Declaración de alcance, restricciones (sin presupuesto monetario)", N, "Mensual", None),
        ("Utilización de recursos", f"(Horas productivas / Horas disponibles) × 100 = {comp} / 60 = **{pct(comp, 60)}** (utilización planificada)",
         "PGR-001, 6.3 y 6.4; Jira (subtareas del sprint 2)", D, "Por sprint",
         f"No se registran horas reales, solo las estimadas en cada subtarea de Jira; por eso se reporta la utilización planificada: {comp} horas comprometidas de 60 disponibles (2 integrantes × 10 días × 3 h). Es un indicador de planificación, no de ejecución."),
        ("Porcentaje de riesgos mitigados", "(Riesgos mitigados / Riesgos identificados) × 100 → **No medible**",
         "—", D, "Quincenal",
         "El registro de riesgos no forma parte de la documentación del segundo entregable y no se abrió uno para el sprint; sin una lista de riesgos identificados no existe el cociente."),
        satisfaccion,
        ("Tiempo promedio de aprobación de cambios", "Tiempo total de evaluación / Cambios evaluados = 0 / 0 → **No aplica**",
         "docs/cronograma, sección 11.1", N, "Por cambio",
         "En el sprint 2 hay 2 cambios registrados (CH-01 y CH-02) y ninguno ha sido evaluado por la Dirección de ComproYa, así que no hay tiempos de aprobación que promediar."),
        ("Cumplimiento de proveedores", "(Entregables aceptados del proveedor / Entregables contratados) × 100 → **No aplica**",
         "Declaración de alcance (ERP simulado y pasarela en modo de prueba)", N, "Mensual", None),
        ("Captura de lecciones aprendidas", "(Lecciones documentadas / Lecciones identificadas) × 100 = 5 / 5 = **100 %**",
         "docs/calidad, secciones 8.1 y 12", D, "Por sprint",
         "Se toman como lecciones identificadas del sprint 2 el defecto DEF-001 y las no conformidades NC-001 a NC-004 (5); cada una tiene causa, acción y responsable en las secciones 8.1 y 12 del Plan de gestión de la calidad (AC-01 a AC-05)."),
        ("Índice de desempeño del cronograma (SPI)",
         f"EV / PV = {antes['horas_finalizadas']} / {comp} = **{num(antes['horas_finalizadas'] / comp, 2)}** el 13-nov (fin planificado) y {despues['horas_finalizadas']} / {comp} = **{num(despues['horas_finalizadas'] / comp, 2)}** el 17-nov",
         "docs/ejecucion/soporte/kpi-medidas.json (Jira antes y después del cierre)", D, "Semanal",
         f"Alcance: sprint 2. PV son las {comp} horas de las 24 subtareas que debían estar terminadas el 13-nov; EV son las horas de las subtareas en estado Finalizado. Jira mostraba {antes['horas_finalizadas']} h finalizadas, sin cambios de estado desde el 10-nov; el 17-nov se cerraron las 16 subtareas restantes con la evidencia de este entregable, por lo que EV llegó a {despues['horas_finalizadas']} h. SPI = 1,00 con 4 días calendario de retraso frente al plan (2 días hábiles del calendario del plan de cronograma)."),
        ("Índice de desempeño del costo (CPI)", "EV / AC → **No aplica**", "Declaración de alcance (sin presupuesto monetario ni horas reales)", N, "Semanal", None),
    ]
    ing = [
        ("Estabilidad de requisitos", "(Requisitos sin cambios / Requisitos aprobados inicialmente) × 100 = 6 / 6 = **100 %**",
         "PGR-001 (línea base del 10-nov) y registro de cambios", N, "Por sprint",
         "La línea base del sprint 2 es la del PGR-001 del 10-nov; durante el sprint no se registró ningún cambio sobre RF-120 a RF-123, RNF-110 y RNF-111. Los cambios CHG-002 y CHG-003 son anteriores a la línea base."),
        ("Cumplimiento de arquitectura", f"(Componentes conformes / Componentes evaluados) × 100 = {arq['archivos_conformes']} / {arq['archivos_evaluados']} = **{pct(arq['archivos_conformes'], arq['archivos_evaluados'])}**",
         "docs/ejecucion/soporte/kpi-medidas.json (arquitectura)", D, "Por sprint",
         f"Componente = archivo de código (sin pruebas) de los módulos pedido, cuenta, auth y auditoria. La regla de docs/arquitectura.md (sección 3) es que un módulo solo importe de otro su módulo de Nest o su servicio de aplicación; se revisaron todas las importaciones entre módulos de negocio y hubo {len(arq['violaciones'])} violaciones."),
        ("Productividad de desarrollo", f"Funcionalidades completadas / Esfuerzo utilizado = 4 historias / {comp} h = **{num(4 / comp, 3)} historias por hora** ({num(comp / 4)} h por historia)",
         "Jira (horas de las subtareas del sprint 2)", D, "Por sprint",
         "El esfuerzo es la suma de las horas estimadas de las subtareas, porque no se registran horas reales; sirve para comparar sprints, no para medir horas trabajadas."),
        ("Cobertura de revisión de código", "(Componentes revisados / Componentes desarrollados) × 100 → **No medible**",
         "—", D, "Por sprint",
         "La revisión entre pares prevista en el plan de calidad (sección 5) no deja un registro del sprint 2 (el código se integró sin pull request), así que no hay soporte documental; se corrige con la acción AC-05 y el registro de revisiones desde el sprint 3."),
        ("Cumplimiento de configuración", f"(Elementos de configuración controlados / Elementos identificados) × 100 = {conf['controlados']} / {conf['identificados']} = **{pct(conf['controlados'], conf['identificados'])}**",
         "docs/ejecucion/soporte/kpi-medidas.json (git ls-files)", D, "Por sprint",
         f"Los {conf['identificados']} elementos son los archivos de código, de pruebas y de verificación que implementan el sprint 2 (Tabla 3 del segundo entregable); controlado significa que el archivo está versionado en el repositorio de GitHub."),
        ("Tasa de integración exitosa", "(Integraciones exitosas / Integraciones realizadas) × 100 = 7 / 7 = **100 %**",
         "Segundo entregable, sección 6.2 (casos S2-PI-01 a S2-PI-07)", D, "Cada integración",
         "Integración = caso de prueba de integración del sprint 2 (servicio, controlador y PostgreSQL de pruebas); los 7 casos pasaron en la ejecución del 17-nov."),
        ("Cobertura de pruebas", f"(Elementos cubiertos por pruebas / Elementos definidos para prueba) × 100 = 6 / 6 = **100 %** de requisitos; sentencias de código: **{num(cov['statements']['pct'], 2)} %** ({cov['statements']['covered']} / {cov['statements']['total']})",
         "Segundo entregable, Anexo B; " + SP + "cobertura-resumen.json", D, "Por sprint",
         "Se reportan dos coberturas: la de requisitos del sprint (cada uno con al menos un caso de prueba aprobado) y la de sentencias de todo el backend medida con jest --coverage, sin pruebas ni módulos de Nest."),
        ("Densidad de defectos", f"Defectos identificados / Tamaño del software = 1 / {num(lineas / 1000, 3)} KLOC = **{num(1 / (lineas / 1000), 2)} defectos por 1000 líneas**",
         "docs/calidad, sección 8.1 (DEF-001); " + SP + "cobertura-resumen.json", D, "Por sprint",
         f"El tamaño son las {lineas} líneas ejecutables del backend que mide jest --coverage; el único defecto confirmado en el sprint es DEF-001 (cancelación de un pedido pagado)."),
        ("Cumplimiento de auditorías de calidad", "(Criterios conformes / Criterios evaluados) × 100 = 3 / 5 = **60,0 %**",
         "docs/calidad, sección 10.1 (registro del sprint 2)", D, "Por hito",
         "El registro de evaluación del sprint 2 evalúa 5 criterios: adecuación funcional, mantenibilidad y accesibilidad cumplen; seguridad no cumple por las vulnerabilidades de dependencias (NC-003) y la calidad en uso queda condicionada a la sesión con participantes."),
        ("Tasa de aceptación de funcionalidades", "(Funcionalidades aceptadas / Funcionalidades presentadas) × 100 = 10 / 10 = **100 %** de criterios de aceptación cumplidos",
         "Jira (criterios de las historias HU-113 a HU-116); Segundo entregable, Anexo B", N, "Por sprint",
         "Se cuentan los 10 criterios de aceptación de las 4 historias en Jira (HU-113: 2, HU-114: 3, HU-115: 2 y HU-116: 3), cada uno con su prueba de aceptación aprobada (TEST-007, TEST-012 y TEST-013). La aceptación formal del Product Owner se mide en el KPI de aceptación del incremento."),
        ("Vulnerabilidades críticas abiertas", f"Número de vulnerabilidades críticas pendientes = **{crit}** ({au['backend']['critical']} en el backend y {au['frontend']['critical']} en el frontend); además {altas} altas",
         "docs/ejecucion/soporte/kpi-medidas.json (npm audit --omit=dev)", D, "Por liberación",
         f"npm audit sobre las dependencias de producción: la crítica del backend es proxy-addr y la del frontend es next; todas tienen arreglo disponible. Es la no conformidad NC-003 y la acción AC-04 del plan de calidad. Posterior al corte: NC-003 se cerró el 22-nov (npm audit de producción: 0 críticas y 0 altas; docs/ejecucion/soporte/npm-audit-2026-11-22.json); el valor del KPI al corte sigue siendo el medido el 17-nov."),
        ("Tiempo promedio de respuesta", f"Tiempo total de respuesta / Número de solicitudes: GET /ventas **{num(vent['promedioMs'])} ms** (P95 {num(vent['p95Ms'])} ms) y GET /pedidos **{num(ped['promedioMs'])} ms** (P95 {num(ped['p95Ms'])} ms)",
         SP + "rendimiento-sprint2.json", D, "Por sprint",
         "Son 30 solicitudes por consulta contra el backend local con la base de desarrollo; no es la prueba TEST-016 (40.000 productos y 900 pedidos por hora), que se mide en el sprint 3."),
        ("Tiempo medio de resolución de incidencias", "Tiempo total de resolución / Incidencias resueltas → **No medible**",
         "docs/calidad, sección 8.1", D, "Por sprint",
         "DEF-001 se detectó y corrigió el 17-nov, pero no se registró la hora de detección, así que no hay tiempo de resolución; el registro de defectos incluirá fecha y hora desde el sprint 3."),
        ("Tasa de despliegues exitosos", f"(Despliegues exitosos / Despliegues realizados) × 100 = {ok_ga} / {n_ga} = **{pct(ok_ga, n_ga)}**",
         "docs/ejecucion/soporte/kpi-medidas.json (GitHub Actions); docs/despliegue-gcp.md", D, "Por liberación",
         f"Despliegue = ejecución del workflow «Desplegar a Cloud Run» (.github/workflows/deploy.yml), que se activa al subir a main. Hasta el corte hubo {n_ga} ejecuciones ({rango_ga}) y las {n_ga} fallaron en el paso de autenticación con Google Cloud, antes de construir la imagen, así que ninguna llegó a publicar. La causa es que el arranque del proyecto en Google Cloud (docs/despliegue-gcp.md) no se completó; mientras tanto el producto corre solo en el entorno local. Dato de la API pública de GitHub, consultado el 22-nov."),
        ("Disponibilidad del sistema", "(Tiempo disponible / Tiempo de servicio acordado) × 100 → **No aplica**",
         "—", D, "Mensual", None),
    ]
    extra = [
        ("Eficiencia de eliminación de defectos (DRE)", "Defectos encontrados antes de liberación / Total de defectos encontrados × 100 = 1 / 1 = **100 %**", "DEF-001 se detectó antes de cualquier liberación; no hay producción."),
        ("Tasa de pruebas exitosas", f"(Pruebas aprobadas / Pruebas ejecutadas) × 100 = {comp_ok} / {comp_tot} = **{pct(comp_ok, comp_tot)}**", "jest --runInBand, 31 suites."),
        ("Tasa de defectos reabiertos", "(Defectos reabiertos / Defectos cerrados) × 100 = 0 / 1 = **0,0 %**", "DEF-001 no se reabrió."),
        ("Tasa de defectos escapados", "(Defectos detectados en producción / Total de defectos detectados) × 100 = 0 / 1 = **0,0 %**", "No hay producción todavía."),
        ("Cobertura de requisitos mediante pruebas", "(Requisitos con pruebas asociadas / Total de requisitos verificables) × 100 = 6 / 6 = **100 %**", "Segundo entregable, Anexo B."),
        ("Deuda técnica", "Esfuerzo estimado para resolver deuda técnica → **2 no conformidades técnicas abiertas, sin esfuerzo estimado**", "NC-002 (pruebas e2e desfasadas) y NC-003 (dependencias); el esfuerzo se estima en el sprint 3. Posterior al corte, NC-003 y NC-002 se cerraron el 22 y el 23-nov."),
    ]
    agi = [
        ("Elementos refinados del backlog", "(Elementos refinados / Elementos que requieren refinamiento) × 100 = 17 / 17 = **100 %**",
         "PGR-001, Anexo 6.5; Jira", N, "Por sprint",
         "Las 17 historias del backlog tienen criterios de aceptación medibles y su prueba TEST-nnn (PGR-001, sección 6.5)."),
        ("Cumplimiento del Sprint Backlog", f"(Elementos completados / Elementos comprometidos) × 100 = 0 / 4 = **0,0 %** el 13-nov y 4 / 4 = **100 %** el 17-nov",
         "docs/ejecucion/soporte/kpi-medidas.json (Jira)", D, "Por sprint",
         "Al cierre planificado del sprint (13-nov) Jira tenía 0 de 4 historias finalizadas; el 17-nov, con la evidencia de este entregable, las 4 quedaron finalizadas. Se reportan los dos valores para no ocultar que el cierre llegó 4 días calendario tarde (2 días hábiles del calendario del plan)."),
        ("Velocidad del equipo", f"Suma de puntos de historia completados por Sprint → **{comp} horas-persona** en el sprint 2; el sprint 1 no tiene horas registradas, así que no hay promedio",
         "PGR-001 (6.3) y Jira", D, "Por sprint",
         "El proyecto no usa puntos de historia (PGR-001); la velocidad se mide en horas-persona de las subtareas finalizadas. Las horas del sprint 1 no se registraron al cerrarlo y no se reconstruyen, por lo que todavía no existe un promedio de velocidad; el sprint 3 será el segundo dato."),
        ("Impedimentos resueltos", "(Impedimentos resueltos / Impedimentos identificados) × 100 → **No medible**",
         "—", D, "Diaria",
         "Jira no tiene un registro de impedimentos del sprint 2; desde el sprint 3 se registran en la Daily Scrum."),
        ("Incrementos conformes con Definition of Done", "(Incrementos conformes / Incrementos evaluados) × 100 = 0 / 1 = **0,0 %** (cumple 4 de las 5 condiciones)",
         "PGR-001, sección de la Definition of Done; Segundo entregable", N, "Por sprint",
         "La Definition of Done del PGR-001 tiene 5 condiciones: criterios cumplidos (sí), cada regla con prueba que pasa (sí), código sin errores de análisis estático (sí: nest build y tsc sin errores), aceptación del Product Owner en la Sprint Review (pendiente) y trazabilidad al día (sí). Una condición pendiente impide declarar el incremento conforme."),
        ("Aceptación del incremento", "(Elementos aceptados / Elementos presentados) × 100 → **No medible**",
         "—", N, "Por sprint",
         "La Sprint Review del sprint 2 todavía no se ha realizado con el Product Owner, así que no hay elementos aceptados ni presentados."),
        ("Acciones de mejora implementadas", "(Acciones implementadas / Acciones acordadas) × 100 = 0 / 5 = **0,0 %**",
         "docs/calidad, sección 12 (AC-01 a AC-05)", D, "Por sprint",
         "Las 5 acciones se registraron el 17-nov (AC-01 y AC-05 en curso, AC-02 a AC-04 abiertas); se acuerdan y cierran en la retrospectiva del sprint 3. Posterior al corte: AC-02, AC-03 y AC-04 se cerraron el 22 y el 23-nov (3 de 5); el valor al corte sigue siendo 0 de 5."),
        ("Frecuencia de despliegue", f"Número de despliegues por período = **0** exitosos ({n_ga} intentos del workflow entre el {rango_ga.replace(' al ', ' y el ')}, todos fallidos)",
         "docs/ejecucion/soporte/kpi-medidas.json (GitHub Actions)", D, "Por liberación",
         f"Se cuentan los despliegues que llegaron a Cloud Run; ninguno de los {n_ga} intentos lo logró (ver la tasa de despliegues exitosos), así que la frecuencia es cero y no hay entregas incrementales en un entorno compartido todavía."),
        ("Tiempo de ciclo (Cycle Time)", "Fecha de finalización − Fecha de inicio del trabajo → **No medible**",
         "—", D, "Por historia",
         "Las 17 historias y sus subtareas se crearon todas el 10-nov al importar el backlog a Jira, por lo que no existe una fecha real de inicio del trabajo."),
        ("Cumplimiento de objetivos del producto", "(Objetivos alcanzados / Objetivos planificados) × 100 = 4 / 4 = **100 %**",
         "Jira, Sprint Goal del sprint 2; Segundo entregable", N, "Por sprint",
         "El Sprint Goal del sprint 2 tiene 4 objetivos: ingreso del Coordinador por /admin, lista de ventas con filtros y total, consulta de pedidos del cliente y cancelación antes de pagar; los 4 se verificaron con sus pruebas."),
        ("Tasa de compilaciones exitosas", "(Compilaciones exitosas / Compilaciones ejecutadas) × 100 = 2 / 2 = **100 %**",
         "nest build y tsc --noEmit del 17-nov", D, "Diaria",
         f"Compilaciones locales: nest build del backend y tsc --noEmit del frontend, ambas con código de salida 0. Las {n_ga} ejecuciones de GitHub Actions hasta el corte no suman compilaciones: fallaron en la autenticación con Google Cloud, antes del paso que construye la imagen."),
        ("Tasa de cambios fallidos", "(Despliegues que generan fallos / Total de despliegues) × 100 → **No aplica**",
         "—", D, "Por liberación", None),
    ]
    return dict(gob=gob, ing=ing, extra=extra, agi=agi)


def llenar_tabla(t: Table, items: list, col_kpi: int = 2, col_formula: int = 3) -> None:
    for i, it in enumerate(items, start=1):
        nombre, calculo = it[0], it[1]
        pl.set_cell(t.rows[i].cells[col_kpi], nombre)
        base = pl.set_cell
        formula = calculo
        base(t.rows[i].cells[col_formula], formula)


TACHADOS = {"Variación del presupuesto", "Cumplimiento de proveedores", "Cumplimiento de auditorías de calidad", "Impedimentos resueltos"}


def justificaciones(doc, tabla: Table, items: list, titulo: str, like: Paragraph) -> None:
    primero = pl.paragraph_after_table(tabla, titulo, like)
    for r in primero.runs:
        r.bold = True
    anterior = primero
    for it in items:
        just = it[5] if len(it) > 5 else None
        if just and it[0] not in TACHADOS:  # la plantilla del docente tacha estos KPI: no es necesario desarrollarlos
            anterior = pl.insert_paragraph_after(anterior, f"**{it[0]}.** {just}", copy_format_from=like)


def construir(plantilla: Path, destino: Path) -> None:
    d = cargar()
    K = definir(d)
    doc = docx.Document(str(plantilla))
    cuerpo = pl.find_paragraph(doc, "La gestión durante la ejecución")

    marco = pl.find_paragraph(doc, "-- Enfoque integrado")
    sub = pl.insert_paragraph_after(marco, PROYECTO, copy_format_from=cuerpo)
    sub2 = pl.insert_paragraph_after(sub, "Tiendas ComproYa · Ingeniería de Software II · Universidad Central", copy_format_from=cuerpo)
    pl.insert_paragraph_after(sub2, "Documento PGE-001 · Versión 1.2 · 23/11/2026 · Integrantes: Nicolás Santiago Cancimance Pabón y Duván Camilo Serrano Rojas", copy_format_from=cuerpo)

    # alcance de la medición, después de la definición de KPI
    kpi_def = pl.find_paragraph(doc, "Un KPI (Key Performance Indicator")
    a = pl.insert_paragraph_after(kpi_def, (
        "**Alcance y corte de la medición.** Los KPI de este documento se calculan para el segundo entregable (segundo sprint, 2 al 13 de noviembre de 2026; "
        "historias HU-113 a HU-116, 56 horas-persona comprometidas) con corte al 17 de noviembre de 2026, y solo para las tres categorías que pide la actividad: "
        "gobernanza y gestión del proyecto, ingeniería de software y calidad técnica, y agilidad y entrega iterativa (Scrum). Las categorías ISO/IEC y CMMI se "
        "conservan como referencia teórica y no se calculan. Cada KPI indica su fórmula, su cálculo y su resultado; el soporte documental de cada uno está en el "
        "Anexo A. Un KPI sin datos se declara «No medible» (falta el registro) o «No aplica» (el proyecto no tiene ese elemento) y se justifica en un párrafo; "
        "no se estima ningún valor. La versión 1.1 (22-nov) incorporó el historial de GitHub Actions, que no se había podido consultar en la versión 1.0, y el Anexo C del segundo entregable con este mismo soporte; la 1.2 (23-nov) agrega, sin cambiar el corte ni los valores medidos, notas sobre el cierre posterior de NC-001 a NC-003."), copy_format_from=cuerpo)
    pl.insert_paragraph_after(a, (
        "**Fuentes de datos.** Jira (proyecto SCRUM, estado y horas por subtarea), el repositorio de GitHub, los resultados de jest y de las verificaciones en navegador "
        "(docs/entrega-2/evidencia), el historial de GitHub Actions y el Plan de gestión de requisitos PGR-001. Las mediciones propias se regeneran con docs/_generadores/recolectar_soporte_kpi.py."), copy_format_from=cuerpo)

    # ---- tablas de KPI
    t_gob = pl.find_table(doc, "Proceso de gestión", "Actividades")
    llenar_tabla(t_gob, K["gob"])
    t_ing = pl.find_table(doc, "Proceso de ingeniería", "Actividades")
    llenar_tabla(t_ing, K["ing"])
    t_agi = pl.find_table(doc, "Proceso ágil", "Actividades")
    llenar_tabla(t_agi, K["agi"])
    t_extra = pl.find_table(doc, "KPI", "Fórmula")
    for i, (nombre, calculo, nota) in enumerate(K["extra"], start=1):
        pl.set_cell(t_extra.rows[i].cells[0], nombre)
        pl.set_cell(t_extra.rows[i].cells[1], calculo)
        pl.set_cell(t_extra.rows[i].cells[2], nota)

    # ---- justificaciones (un párrafo por KPI donde el cálculo no es evidente)
    like = pl.find_paragraph(doc, "Convenciones:")
    justificaciones(doc, t_agi, K["agi"], "Justificación de los cálculos de agilidad y entrega iterativa", like)
    # las demás se insertan después de su tabla; el KPI adicional va tras la tabla de KPI adicionales
    p_extra = pl.paragraph_after_table(t_extra, "Justificación de los KPI adicionales", like)
    for r in p_extra.runs:
        r.bold = True
    pl.insert_paragraph_after(p_extra, (
        "**DRE, defectos reabiertos y escapados.** El sprint 2 tiene un solo defecto confirmado (DEF-001), detectado antes de cualquier liberación y no reabierto; "
        "como no hay producción, los defectos escapados son 0. Con una muestra de 1 defecto estos porcentajes no permiten concluir sobre la capacidad de detección."),
        copy_format_from=like)
    justificaciones(doc, t_ing, K["ing"], "Justificación de los cálculos de ingeniería de software y calidad técnica", like)
    # gobernanza: va después del párrafo de interpretación de SPI/CPI (tras la tabla, y las convenciones) — se inserta tras la tabla
    justificaciones(doc, t_gob, K["gob"], "Justificación de los cálculos de gobernanza y gestión del proyecto", like)

    # ---- CMMI: nota
    cmmi = pl.find_paragraph(doc, "El modelo CMMI")
    pl.insert_paragraph_after(cmmi, "En esta entrega no se calculan KPI de CMMI ni de ISO/IEC; esta sección y la matriz consolidada se conservan como referencia teórica de la plantilla.", copy_format_from=cmmi)

    # ---- ficha de implementación: se instancia con el KPI de mayor valor de gestión (SPI)
    ficha = pl.find_table(doc, "Elemento", "Descripción")
    pl.fill_pairs(ficha, [
        "GOB-12",
        "Índice de desempeño del cronograma (SPI) del sprint 2",
        "Gobernanza y gestión del proyecto",
        "Saber si el sprint 2 avanzó conforme al cronograma",
        "Monitoreo y control del desempeño (gestión del cronograma)",
        "SPI = EV / PV",
        "Número (cociente de horas-persona)",
        "Jira (estado y horas de las subtareas) y docs/cronograma",
        "Semanal",
        "Duván Camilo Serrano Rojas (Scrum Master)",
        "0,20 el 13-nov (11 h de 56 h finalizadas)",
        "1,00 al cierre del sprint",
        "Alerta si SPI < 0,90; se escala al patrocinador si < 0,80",
        "Cerrar cada subtarea el mismo día en que termina (AC-05) y revisar el tablero en la Daily Scrum",
    ])
    pf = pl.paragraph_after_table(ficha, "Anexo A. Soporte documental de los KPI calculados", like)
    for r in pf.runs:
        r.bold = True
    # tabla del anexo: clon de la tabla de gobernanza (4 columnas), 27 + 6 + 12 filas
    filas = []
    for pref, key in (("GOB", "gob"), ("ING", "ing"), ("AGI", "agi")):
        for i, it in enumerate(K[key], start=1):
            filas.append([f"{pref}-{i:02d} {it[0]}", it[1], it[2], it[3]])
    for i, (nombre, calculo, nota) in enumerate(K["extra"], start=1):
        filas.append([f"ING-X{i} {nombre}", calculo, "docs/entrega-2/evidencia y docs/calidad", D])
    nuevo = copy.deepcopy(t_gob._tbl)
    pf._p.addnext(nuevo)
    t_ann = Table(nuevo, pf._parent)
    pl.set_cell(t_ann.rows[0].cells[0], "Código y KPI")
    pl.set_cell(t_ann.rows[0].cells[1], "Cálculo y resultado")
    pl.set_cell(t_ann.rows[0].cells[2], "Soporte documental")
    pl.set_cell(t_ann.rows[0].cells[3], "Responsable")
    pl.fill_table(t_ann, filas)
    for el in t_ann._tbl.xpath(".//w:strike"):  # las filas clonadas de la plantilla traen el tachado del docente
        el.getparent().remove(el)

    destino.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(destino))


if __name__ == "__main__":
    construir(Path(sys.argv[1]), SALIDA / "Gestion_Ejecucion_ComproYa.docx")
    print("listo", SALIDA)
