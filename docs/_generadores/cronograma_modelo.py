"""Modelo del cronograma de ComproYa en Línea fiel a Jira: actividades, dependencias y ruta crítica (CPM).

Qué hay realmente en Jira (proyecto SCRUM, consultado el 17-nov-2026):
  * 17 historias (HU-101 a HU-117) en 5 épicas (los 5 entregables de la EDT).
  * 66 subtareas: HU-101 y HU-117 (sprint 3) y HU-113 a HU-116 (sprint 2) con sus horas en el nombre (36 subtareas, 99 h), y
    HU-102 a HU-106 (sprint 1) sin horas. HU-107 a HU-112 no tienen subtareas.
Por eso el cronograma identifica: las 36 subtareas con horas de los sprints 2 y 3 (con su clave de Jira), las 11 historias del
sprint 1 como ventanas del sprint (sus horas no se registraron: no se inventan) y los paquetes de gerencia de la EDT (1.5).

Método: CPM en horas-persona con calendario del equipo (lunes a viernes, 3 h por día, 08:00 a 11:00). Una persona hace una
historia a la vez (dependencia de recurso) y cada sprint termina con su Sprint Review (restricción de fecha final).
"""
from __future__ import annotations

import datetime as dt
from dataclasses import dataclass, field

HORAS_POR_DIA = 3
INICIO = dt.date(2026, 10, 19)
# Festivos de Colombia en el periodo (paquete `holidays`): 02-nov y 16-nov, primer día de los sprints 2 y 3. El Plan de gestión de
# requisitos los cuenta como días hábiles (10 por sprint, 60 h): el cronograma conserva ese supuesto y los registra como riesgo.
FESTIVOS_CO = {dt.date(2026, 11, 2), dt.date(2026, 11, 16)}

NICOLAS = "Nicolás Santiago Cancimance Pabón"
DUVAN = "Duván Camilo Serrano Rojas"
CORTO = {NICOLAS: "Nicolás", DUVAN: "Duván"}

SPRINTS = {
    1: dict(nombre="Sprint 1 · Flujo de compra", ini_h=0, fin_h=30, inicio=dt.date(2026, 10, 19), fin=dt.date(2026, 10, 30)),
    2: dict(nombre="Sprint 2 · Flujo gerencial", ini_h=30, fin_h=60, inicio=dt.date(2026, 11, 2), fin=dt.date(2026, 11, 13)),
    3: dict(nombre="Sprint 3 · Flujo de catálogo", ini_h=60, fin_h=90, inicio=dt.date(2026, 11, 16), fin=dt.date(2026, 11, 27)),
}
FIN_PROYECTO_H = 90

FASES = [("MO", "Modelado"), ("RQ", "Requerimientos"), ("DI", "Diseño"), ("IM", "Implementación"), ("PR", "Pruebas"), ("EN", "Entrega")]

# Historias: id, clave Jira, nombre, caso de uso o paquete, sprint, responsable, historias de las que depende (Jira, «Depende de»)
HISTORIAS = [
    ("HU-102", "SCRUM-11", "Buscar productos", "CU-02", 1, NICOLAS, []),
    ("HU-103", "SCRUM-12", "Ver unidades disponibles", "CU-03", 1, DUVAN, ["HU-104"]),
    ("HU-104", "SCRUM-13", "Existencias desde el ERP (paquete 1.1.4)", "1.1.4", 1, NICOLAS, []),
    ("HU-105", "SCRUM-14", "Crear cuenta e ingresar", "CU-04", 1, DUVAN, []),
    ("HU-106", "SCRUM-15", "Consentimiento y supresión", "CU-05", 1, NICOLAS, ["HU-105"]),
    ("HU-107", "SCRUM-16", "Administrar carrito", "CU-06", 1, DUVAN, ["HU-102"]),
    ("HU-108", "SCRUM-17", "Confirmar pedido con envío", "CU-07", 1, NICOLAS, ["HU-107", "HU-110", "HU-104"]),
    ("HU-109", "SCRUM-18", "Aplicar código de descuento", "CU-08", 1, DUVAN, ["HU-108"]),
    ("HU-110", "SCRUM-19", "Reservar y liberar en el ERP (paquete 1.3.4)", "1.3.4", 1, NICOLAS, []),
    ("HU-111", "SCRUM-20", "Pagar con tarjeta", "CU-11", 1, DUVAN, ["HU-108"]),
    ("HU-112", "SCRUM-21", "Ver comprobante", "CU-12", 1, NICOLAS, ["HU-111"]),
    ("HU-113", "SCRUM-22", "Consultar mis pedidos", "CU-09", 2, DUVAN, ["HU-108"]),
    ("HU-114", "SCRUM-23", "Consultar ventas", "CU-09", 2, NICOLAS, ["HU-111", "HU-116"]),
    ("HU-115", "SCRUM-24", "Cancelar pedido", "CU-10", 2, NICOLAS, ["HU-108"]),
    ("HU-116", "SCRUM-25", "Ingresar como Coordinador (paquete 1.2.3)", "1.2.3", 2, DUVAN, ["HU-105"]),
    ("HU-101", "SCRUM-10", "Publicar producto", "CU-01", 3, NICOLAS, ["HU-104", "HU-116", "HU-111"]),
    ("HU-117", "SCRUM-26", "Medir calidad (paquete 1.5.3)", "1.5.3", 3, DUVAN, ["HU-111"]),
]
POR_HU = {h[0]: h for h in HISTORIAS}

