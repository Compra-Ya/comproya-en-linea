"""Modelo del cronograma de ComproYa en Línea: actividades, dependencias y ruta crítica (CPM).

Fuentes de los datos (todas verificables):
  * Historias, sprints, responsables y horas por fase: tablero de Jira, proyecto SCRUM
    (sprints 2 y 3 traen las horas en el nombre de cada subtarea; el sprint 1 no las traía).
  * Fechas de los sprints: Jira (S1 19-oct a 30-oct, S2 02-nov a 13-nov, S3 16-nov a 27-nov de 2026).
  * Festivos: paquete `holidays` (Colombia 2026): 02-nov y 16-nov, primer día de los sprints 2 y 3 (riesgo de capacidad).
  * Ventanas de las entregas académicas: Aula virtual del curso (aperturas y cierres).

Método: CPM sobre días hábiles de un integrante (1 día = 3 horas-persona, supuesto del equipo).
Cada sprint es una caja de tiempo (timebox): el trabajo de sus historias tiene holgura frente al
cierre del sprint; la ruta crítica del proyecto es la cadena de cajas de tiempo hasta el cierre.
"""
from __future__ import annotations

import datetime as dt
from dataclasses import dataclass, field

HORAS_POR_DIA = 3.0
INICIO = dt.date(2026, 10, 19)
# Festivos de Colombia en el periodo (paquete `holidays`): 02-nov y 16-nov caen en el primer día de los sprints 2 y 3.
# El Plan de gestión de requisitos fija 10 días hábiles por sprint (60 h): el cronograma los mantiene y registra el
# festivo como riesgo de capacidad (54 h si el equipo no trabaja esos días).
FESTIVOS_CO = {dt.date(2026, 11, 2), dt.date(2026, 11, 16), dt.date(2026, 12, 8), dt.date(2026, 12, 25)}
FESTIVOS: set[dt.date] = set()

SPRINTS = {
    1: dict(nombre="Sprint 1 · Flujo de compra", inicio=dt.date(2026, 10, 19), fin=dt.date(2026, 10, 30)),
    2: dict(nombre="Sprint 2 · Flujo gerencial", inicio=dt.date(2026, 11, 2), fin=dt.date(2026, 11, 13)),
    3: dict(nombre="Sprint 3 · Flujo de catálogo", inicio=dt.date(2026, 11, 16), fin=dt.date(2026, 11, 27)),
}

NICOLAS = "Nicolás Cancimance"
DUVAN = "Duván Serrano"

FASES = [  # orden lógico del ciclo de vida dentro de cada historia
    ("RQ", "Requerimientos"),
    ("MO", "Modelado"),
    ("DI", "Diseño"),
    ("IM", "Implementación"),
    ("PR", "Pruebas"),
    ("EN", "Entrega"),
]

# Horas por fase tomadas de las subtareas de Jira (sprints 2 y 3): RQ, MO, DI, IM, PR, EN
HORAS_JIRA = {
    "HU-113": (1, 1, 2, 5, 2, 1),
    "HU-114": (2, 2, 3, 8, 3, 1),
    "HU-115": (1, 1, 2, 4, 2, 1),
    "HU-116": (2, 1, 2, 5, 3, 1),
    "HU-101": (2, 2, 3, 8, 3, 1),
    "HU-117": (2, 1, 3, 6, 10, 2),
}

