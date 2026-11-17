"""Genera docs/calidad/Plan_Gestion_Calidad_ComproYa.docx con la plantilla del docente (Plan de Gestión de la Calidad).

  python build_calidad.py <plantilla.docx> <carpeta_evidencia>
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import docx

import plantilla as pl

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "calidad"
PROYECTO = "Aplicación Web de Comercio Electrónico — Venta de Electrodomésticos y Productos de Retail"
N = "Nicolás Santiago Cancimance Pabón"
D = "Duván Camilo Serrano Rojas"
JIRA = "https://ucentral-team-ihdichmo.atlassian.net/jira/software/projects/SCRUM/boards/1"


def pct(x: float) -> str:
    return f"{x:.2f}".replace(".", ",") + " %"


def construir(plantilla: Path, ev: Path, destino: Path) -> None:
    j = json.loads((ev / "jest-completo.json").read_text(encoding="utf-8"))
    cov = json.loads((ev / "cobertura-resumen.json").read_text(encoding="utf-8"))["total"]
    s2 = json.loads((ev / "sprint2-resultado.json").read_text(encoding="utf-8"))
    n_pasan, n_total = j["numPassedTests"], j["numTotalTests"]
    s_cov = pct(cov["statements"]["pct"])
    doc = docx.Document(str(plantilla))
    cuerpo = pl.find_paragraph(doc, "Este plan establece un marco")

    # subtítulo con el proyecto
    marco = pl.find_paragraph(doc, "-- Enfoque integrado")
    sub = pl.insert_paragraph_after(marco, PROYECTO, copy_format_from=cuerpo)
    pl.insert_paragraph_after(sub, "Tiendas ComproYa · Ingeniería de Software II · Universidad Central", copy_format_from=cuerpo)

    # ---- datos de control
    t = pl.find_table(doc, "Dato de control")
    pl.fill_pairs(t, [PROYECTO, "Tiendas ComproYa — área de Canal Digital", "Dirección de ComproYa (CEO, CFO y CTO)", D,
                      f"{D} (QA)", "1.0 – 17/11/2026", "☐ Borrador  ☒ En revisión  ☐ Aprobado"])

    t = pl.find_table(doc, "Rol", "Nombre")
    for i, (nombre, firma) in enumerate([("Dirección de ComproYa (CEO, CFO y CTO)", "☐ Pendiente"), (D, "☐ Pendiente"), (D, "☐ Pendiente"),
                                          (N, "☐ Pendiente"), (D, "☐ Pendiente"), (f"{N} y {D}", "☐ Pendiente")], start=1):
        pl.set_cell(t.rows[i].cells[1], nombre)
        pl.set_cell(t.rows[i].cells[3], firma)

    # ---- 1. criterios de éxito
    t = pl.find_table(doc, "Criterio", "Meta")
    pl.fill_table(t, [
        ["Requisitos críticos verificados", "100 % (35 de 35 requisitos con caso de prueba, PGR-001)", "Matriz de trazabilidad (Segundo entregable, Anexo B; PGR-001, sección 7) y pruebas", "Duván (QA)"],
        ["Defectos críticos abiertos al liberar", "0", "Registro de defectos (sección 8.1)", "Duván (QA)"],
        ["Pruebas automatizadas aprobadas", "100 % en cada integración (medido: " + f"{n_pasan} de {n_total})", "jest --runInBand sobre PostgreSQL de pruebas", "Duván (QA)"],
        ["Satisfacción / usabilidad", "Efectividad ≥ 80 % por tarea; tiempo ≤ 3 × el del equipo; satisfacción ≥ 5,0 de 7 (TEST-017)", "Prueba con 5 participantes y grabador de sesión", "Duván (QA)"],
        ["Cumplimiento de criterios de aceptación", "100 % de las historias liberadas", "Sprint Review y pruebas TEST-001 a TEST-017", "Product Owner"],
    ])

    # ---- 2. entregables
    t = pl.find_table(doc, "Entregable / artefacto")
    pl.fill_table(t, [
        ["Documento de requisitos (PGR-001)", "Completo, consistente, verificable y trazable: 35 requisitos con fuente, historia, prueba y entrega", "Revisión del QA y lista de chequeo; backlog en Jira", "Product Owner"],
        ["Arquitectura y diseño", "Monolito modular, un módulo por sub-problema, interfaces Puerto… para ERP y pasarela", "Diagramas UML del segundo entregable y revisión técnica entre pares", "Product Owner"],
        ["Código fuente", "TypeScript estricto, reglas de negocio citadas en comentarios (RN-nn), sin datos de tarjeta", "Revisión por pares en GitHub; pruebas automatizadas", "Product Owner"],
        ["Casos y resultados de prueba", "Ficha del docente por caso; cobertura y evidencia reproducible", "Plan y resultados de pruebas; docs/entrega-2/evidencia", "Duván (QA)"],
        ["Incremento de software", "Criterios de aceptación de cada historia satisfechos", "Demostración en la Sprint Review y pruebas TEST-nnn", "Product Owner"],
        ["Paquete de despliegue y manuales", "Instalable con Docker local; despliegue en la nube por acordar", "docker-compose.yml, README de backend y frontend; checklist de despliegue", "Dirección de ComproYa"],
    ])

    # ---- 3. estrategia por ciclo de vida
    t = pl.find_table(doc, "Etapa / actividad")
    pl.fill_table(t, [
        ["Descubrimiento y requisitos", "Historias con criterio medible, trazabilidad HU → CU → RN → TEST", "Backlog en Jira y PGR-001", f"{N} (analista)"],
        ["Diseño y arquitectura", "Revisión entre pares de los diagramas UML; riesgos de la interfaz con el ERP y la pasarela", "Diagramas del segundo entregable", f"{N} y {D}"],
        ["Construcción", "TypeScript estricto, comentarios con la regla de negocio, pruebas unitarias por regla", "Código en GitHub y resultados de jest", f"{N} y {D}"],
        ["Integración y pruebas", "Pruebas de integración con PostgreSQL de pruebas y de sistema en navegador (Playwright)", "Informes de pruebas y evidencia", D],
        ["Aceptación del incremento", "Validación de los criterios de aceptación de cada historia", "Incremento aceptado o lista de brechas en la Sprint Review", f"{N} (Product Owner)"],
        ["Liberación y operación", "Prueba de despliegue local; el despliegue en la nube sigue pendiente", "docker-compose y README", f"{N} y {D}"],
        ["Mejora continua", "Retrospectiva por sprint y análisis de causa de cada defecto", "Acciones de mejora (sección 12)", f"{D} (Scrum Master)"],
    ])

    # ---- 4. roles
    t = pl.find_table(doc, "Rol", "Responsabilidades de calidad")
    nombres = ["Patrocinador (Dirección de ComproYa)", f"Director del proyecto ({D})", f"Responsable de calidad / QA ({D})",
               f"Product Owner ({N})", f"Scrum Master ({D})", f"Desarrolladores ({N} y {D})", "Usuarios / representantes (Cliente digital y Coordinador de Canal Digital)"]
    for i, nm in enumerate(nombres, start=1):
        pl.set_cell(t.rows[i].cells[0], nm)

    # ---- 5. política y estándares
    p = pl.find_paragraph(doc, "Política de calidad del proyecto")
    pl.set_paragraph_text(p, (
        "Política de calidad del proyecto: el equipo se compromete a entregar un canal de venta que cumpla las reglas de negocio RN-01 a RN-08 "
        "verificadas por pruebas, que cobre sin guardar datos de tarjeta, que trate los datos personales con consentimiento revocable y "
        "supresión en 72 horas (Ley 1581 de 2012), que sea usable por una persona nueva, y a corregir cada defecto con su causa raíz y una "
        "prueba que impida que reaparezca."))
    t = pl.find_table(doc, "Elemento", "Estándar / regla adoptada")
    pl.fill_table(t, [
        ["Requisitos", "Historia «Como…, quiero…, para…» con criterio medible y prueba TEST-nnn", "Todas las historias del backlog", D, "Jira y PGR-001, Anexo 6"],
        ["Diseño / arquitectura", "Monolito modular; un módulo por sub-problema; sistemas externos detrás de una interfaz Puerto…", "Backend NestJS y frontend Next.js", N, "docs/arquitectura.md y diagramas UML"],
        ["Código", "TypeScript en modo estricto; cada regla de negocio se cita en un comentario (RN-nn)", "backend/ y frontend/", f"{N} y {D}", "Código en GitHub"],
        ["Revisión de código", "El otro integrante revisa antes de integrar a la rama principal", "Cambios de cada historia", f"{N} y {D}", "Commits y pull requests de GitHub"],
        ["Pruebas", "Cada regla RN-nn con al menos una prueba, también del camino de fallo; cobertura de sentencias ≥ 80 %", "Jest y Playwright", D, f"{n_total} pruebas; cobertura medida {s_cov}"],
        ["Seguridad y privacidad", "Sin datos de tarjeta (RN-05); contraseñas con hash; sesión por JWT; 401 y 403 comprobados; /admin sin indexar", "Cuenta, pedido, pago y panel interno", D, "acceso-interno.spec.ts, pedido.controller.spec.ts y verificar-interno.mjs"],
        ["Documentación", "Plantillas del docente; versiones en GitHub; cada cifra con su fuente", "docs/", f"{N} y {D}", "Historial de commits"],
    ])

    # ---- 6. SQuaRE
    t = pl.find_table(doc, "Característica / subcaracterística")
    pl.fill_table(t, [
        ["Adecuación funcional – completitud y corrección", "Todo requisito aprobado tiene un caso de prueba que lo verifica y pasa", "% de requisitos con prueba aprobada", "100 %", "Alta"],
        ["Eficiencia de desempeño – tiempo y capacidad", "Búsqueda con P95 ≤ 1,5 s con 40.000 productos; confirmación con P95 ≤ 3 s a 900 pedidos por hora y errores ≤ 0,5 % (TEST-016)", "Segundos (P95) y % de errores", "P95 ≤ 1,5 s y ≤ 3 s; errores ≤ 0,5 %", "Alta (por medir en el sprint 3)"],
        ["Compatibilidad – coexistencia e interoperabilidad", "La aplicación usa el ERP solo por la interfaz acordada y la pasarela en modo de prueba", "Interfaces sustituibles sin tocar el dominio", "Solo cambia el adaptador", "Media"],
        ["Usabilidad – aprendizaje, operabilidad y protección frente a errores", "Una persona nueva completa las tareas de compra sin ayuda", "Tasa de éxito, tiempo, clics y SEQ de 1 a 7", "≥ 80 %; ≤ 3 × el tiempo del equipo; ≥ 5,0", "Alta"],
        ["Fiabilidad – madurez y recuperabilidad", "Pedido Pagado en ≤ 60 s tras la notificación; reserva liberada en ≤ 15 min tras un pago fallido y en ≤ 5 min tras cancelar", "Segundos y minutos", "Los de la columna anterior", "Alta"],
        ["Seguridad – confidencialidad, integridad y responsabilidad", "Ningún dato de tarjeta guardado (RN-05); la sesión interna no sirve como sesión de cliente; supresión de datos en ≤ 72 h (RN-08)", "Pruebas de 401/403 y revisión de la base de datos", "0 vulnerabilidades críticas abiertas", "Alta"],
        ["Mantenibilidad – modularidad y capacidad de prueba", "Un módulo por sub-problema y reglas en clases de dominio probadas sin base de datos", "% de sentencias cubiertas por pruebas", f"≥ 80 % (línea base: {s_cov})", "Media"],
        ["Flexibilidad – adaptabilidad y reemplazabilidad", "Un ERP real reemplaza el adaptador simulado sin cambiar el dominio", "Archivos de dominio que cambian al reemplazar el adaptador", "0", "Media"],
        ["Seguridad operacional / ausencia de riesgo", "No aplica: el producto no controla procesos físicos", "—", "—", "No aplica"],
    ])

    # ---- 6.1 calidad en uso
    t = pl.find_table(doc, "Aspecto de calidad en uso")
    pl.fill_table(t, [
        ["Efectividad", "Cliente digital nuevo; tareas del caso de uso 2 (búsqueda, carrito, compra con envío y código de descuento)", "% de tareas completadas", "≥ 80 % por tarea", "Prueba con usuarios y grabador de sesión"],
        ["Eficiencia", "Las mismas tareas en el portal local", "Tiempo (s) y clics por tarea", "Tiempo ≤ 3 × el del equipo (línea base, e2e/usabilidad/linea-base.json)", "Observación y registro de la sesión"],
        ["Satisfacción", "Cada participante, una pregunta por tarea", "SEQ de 1 (muy difícil) a 7 (muy fácil)", "Promedio ≥ 5,0 (propuesta del equipo)", "Pregunta de facilidad al terminar cada tarea"],
        ["Libertad de riesgo", "Riesgos para el usuario y el negocio", "Incidentes y severidad", "0 datos de tarjeta guardados; sobreventa ≤ 0,5 % de los pedidos del mes", "Análisis de riesgos del PGR-001"],
        ["Cobertura de contexto", "Computador (1440 px) y celular (390 px) en Chromium", "% de contextos cubiertos", "2 de 2 anchos; otros navegadores por probar", "Recorridos de Playwright y axe-core (WCAG 2.1 A y AA)"],
    ])

    # ---- 7. QA
    t = pl.find_table(doc, "Actividad QA")
    pl.fill_table(t, [
        ["Revisión de requisitos", "Por sprint, antes de la planificación", "Claridad, consistencia, verificabilidad y trazabilidad", D, "Comentarios en la historia de Jira"],
        ["Revisión de arquitectura y diseño", "Al cierre del análisis de cada sprint", "Atributos de calidad y decisiones documentadas", N, "Diagramas UML y su revisión"],
        ["Auditoría de proceso / cumplimiento", "Por hito (30/10, 13/11 y 27/11)", "Cumplimiento del plan, estándares y procedimientos", D, "Informe en este plan (sección 10.1)"],
        ["Evaluación de métricas", "Por sprint", "Datos completos y umbrales cumplidos", D, "Registro de evaluación (10.1) y KPI del plan de ejecución"],
        ["Retrospectiva y mejora", "Cada sprint", "Causas, acciones, responsable y fecha objetivo", f"{D} (Scrum Master)", "Acciones de mejora (sección 12)"],
    ])

    # ---- 8. QC / pruebas
    t = pl.find_table(doc, "Nivel / tipo de prueba")
    pl.fill_table(t, [
        ["Pruebas unitarias", "Verificar unidades aisladas.", "Jest sobre clases de dominio, sin base de datos", "Regla de negocio definida", "Todas pasan"],
        ["Pruebas de integración", "Verificar interfaces y flujos entre componentes.", "Jest con supertest y PostgreSQL de pruebas (comproya_test)", "Unidades aprobadas", "Todas pasan; la base de pruebas queda limpia"],
        ["Pruebas de sistema", "Verificar el sistema integrado frente a requisitos.", "Playwright en navegador real con capturas", "Backend, frontend y base locales arriba", "Todas las comprobaciones pasan"],
        ["Pruebas de aceptación", "Validar necesidades y criterios del usuario y del Product Owner.", "Sprint Review con los criterios TEST-nnn", "Incremento integrado", "Criterios de la historia satisfechos"],
        ["Rendimiento / carga / estrés", "Evaluar tiempos, capacidad y estabilidad.", "Script de carga sobre búsqueda y confirmación (TEST-016); herramienta por elegir en el sprint 3", "Catálogo de 40.000 productos", "P95 ≤ 1,5 s y ≤ 3 s; errores ≤ 0,5 %"],
        ["Seguridad", "Evaluar vulnerabilidades y controles.", "Pruebas de 401/403, de sesión interna y revisión de datos de tarjeta", "Rutas protegidas definidas", "0 accesos indebidos"],
        ["Usabilidad / accesibilidad", "Evaluar interacción con usuarios y tecnologías de apoyo.", "axe-core (WCAG 2.1 A y AA) y prueba con 5 participantes con grabador de sesión", "Pantallas del flujo terminadas", "0 violaciones de axe; metas de 6.1"],
        ["Compatibilidad / instalación / recuperación", "Verificar ambientes, despliegue y continuidad.", "Chromium a 1440 y 390 px; docker compose para la base", "Entorno local", "Sin desborde horizontal; otros navegadores por probar"],
    ])

    # ---- 8.1 defectos y no conformidades
    t = pl.find_table(doc, "ID", "Descripción / severidad")
    pl.fill_table(t, [
        ["DEF-001", "La API aceptaba cancelar un pedido Pagado (la pantalla no lo ofrecía). Severidad alta: rompía RN-07 y el total vendido", "Backend, módulo pedido (sprint 2)", "Alta", D, "Cerrado",
         "Causa: regla RN-09 del canon 1.0 sin actualizar al alcance reducido. Acción: regla RN-07 en PedidoService.cancelar y Pedido.puedeCancelarse", "Casos S2-PI-02, S2-PI-05 y S2-PS-02 (17/11/2026)"],
        ["NC-001", "La Declaración de alcance describe 6 sprints; el plan vigente (PGR-001 y Jira) tiene 3", "Documentos de alcance", "Media", N, "Abierto",
         "Reagrupación de sprints sin actualizar la Declaración (CH-01 del plan de cronograma)", "Pendiente: actualizar la Declaración y ratificar con la Dirección"],
        ["NC-002", "Las pruebas e2e cu-04-01, cu-09-01 y cu-09-02 verifican el flujo anterior (retiro con código) y están desfasadas", "e2e/tests", "Media", D, "Abierto",
         "El flujo pasó a venta digital con envío; las pruebas no se reescribieron", "Pendiente: reescribirlas para el flujo con envío"],
        ["NC-003", "npm audit (dependencias de producción) reporta 2 vulnerabilidades críticas: proxy-addr en el backend y next en el frontend; además 5 altas en el backend y 2 en el frontend", "backend y frontend", "Alta", N, "Abierto",
         "Las versiones de las dependencias no se han actualizado desde el sprint 1; todas tienen arreglo disponible", "Pendiente: actualizar y volver a correr las 187 pruebas"],
        ["NC-004", "El tablero de Jira no reflejaba el trabajo del sprint 2: el 13/11 solo 11 de 56 horas figuraban Finalizado, sin cambios de estado desde el 10/11", "Jira (proyecto SCRUM)", "Media", D, "Cerrado",
         "El estado de las subtareas no se actualizaba al terminar el trabajo", "Se cerraron las 24 subtareas del sprint 2 con la evidencia del segundo entregable (17/11/2026)"],
    ])

    # ---- 9. Scrum
    t = pl.find_table(doc, "Elemento Scrum", "Aplicación de calidad")
    pl.fill_table(t, [
        ["Product Backlog", "17 historias con criterios de aceptación, atributos de calidad y dependencias", "Jira: 5 épicas, 17 historias y 66 subtareas (6 por historia en 11 historias; HU-107 a HU-112 no tienen); PGR-001, Anexo 6"],
        ["Sprint Planning", "Se compromete trabajo según la capacidad de 60 h por sprint (sprint 2: 56 h; sprint 3: 43 h)", "Sprint Goal y Sprint Backlog en Jira"],
        ["Daily Scrum", "Se revisa el progreso y los bloqueos que afecten la calidad", "Estado de las subtareas en Jira"],
        ["Sprint Review", "El Product Owner inspecciona el incremento con los criterios TEST-nnn", "Incremento y decisiones del Product Owner"],
        ["Sprint Retrospective", "Se analizan las causas de defectos, como DEF-001", "Acciones de mejora con responsable (sección 12)"],
        ["Incremento", "Terminado según la definición del PGR-001: criterios cumplidos, cada regla con prueba que pasa, código sin errores de análisis estático, aceptación del Product Owner y trazabilidad al día", f"Backend y frontend integrados; {n_pasan} de {n_total} pruebas aprobadas"],
    ])

    # ---- 10. métricas
    t = pl.find_table(doc, "ID / métrica")
    pl.fill_table(t, [
        ["M-01 Densidad de defectos", "Defectos confirmados / líneas ejecutables del backend × 1000", "Defectos por 1000 líneas", "Registro de defectos y jest --coverage", "Por sprint", "≤ 2", D],
        ["M-02 Cobertura de pruebas", "Requisitos con prueba / requisitos verificables × 100; y sentencias cubiertas / total × 100", "%", "Matriz de trazabilidad y jest --coverage", "Por sprint", "100 % de requisitos; ≥ 80 % de sentencias", D],
        ["M-03 Tasa de aprobación", "Casos aprobados / casos ejecutados × 100", "%", "jest --runInBand y Playwright", "Cada integración", "100 %", D],
        ["M-04 Tasa de escape", "Defectos detectados en producción / defectos detectados totales × 100", "%", "Registro de defectos", "Por liberación", "0 % (no hay producción todavía)", D],
        ["M-05 Tiempo de respuesta", "Percentil 95 del tiempo entre solicitud y respuesta (búsqueda y confirmación)", "s", "Script de carga (TEST-016)", "Sprint 3", "≤ 1,5 s y ≤ 3 s", D],
        ["M-06 Disponibilidad", "Tiempo disponible / tiempo acordado de servicio × 100", "%", "Monitoreo del despliegue en la nube", "Mensual, desde el despliegue", "Por acordar con la organización", N],
        ["M-07 Éxito de tareas de usuario", "Tareas completadas correctamente / tareas intentadas × 100", "%", "Grabador de sesión de usabilidad", "Por sesión", "≥ 80 %", D],
        ["M-08 Satisfacción", "Promedio de la pregunta de facilidad (SEQ)", "Escala 1–7", "Grabador de sesión", "Por sesión", "≥ 5,0", D],
        ["M-09 Retrabajo", "Esfuerzo dedicado a corregir trabajo / esfuerzo total × 100", "%", "Horas de las subtareas de corrección en Jira", "Por sprint", "≤ 10 %", D],
    ])

    # ---- 10.1 registro de evaluación
    t = pl.find_table(doc, "Versión / Sprint", "Característica evaluada")
    pl.fill_table(t, [
        ["Sprint 2 (17/11/2026)", "Adecuación funcional", f"{len([f for f in s2['filas']])} comprobaciones de sistema, 16 casos del segundo entregable y {n_total} pruebas", f"{s2['ok']} de {s2['total']} comprobaciones y {n_pasan} de {n_total} pruebas aprobadas", "100 %", "Cumple", "Product Owner"],
        ["Sprint 2", "Mantenibilidad (cobertura)", "jest --coverage sobre backend/src", f"{s_cov} de sentencias; ramas {pct(cov['branches']['pct'])}", "≥ 80 % de sentencias", "Cumple", "Duván (QA)"],
        ["Sprint 2", "Seguridad", "Pruebas de 401/403, sesión interna y cancelación; npm audit de producción", "DEF-001 encontrado y corregido; npm audit: 2 críticas y 7 altas en dependencias (NC-003)", "0 vulnerabilidades críticas abiertas", "No cumple", "Duván (QA)"],
        ["Sprint 2", "Usabilidad (accesibilidad)", "axe-core en 3 pantallas internas a 1440 y 390 px (40 comprobaciones)", "0 violaciones; sin desborde horizontal", "0 violaciones", "Cumple", "Product Owner"],
        ["Sprint 2", "Usabilidad (calidad en uso)", "Línea base del equipo; sesión con participantes pendiente", "Sin datos de participantes", "Metas de 6.1", "Condicionado", "Product Owner"],
        ["Sprint 3", "Eficiencia de desempeño", "TEST-016 (búsqueda y confirmación)", "Por medir (27/11/2026)", "P95 ≤ 1,5 s y ≤ 3 s", "Pendiente", "Product Owner"],
    ])

    # ---- 11. comunicaciones
    t = pl.find_table(doc, "Informe / comunicación")
    pl.fill_table(t, [
        ["Reporte de pruebas", "Alcance, ambiente, casos, resultados, defectos y conclusión (formato de ficha del docente)", "Equipo, Product Owner y QA", "Por sprint", f"{D}; documento en docs/entrega-2"],
        ["Informe de auditoría / revisión", "Hallazgos, evidencia, no conformidades y acciones (secciones 8.1 y 12)", "Dirección de ComproYa y responsables", "Por hito", f"{D}; este plan"],
    ])

    # ---- 12. acciones
    t = pl.find_table(doc, "ID", "Hallazgo / causa raíz")
    pl.fill_table(t, [
        ["AC-01", "DEF-001: la regla de cancelación seguía la del canon 1.0. Causa raíz: la regla cambió en el alcance reducido y ninguna prueba comparaba el código con la Declaración",
         "Cada regla RN-nn de la Declaración tiene al menos una prueba que la cita, incluido el camino de fallo; se revisa en cada Sprint Review", D, "27/11/2026",
         "0 reglas cuyo código difiera de la Declaración al cierre del sprint 3", "En curso"],
        ["AC-02", "NC-001: la Declaración de alcance conserva 6 sprints", "Actualizar la Declaración a 3 sprints y ratificarla con la Dirección", N, "24/11/2026",
         "Declaración y PGR-001 con el mismo número de sprints", "Abierta"],
        ["AC-03", "NC-002: pruebas e2e desfasadas del flujo con retiro", "Reescribir cu-04-01, cu-09-01 y cu-09-02 para la venta con envío", D, "27/11/2026",
         "3 pruebas e2e pasan contra el flujo actual", "Abierta"],
        ["AC-04", "NC-003: dependencias con vulnerabilidades críticas y altas", "Actualizar @nestjs/platform-express, @nestjs/config y next a una versión con arreglo; correr npm audit y las pruebas", N, "27/11/2026",
         "npm audit sin vulnerabilidades críticas y 187 pruebas aprobadas", "Abierta"],
        ["AC-05", "NC-004: Jira desactualizado al cierre del sprint 2", "Cerrar cada subtarea el mismo día en que termina y revisar el tablero en la Daily Scrum", D, "Cada sprint",
         "SPI medido en la fecha de cierre del sprint sin diferencias con el trabajo real", "En curso"],
    ])

    # ---- 13. aceptación final
    t = pl.find_table(doc, "Criterio de aceptación final")
    pl.fill_table(t, [
        ["Requisitos de alcance comprometidos verificados", "Sprints 1 y 2: historias HU-102 a HU-116 con sus pruebas; sprint 3 (HU-101 y HU-117) por cerrar el 27/11/2026", "Parcial", "Se completa al cierre del sprint 3"],
        ["Requisitos de calidad críticos satisfechos", "Mantenibilidad cumple; seguridad no cumple por NC-003; TEST-016 y TEST-017 pendientes", "No", "Se completa al cierre del sprint 3"],
        ["Pruebas requeridas ejecutadas y resultados aceptables", f"{n_pasan} de {n_total} pruebas y {s2['ok']} de {s2['total']} comprobaciones de sistema del sprint 2", "Sí", "Para los sprints 1 y 2"],
        ["Defectos abiertos evaluados y aceptados formalmente si aplica", "DEF-001 y NC-004 cerrados; NC-001, NC-002 y NC-003 abiertas con acción", "Parcial", "Aprobación del Product Owner pendiente"],
        ["Documentación, operación y soporte entregados", "Planes de requisitos, cronograma, calidad y ejecución; segundo entregable", "Parcial", "Despliegue en la nube pendiente"],
        ["Riesgos comunicados y aprobados", "Riesgos en el PGR-001; festivos del 02 y 16 de noviembre en el cronograma", "Parcial", "Aprobación de la Dirección pendiente"],
    ])

    # ---- 15. anexos
    anexos = [
        ("Anexo A. Matriz de trazabilidad", "Anexo A. Matriz de trazabilidad requisito–característica de calidad–prueba–resultado: PGR-001 (sección 7) y Segundo entregable, Anexo B."),
        ("Anexo B. Catálogo de métricas", "Anexo B. Catálogo de métricas ISO/IEC 25023 aplicables y fichas de medición: sección 10 de este plan y docs/usabilidad (métricas externas de usabilidad)."),
        ("Anexo C. Listas de chequeo", "Anexo C. Listas de chequeo para revisiones de requisitos, diseño, código y liberación: Anexo A de los planes de gestión."),
        ("Anexo D. Plan detallado", "Anexo D. Plan detallado de pruebas y matriz de cobertura: Plan_Pruebas_ComproYa.docx y docs/entrega-2/evidencia/cobertura-por-archivo.txt."),
        ("Anexo E. Definición de criterios", "Anexo E. Definición de criterios de aceptación vigentes: PGR-001, Anexo 6.5."),
        ("Anexo F. Registro de defectos", "Anexo F. Registro de defectos, no conformidades, riesgos y acciones de mejora: secciones 8.1 y 12 de este plan."),
        ("Anexo G. Evidencias de evaluación", "Anexo G. Evidencias de evaluación de calidad en uso y pruebas con usuarios: docs/usabilidad (guía, registro y sesiones grabadas)."),
    ]
    for inicio, texto in anexos:
        pl.set_paragraph_text(pl.find_paragraph(doc, inicio), texto)

    destino.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(destino))


if __name__ == "__main__":
    construir(Path(sys.argv[1]), Path(sys.argv[2]), SALIDA / "Plan_Gestion_Calidad_ComproYa.docx")
    print("listo", SALIDA)