# Subtareas reales de Jira con horas (sprints 2 y 3): número de la primera subtarea (Modelado) y horas MO, RQ, DI, IM, PR, EN
SUBTAREAS = {
    "HU-113": (63, (1, 1, 2, 5, 2, 1)),
    "HU-114": (69, (2, 2, 3, 8, 3, 1)),
    "HU-115": (75, (1, 1, 2, 4, 2, 1)),
    "HU-116": (81, (1, 2, 2, 5, 3, 1)),
    "HU-101": (27, (2, 2, 3, 8, 3, 1)),
    "HU-117": (87, (1, 2, 3, 6, 10, 2)),
}
# Orden en que cada integrante hace sus historias (dependencia de recurso: una persona, una historia a la vez)
ORDEN_RECURSO = {NICOLAS: ["HU-115", "HU-114", "HU-101"], DUVAN: ["HU-116", "HU-113", "HU-117"]}
# Subtareas de Jira del sprint 1 sin horas (HU-102 a HU-106): primer número de cada grupo de 6
S1_CON_SUBTAREAS = {"HU-102": 33, "HU-103": 39, "HU-104": 45, "HU-105": 51, "HU-106": 57}

CIERRE_H = 6  # ACT-04: 2 días hábiles de ambos integrantes (12 horas-persona), supuesto del equipo


@dataclass
class Actividad:
    id: str
    nombre: str
    horas: float                     # duración en horas del calendario del equipo
    preds: list[str] = field(default_factory=list)
    sprint: int | None = None
    responsable: str = ""
    tipo: str = "trabajo"            # trabajo | ventana | gerencia | cierre | hito
    historia: str | None = None
    fase: str | None = None
    jira: str | None = None
    snet: int | None = None          # no empezar antes de la hora h
    fnlt: int | None = None          # terminar a más tardar en la hora h
    avance: int = 0                  # % completado según Jira al 17-nov-2026
    es: float = 0.0
    ef: float = 0.0
    ls: float = 0.0
    lf: float = 0.0
    holgura: float = 0.0
    critica: bool = False


def _dias(desde: dt.date, n: int) -> list[dt.date]:
    out, d = [], desde
    while len(out) < n:
        if d.weekday() < 5:
            out.append(d)
        d += dt.timedelta(days=1)
    return out


CALENDARIO = _dias(INICIO, 60)
INDICE = {d: i for i, d in enumerate(CALENDARIO)}