# Historias: id, jira, nombre, caso de uso, sprint, responsable, peso (solo sprint 1), predecesoras (historias)
HISTORIAS = [
    ("HU-102", "SCRUM-11", "Buscar productos", "CU-02", 1, NICOLAS, 2, []),
    ("HU-103", "SCRUM-12", "Ver unidades disponibles", "CU-03", 1, DUVAN, 2, ["HU-104"]),
    ("HU-104", "SCRUM-13", "Existencias desde el ERP (paquete 1.1.4)", "1.1.4", 1, NICOLAS, 2, []),
    ("HU-105", "SCRUM-14", "Crear cuenta e ingresar", "CU-04", 1, DUVAN, 3, []),
    ("HU-106", "SCRUM-15", "Consentimiento y supresión", "CU-05", 1, NICOLAS, 2, ["HU-105"]),
    ("HU-107", "SCRUM-16", "Administrar carrito", "CU-06", 1, DUVAN, 2, ["HU-103"]),
    ("HU-108", "SCRUM-17", "Confirmar pedido con envío", "CU-07", 1, NICOLAS, 3, ["HU-107", "HU-110", "HU-105"]),
    ("HU-109", "SCRUM-18", "Aplicar código de descuento", "CU-08", 1, DUVAN, 1, ["HU-108"]),
    ("HU-110", "SCRUM-19", "Reservar y liberar en el ERP (paquete 1.3.4)", "1.3.4", 1, NICOLAS, 2, ["HU-104"]),
    ("HU-111", "SCRUM-20", "Pagar con tarjeta", "CU-11", 1, DUVAN, 3, ["HU-108", "HU-110"]),
    ("HU-112", "SCRUM-21", "Ver comprobante", "CU-12", 1, NICOLAS, 1, ["HU-111"]),
    ("HU-113", "SCRUM-22", "Consultar mis pedidos", "CU-09", 2, DUVAN, 0, ["HU-108", "HU-105"]),
    ("HU-114", "SCRUM-23", "Consultar ventas", "CU-09", 2, NICOLAS, 0, ["HU-116", "HU-111"]),
    ("HU-115", "SCRUM-24", "Cancelar pedido", "CU-10", 2, NICOLAS, 0, ["HU-108", "HU-110"]),
    ("HU-116", "SCRUM-25", "Ingresar como Coordinador (paquete 1.2.3)", "1.2.3", 2, DUVAN, 0, ["HU-105"]),
    ("HU-101", "SCRUM-10", "Publicar producto", "CU-01", 3, NICOLAS, 0, ["HU-116", "HU-104"]),
    ("HU-117", "SCRUM-26", "Medir calidad (paquete 1.5.3)", "1.5.3", 3, DUVAN, 0, ["HU-102", "HU-108", "HU-111"]),
]

CAPACIDAD_S1 = 60.0  # horas-persona por sprint (Declaración de alcance, restricciones)


def _redondear_medio(x: float) -> float:
    return round(x * 2) / 2


def horas_sprint1() -> dict[str, tuple[float, ...]]:
    """Reconstruye las horas del sprint 1 (no se registraron en Jira): 60 h repartidas por peso
    de la historia y por el perfil de fases de los sprints 2 y 3 (99 h en total)."""
    perfil = [sum(h[i] for h in HORAS_JIRA.values()) for i in range(6)]
    total = sum(perfil)
    pesos = {h[0]: h[6] for h in HISTORIAS if h[4] == 1}
    suma_pesos = sum(pesos.values())
    res: dict[str, tuple[float, ...]] = {}
    for hid, peso in pesos.items():
        horas_hist = round(CAPACIDAD_S1 * peso / suma_pesos)
        partes = [_redondear_medio(horas_hist * p / total) for p in perfil]
        partes = [max(0.5, x) for x in partes]
        partes[3] = max(0.5, partes[3] + (horas_hist - sum(partes)))  # el ajuste va a Implementación
        res[hid] = tuple(partes)
    # el redondeo por historia puede dejar el total del sprint ±1 h: se ajusta en la mayor
    delta = CAPACIDAD_S1 - sum(sum(v) for v in res.values())
    if abs(delta) > 1e-9:
        mayor = max(res, key=lambda k: sum(res[k]))
        v = list(res[mayor]); v[3] += delta; res[mayor] = tuple(v)
    return res


# Avance según Jira antes de la gestión del 17-nov-2026 (subtareas Finalizado): fase -> hecho
# Se actualiza desde el tablero en `cronograma_avance.json` cuando exista (ver build_cronograma.py).


@dataclass
class Actividad:
    id: str
    nombre: str
    duracion: float            # días hábiles de un integrante
    horas: float = 0.0
    preds: list[str] = field(default_factory=list)
    sprint: int | None = None
    responsable: str = ""
    tipo: str = "trabajo"      # trabajo | hito | timebox | gerencia
    historia: str | None = None
    fase: str | None = None
    snet: int | None = None    # no empezar antes del día hábil (índice)
    fnlt: int | None = None    # terminar a más tardar el día hábil (índice)
    # resultados CPM
    es: float = 0.0
    ef: float = 0.0
    ls: float = 0.0
    lf: float = 0.0
    holgura: float = 0.0        # frente a la fecha límite (si existe) o al fin del proyecto
    holgura_proy: float = 0.0   # solo frente al fin del proyecto (define la ruta crítica)
    critica: bool = False


