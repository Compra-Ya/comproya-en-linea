"""Escribe docs/cronograma/Cronograma_ComproYa.xml (formato MSPDI: lo abren MS Project y ProjectLibre) desde el modelo CPM.

El archivo trae calendario del equipo (lunes a viernes, 3 h por día), las 51 actividades con sus vínculos (técnicos y de recurso),
restricciones de inicio (Sprint Planning) y de fin (Sprint Review), 2 recursos y su asignación. MS Project recalcula la ruta
crítica al abrirlo: las restricciones de fin de cada sprint hacen que el cálculo de la herramienta coincida con el del modelo.
"""
from __future__ import annotations

from pathlib import Path
from xml.sax.saxutils import escape

import cronograma_modelo as m

FMT = "%Y-%m-%dT%H:%M:%S"
RECURSOS = {m.NICOLAS: (1, "NC"), m.DUVAN: (2, "DS")}


def _dur(h: float) -> str:
    return f"PT{int(h) if h == int(h) else h}H0M0S"


def escribir(destino: Path) -> dict:
    acts = m.modelo()
    por_id = {a.id: a for a in acts}
    uid: dict[str, int] = {}
    filas: list[str] = []
    asig: list[tuple[int, int, float]] = []
    contador = [0]

    def nuevo(clave: str) -> int:
        contador[0] += 1
        uid[clave] = contador[0]
        return contador[0]

    def tarea(u: int, nombre: str, wbs: str, nivel: int, resumen: bool, es: float, ef: float, hito: bool = False, critica: bool = False,
              avance: int = 0, snet: int | None = None, fnlt: int | None = None, preds: list[str] | None = None, notas: str = "",
              horas: float | None = None) -> None:
        ini, fin = m.fecha_hora(es), m.fin_reloj(ef) if ef > es else m.fecha_hora(es)
        dur = _dur(0 if hito else (horas if horas is not None else ef - es))
        x = [f"<Task><UID>{u}</UID><ID>{u}</ID><Name>{escape(nombre)}</Name><WBS>{escape(wbs)}</WBS><OutlineLevel>{nivel}</OutlineLevel>"
             f"<Type>0</Type><Summary>{1 if resumen else 0}</Summary><Milestone>{1 if hito else 0}</Milestone>"
             f"<Start>{ini.strftime(FMT)}</Start><Finish>{fin.strftime(FMT)}</Finish><Duration>{dur}</Duration><DurationFormat>7</DurationFormat>"
             f"<PercentComplete>{avance}</PercentComplete><Critical>{1 if critica else 0}</Critical>"]
        if snet is not None:
            x.append(f"<ConstraintType>4</ConstraintType><ConstraintDate>{m.fecha_hora(snet).strftime(FMT)}</ConstraintDate>")
        if fnlt is not None:
            x.append(f"<ConstraintType>7</ConstraintType><ConstraintDate>{m.fin_reloj(fnlt).strftime(FMT)}</ConstraintDate>")
        for p in preds or []:
            x.append(f"<PredecessorLink><PredecessorUID>{uid[p]}</PredecessorUID><Type>1</Type></PredecessorLink>")
        if notas:
            x.append(f"<Notes>{escape(notas)}</Notes>")
        x.append("</Task>")
        filas.append("".join(x))

    fin_todo = max(a.ef for a in acts)
    tarea(nuevo("RAIZ"), "Aplicación Web de Comercio Electrónico — Tiendas ComproYa", "0", 1, True, 0, fin_todo)
    for aid in ("ACT-01", "ACT-02", "ACT-03"):
        a = por_id[aid]
        tarea(nuevo(aid), f"{aid} {a.nombre}", aid, 2, False, a.es, a.ef, hito=a.tipo == "hito", avance=a.avance, snet=a.snet,
              notas=f"Responsable: {a.responsable}. Esfuerzo continuo del entregable 1.5 de la EDT.")
    for n in (1, 2, 3):
        sp = m.SPRINTS[n]
        hs = [h for h in m.HISTORIAS if h[4] == n]
        if n == 1:
            tarea(nuevo("S1"), f"{sp['nombre']} (completado)", "S1", 2, True, sp["ini_h"], sp["fin_h"])
            for (hid, jira, nombre, cu, _, resp, deps) in hs:
                a = por_id[hid]
                nota = f"Jira {jira}. Responsable: {m.CORTO[resp]}. Horas no registradas por historia: se planifica como ventana del sprint."
                if hid in m.S1_CON_SUBTAREAS:
                    b = m.S1_CON_SUBTAREAS[hid]
                    nota += f" Subtareas de Jira SCRUM-{b} a SCRUM-{b + 5} sin horas."
                tarea(nuevo(hid), f"{hid} {nombre} ({cu})", f"S1.{hid}", 3, False, a.es, a.ef, critica=False, avance=100, snet=a.snet,
                      notas=nota)
        else:
            tarea(nuevo(f"S{n}"), sp["nombre"], f"S{n}", 2, True, sp["ini_h"], sp["fin_h"])
            orden = {2: ["HU-115", "HU-116", "HU-114", "HU-113"], 3: ["HU-117", "HU-101"]}[n]
            for hid in orden:
                _, jira, nombre, cu, _, resp, deps = m.POR_HU[hid]
                es, ef = m.span_historia(acts, hid)
                tarea(nuevo(hid), f"{hid} {nombre} ({cu})", f"S{n}.{hid}", 3, True, es, ef,
                      notas=f"Jira {jira}. Responsable: {m.CORTO[resp]}. Depende de: {', '.join(deps) or 'ninguna'}.")
                for (cod, fase_n) in m.FASES:
                    k = [c for c, _ in m.FASES].index(cod)
                    aid = f"SCRUM-{m.SUBTAREAS[hid][0] + k}"
                    a = por_id[aid]
                    u = nuevo(aid)
                    tarea(u, f"{aid} {fase_n} · {hid}", f"S{n}.{hid}.{aid}", 4, False, a.es, a.ef, critica=a.critica, avance=a.avance,
                          snet=a.snet, fnlt=a.fnlt, preds=a.preds, notas=f"Subtarea de Jira {aid}. Responsable: {m.CORTO[a.responsable]}.")
                    asig.append((u, RECURSOS[a.responsable][0], a.horas))
    a4 = por_id["ACT-04"]
    u4 = nuevo("ACT-04")
    tarea(u4, f"ACT-04 {a4.nombre}", "ACT-04", 2, False, a4.es, a4.ef, critica=True, avance=0, fnlt=a4.fnlt, preds=a4.preds,
          notas="Supuesto del equipo: 2 días hábiles de ambos integrantes (12 horas-persona); no está estimada en Jira.")
    asig.append((u4, 1, m.CIERRE_H))
    asig.append((u4, 2, m.CIERRE_H))

    cab = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Project xmlns="http://schemas.microsoft.com/project">\n'
        "<SaveVersion>14</SaveVersion><Name>Cronograma ComproYa</Name>"
        "<Title>Cronograma del proyecto — Aplicación Web de Comercio Electrónico (Tiendas ComproYa)</Title>"
        f"<Author>{escape(m.NICOLAS)}; {escape(m.DUVAN)}</Author>"
        f"<CreationDate>2026-11-17T09:00:00</CreationDate><StartDate>{m.fecha_hora(0).strftime(FMT)}</StartDate>"
        f"<FinishDate>{m.fin_reloj(fin_todo).strftime(FMT)}</FinishDate><ScheduleFromStart>1</ScheduleFromStart><CalendarUID>1</CalendarUID>"
        "<MinutesPerDay>180</MinutesPerDay><MinutesPerWeek>900</MinutesPerWeek><DaysPerMonth>20</DaysPerMonth>"
        "<DefaultStartTime>08:00:00</DefaultStartTime><DefaultFinishTime>11:00:00</DefaultFinishTime><DurationFormat>7</DurationFormat>"
        "<WorkFormat>2</WorkFormat><CurrencyCode>COP</CurrencyCode><NewTasksAreManual>0</NewTasksAreManual><CriticalSlackLimit>0</CriticalSlackLimit>\n"
    )
    dias = "".join(
        f"<WeekDay><DayType>{d}</DayType><DayWorking>{1 if 2 <= d <= 6 else 0}</DayWorking>"
        + ("<WorkingTimes><WorkingTime><FromTime>08:00:00</FromTime><ToTime>11:00:00</ToTime></WorkingTime></WorkingTimes>" if 2 <= d <= 6 else "")
        + "</WeekDay>\n" for d in range(1, 8)
    )
    cal = f"<Calendars><Calendar><UID>1</UID><Name>Jornada del equipo (3 h por día, L-V)</Name><IsBaseCalendar>1</IsBaseCalendar><WeekDays>\n{dias}</WeekDays></Calendar></Calendars>\n"
    recursos = "<Resources>" + "".join(
        f"<Resource><UID>{ru}</UID><ID>{ru}</ID><Name>{escape(n)}</Name><Type>1</Type><Initials>{ini}</Initials><MaxUnits>1</MaxUnits><CalendarUID>1</CalendarUID></Resource>"
        for n, (ru, ini) in RECURSOS.items()) + "</Resources>\n"
    asignaciones = "<Assignments>\n" + "\n".join(
        f"<Assignment><UID>{i}</UID><TaskUID>{t}</TaskUID><ResourceUID>{r}</ResourceUID><Units>1</Units><Work>{_dur(h)}</Work></Assignment>"
        for i, (t, r, h) in enumerate(asig, start=1)) + "\n</Assignments>\n"
    xml = cab + cal + "<Tasks>\n" + "\n".join(filas) + "\n</Tasks>\n" + recursos + asignaciones + "</Project>\n"
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(xml, encoding="utf-8")
    return dict(tareas=len(filas), asignaciones=len(asig), criticas=sum(1 for a in acts if a.critica))


if __name__ == "__main__":
    r = escribir(Path(__file__).resolve().parent.parent / "cronograma" / "Cronograma_ComproYa.xml")
    print(r)