def fecha_hora(h: float) -> dt.datetime:
    """Instante de reloj (08:00 a 11:00 de cada día hábil) del punto h del eje de horas del equipo."""
    d = int(h // HORAS_POR_DIA)
    r = h - d * HORAS_POR_DIA
    return dt.datetime.combine(CALENDARIO[d], dt.time(8, 0)) + dt.timedelta(hours=r)


def fecha_inicio(h: float) -> dt.date:
    return CALENDARIO[min(int(h // HORAS_POR_DIA), len(CALENDARIO) - 1)]


def fecha_fin(h: float) -> dt.date:
    """Fecha en que termina una actividad cuyo fin es el punto h (un fin a las 11:00 es de ese mismo día)."""
    return CALENDARIO[max(0, int((h - 1e-9) // HORAS_POR_DIA))]


def fin_reloj(h: float) -> dt.datetime:
    d = max(0, int((h - 1e-9) // HORAS_POR_DIA))
    r = h - d * HORAS_POR_DIA
    return dt.datetime.combine(CALENDARIO[d], dt.time(8, 0)) + dt.timedelta(hours=r)


def id_entrega(hid: str) -> str:
    return f"SCRUM-{SUBTAREAS[hid][0] + 5}"


def construir() -> list[Actividad]:
    acts: dict[str, Actividad] = {}

    def add(a: Actividad) -> Actividad:
        acts[a.id] = a
        return a

    add(Actividad("ACT-01", "Acta de constitución (entregada antes del inicio)", 0, tipo="hito", responsable="Nicolás y Duván", snet=0, avance=100))
    add(Actividad("ACT-02", "Plan de trabajo y backlog priorizado: planes de requisitos, alcance, cronograma, calidad y ejecución",
                  81, tipo="gerencia", responsable="Nicolás y Duván", snet=0, avance=60))
    add(Actividad("ACT-03", "Seguimiento y control de sprints", 87, tipo="gerencia", responsable="Nicolás con Duván", snet=0, avance=70))

    for (hid, jira, nombre, cu, sprint, resp, deps) in HISTORIAS:  # sprint 1: ventana del sprint, sin horas registradas
        if sprint == 1:
            add(Actividad(hid, f"{hid} {nombre}", 30, sprint=1, responsable=resp, tipo="ventana", historia=hid, jira=jira,
                          snet=0, fnlt=30, avance=100))

    for resp, orden in ORDEN_RECURSO.items():  # sprints 2 y 3: las 6 subtareas de Jira de cada historia
        previa = None
        for hid in orden:
            base, horas = SUBTAREAS[hid]
            _, jira, nombre, cu, sprint, _, deps = POR_HU[hid]
            anterior = None
            for k, (cod, fase_n) in enumerate(FASES):
                aid = f"SCRUM-{base + k}"
                preds = [anterior] if anterior else ([previa] if previa else [])
                if cod == "IM":  # la implementación espera la entrega de las historias de las que depende
                    preds += [id_entrega(d) for d in deps if d in SUBTAREAS]
                    preds += [d for d in deps if POR_HU[d][4] == 1]
                add(Actividad(aid, f"{fase_n} · {hid} {nombre}", horas[k], preds=preds, sprint=sprint, responsable=resp,
                              historia=hid, fase=cod, jira=aid, snet=SPRINTS[sprint]["ini_h"] if k == 0 else None,
                              fnlt=SPRINTS[sprint]["fin_h"] if cod == "EN" else None, avance=100 if sprint == 2 else 0))
                anterior = aid
            previa = id_entrega(hid)

    add(Actividad("ACT-04", "Cierre del proyecto: resultados de pruebas, informe de usabilidad y lista de pendientes", CIERRE_H,
                  preds=[id_entrega("HU-101"), id_entrega("HU-117")], sprint=3, tipo="cierre", responsable="Nicolás y Duván",
                  fnlt=FIN_PROYECTO_H, avance=0))
    return list(acts.values())


def calcular(acts: list[Actividad]) -> list[Actividad]:
    por_id = {a.id: a for a in acts}
    sucesoras: dict[str, list[str]] = {a.id: [] for a in acts}
    for a in acts:
        for p in a.preds:
            sucesoras[p].append(a.id)
    orden: list[str] = []
    visto: set[str] = set()

    def visitar(i: str) -> None:
        if i in visto:
            return
        visto.add(i)
        for p in por_id[i].preds:
            visitar(p)
        orden.append(i)

    for a in acts:
        visitar(a.id)
    for i in orden:  # hacia adelante
        a = por_id[i]
        es = max((por_id[p].ef for p in a.preds), default=0.0)
        if a.snet is not None:
            es = max(es, float(a.snet))
        a.es, a.ef = es, es + a.horas
    for i in reversed(orden):  # hacia atrás
        a = por_id[i]
        lf = min((por_id[s].ls for s in sucesoras[i]), default=float(FIN_PROYECTO_H))
        if a.fnlt is not None:
            lf = min(lf, float(a.fnlt))
        a.lf, a.ls = lf, lf - a.horas
        a.holgura = round(a.lf - a.ef, 4)
        a.critica = a.tipo in ("trabajo", "cierre") and abs(a.holgura) < 1e-6
    return acts


def modelo() -> list[Actividad]:
    return calcular(construir())


def ruta_critica(acts: list[Actividad]) -> list[Actividad]:
    return sorted([a for a in acts if a.critica], key=lambda a: (a.es, a.id))


def horas_historia(acts: list[Actividad], hid: str) -> float:
    return sum(a.horas for a in acts if a.historia == hid and a.tipo == "trabajo")


def span_historia(acts: list[Actividad], hid: str) -> tuple[float, float]:
    fs = [a for a in acts if a.historia == hid]
    return min(a.es for a in fs), max(a.ef for a in fs)


if __name__ == "__main__":
    acts = modelo()
    tr = [a for a in acts if a.tipo == "trabajo"]
    print("actividades:", len(acts), "| subtareas Jira con horas:", len(tr), "| horas:", sum(a.horas for a in tr))
    for n in (2, 3):
        print(f"sprint {n}:", sum(a.horas for a in tr if a.sprint == n), "h")
    cr = ruta_critica(acts)
    print("críticas:", len(cr), [a.id for a in cr])
    print("holgura de historias:", {h: round(min(a.holgura for a in acts if a.historia == h), 1) for h in SUBTAREAS})
    print("fin del proyecto:", fin_reloj(max(a.ef for a in acts)))