# ------------------------------------------------------------------ calendario
def dias_habiles(desde: dt.date, hasta: dt.date) -> list[dt.date]:
    d, out = desde, []
    while d <= hasta:
        if d.weekday() < 5 and d not in FESTIVOS:
            out.append(d)
        d += dt.timedelta(days=1)
    return out


CALENDARIO = dias_habiles(INICIO, dt.date(2026, 12, 31))
INDICE = {d: i for i, d in enumerate(CALENDARIO)}


def fecha_inicio(es: float) -> dt.date:
    return CALENDARIO[min(int(es + 1e-9), len(CALENDARIO) - 1)]


def fecha_fin(ef: float, dur: float) -> dt.date:
    if dur == 0:
        return CALENDARIO[min(max(int(ef + 1e-9) - 1, 0), len(CALENDARIO) - 1)] if ef > 0 else CALENDARIO[0]
    idx = int(-(-ef // 1)) - 1  # ceil(ef) - 1
    return CALENDARIO[max(idx, 0)]


def idx_dia(fecha: dt.date) -> int:
    """Índice del día hábil que contiene la fecha (o el siguiente día hábil)."""
    d = fecha
    while d not in INDICE:
        d += dt.timedelta(days=1)
    return INDICE[d]


# ------------------------------------------------------------------ construcción
def construir() -> list[Actividad]:
    acts: dict[str, Actividad] = {}

    def add(a: Actividad) -> Actividad:
        acts[a.id] = a
        return a

    inicio = add(Actividad("INI", "Inicio del proyecto (19-oct-2026)", 0, tipo="hito"))
    # Gerencia (EDT 1.5) -----------------------------------------------------------------
    add(Actividad("G-01", "Acta de constitución, plan de alcance y declaración de alcance (1.5.1)", 2,
                  preds=["INI"], tipo="gerencia", responsable=f"{NICOLAS} / {DUVAN}"))

    h1 = horas_sprint1()
    fin_sprint: dict[int, str] = {}
    for n, sp in SPRINTS.items():
        ini_id, fin_id, box_id = f"IS{n}", f"FS{n}", f"TB{n}"
        previo = ["INI"] if n == 1 else [f"FS{n-1}"]
        add(Actividad(ini_id, f"Inicio del sprint {n} (planificación del sprint)", 0, preds=previo,
                      sprint=n, tipo="hito", snet=idx_dia(sp["inicio"])))
        n_dias = len(dias_habiles(sp["inicio"], sp["fin"]))
        add(Actividad(box_id, f"{sp['nombre']} (caja de tiempo de {n_dias} días hábiles)", n_dias,
                      preds=[ini_id], sprint=n, tipo="timebox", responsable=f"{NICOLAS} / {DUVAN}"))
        fin_sprint[n] = fin_id

    work_end: dict[int, list[str]] = {1: [], 2: [], 3: []}
    for (hid, jira, nombre, cu, sprint, resp, _peso, preds_h) in HISTORIAS:
        horas = HORAS_JIRA.get(hid) or h1[hid]
        previo_fase = None
        for k, (cod, fase_nombre) in enumerate(FASES):
            aid = f"{hid}-{cod}"
            preds = [f"IS{sprint}"] if previo_fase is None else [previo_fase]
            if cod == "IM":
                preds = preds + [f"{p}-IM" for p in preds_h]
            if cod == "PR":
                preds = preds + [f"{p}-IM" for p in preds_h]
            add(Actividad(aid, f"{hid} · {fase_nombre}: {nombre}", horas[k] / HORAS_POR_DIA, horas=horas[k],
                          preds=preds, sprint=sprint, responsable=resp, tipo="trabajo", historia=hid, fase=cod))
            previo_fase = aid
        work_end[sprint].append(previo_fase)

    # Cierre de sprint: depende de todas sus historias y de la caja de tiempo
    for n in (1, 2, 3):
        extra = ["G-01"] if n == 1 else []
        add(Actividad(f"FS{n}", f"Fin del sprint {n} (Sprint Review y retrospectiva)", 0,
                      preds=[f"TB{n}"] + work_end[n] + extra, sprint=n, tipo="hito"))

    # Entregas de gerencia con ventana del Aula virtual (fecha de cierre = restricción FNLT)
    def fin_idx(f: dt.date) -> int:
        return idx_dia(f) + 1

    ac = [
        ("G-02", "Plan de gestión de requisitos (PGR-001)", 5, dt.date(2026, 11, 3), dt.date(2026, 11, 10), ["FS1"]),
        ("G-03", "Plan de gestión del cronograma", 6, dt.date(2026, 11, 10), dt.date(2026, 11, 18), ["G-02"]),
        ("G-04", "Plan de gestión de la calidad", 5, dt.date(2026, 11, 16), dt.date(2026, 11, 24), ["G-02"]),
        ("G-05", "Segundo entregable (segundo sprint): análisis, diseño, pruebas y usabilidad", 5,
         dt.date(2026, 11, 16), dt.date(2026, 11, 24), ["FS2"]),
        ("G-06", "Gestión de la ejecución: KPI del segundo entregable", 3, dt.date(2026, 11, 19), dt.date(2026, 11, 24),
         ["FS2"]),
    ]
    for (aid, nombre, dur, ini, fin, preds) in ac:
        add(Actividad(aid, f"{nombre} — ventana {ini:%d-%b} a {fin:%d-%b}", dur, preds=preds,
                      tipo="gerencia", responsable=f"{NICOLAS} / {DUVAN}", snet=idx_dia(ini), fnlt=fin_idx(fin)))
    add(Actividad("G-07", "Seguimiento y control de sprints (1.5.3, transversal)", 0, preds=["INI"], tipo="gerencia",
                  responsable=DUVAN))
    add(Actividad("CIE", "Cierre del proyecto (1.5.4)", 0, preds=["FS3", "G-04", "G-05", "G-06"], tipo="hito",
                  responsable=f"{NICOLAS} / {DUVAN}"))
    return list(acts.values())


# ------------------------------------------------------------------ CPM
def calcular(acts: list[Actividad]) -> list[Actividad]:
    por_id = {a.id: a for a in acts}
    sucesoras: dict[str, list[str]] = {a.id: [] for a in acts}
    for a in acts:
        for p in a.preds:
            sucesoras[p].append(a.id)

    # orden topológico
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

    for i in orden:  # pasada hacia adelante
        a = por_id[i]
        es = max((por_id[p].ef for p in a.preds), default=0.0)
        if a.snet is not None:
            es = max(es, float(a.snet))
        a.es, a.ef = es, es + a.duracion

    fin_proy = max(a.ef for a in acts)
    lsp: dict[str, float] = {}
    for i in reversed(orden):  # pasada hacia atrás (sin fechas límite): ruta crítica del proyecto
        a = por_id[i]
        lf = min((lsp[s] for s in sucesoras[i]), default=fin_proy)
        lsp[i] = lf - a.duracion
        a.holgura_proy = round(lf - a.ef, 4)
        a.critica = abs(a.holgura_proy) < 1e-6
    for i in reversed(orden):  # pasada hacia atrás con fechas límite de las entregas académicas
        a = por_id[i]
        lf = min((por_id[s].ls for s in sucesoras[i]), default=fin_proy)
        if a.fnlt is not None:
            lf = min(lf, float(a.fnlt))
        a.lf, a.ls = lf, lf - a.duracion
        a.holgura = round(a.lf - a.ef, 4)
    return acts


def ruta_critica(acts: list[Actividad]) -> list[Actividad]:
    return sorted([a for a in acts if a.critica and a.tipo != "hito"], key=lambda a: (a.es, a.id))


def modelo() -> list[Actividad]:
    return calcular(construir())


def resumen() -> dict:
    acts = modelo()
    return dict(
        n_actividades=len(acts),
        n_trabajo=sum(1 for a in acts if a.tipo == "trabajo"),
        horas_trabajo=sum(a.horas for a in acts if a.tipo == "trabajo"),
        fin_proyecto_dia=max(a.ef for a in acts),
        fecha_fin=fecha_fin(max(a.ef for a in acts), 1),
        critica=[a.id for a in ruta_critica(acts)],
    )


if __name__ == "__main__":
    import json
    acts = modelo()
    r = resumen()
    print(json.dumps({k: (str(v) if not isinstance(v, (list, int, float)) else v) for k, v in r.items()},
                     ensure_ascii=False, indent=1))
    for n in (1, 2, 3):
        hs = [a for a in acts if a.tipo == "trabajo" and a.sprint == n]
        print(f"Sprint {n}: {sum(a.horas for a in hs):g} h en {len(hs)} actividades")
    cola = sorted((a for a in acts if a.tipo == "trabajo"), key=lambda a: a.holgura)[:6]
    for a in cola:
        print("menor holgura:", a.id, round(a.holgura, 2), fecha_inicio(a.es), fecha_fin(a.ef, a.duracion))
