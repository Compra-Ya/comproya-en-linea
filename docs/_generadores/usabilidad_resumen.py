"""Resumen de las sesiones de usabilidad con PERSONAS (docs/usabilidad/sesiones/*.json con modo «participante»).

Lo usan build_entrega2.py (sección 7), build_ejecucion.py (KPI de satisfacción) y build_calidad.py (registro 10.1) para que, al
regenerar los documentos con las sesiones grabadas, la evaluación de usabilidad se llene sola con cifras medidas. Si no hay
sesiones de participantes, todas las funciones devuelven None y los documentos siguen declarando la evaluación como pendiente:
nunca se sustituye a una persona por una corrida del equipo.
"""
from __future__ import annotations

import json
from pathlib import Path

DOCS = Path(__file__).resolve().parent.parent
META_EFECTIVIDAD = 80.0  # % por tarea
META_SEQ = 5.0  # de 7
FACTOR_TIEMPO = 3  # el tiempo objetivo ya viene de linea-base.json (equipo × 3)


def sesiones_participantes() -> list[dict]:
    carpeta = DOCS / "usabilidad/sesiones"
    if not carpeta.exists():
        return []
    salida = []
    for f in sorted(carpeta.glob("*.json")):
        s = json.loads(f.read_text(encoding="utf-8"))
        if s.get("modo") == "participante":
            # Observaciones del observador (opcional): <sesion>.observaciones.json marca las tareas cuyo tiempo y clics no son
            # válidos (por ejemplo, la persona hizo la tarea antes de pulsar «Empezar tarea»). Esas tareas siguen contando en
            # efectividad y satisfacción, pero no en eficiencia.
            obs = f.with_name(f.stem + ".observaciones.json")
            s["observaciones"] = json.loads(obs.read_text(encoding="utf-8")).get("tareas", {}) if obs.exists() else {}
            salida.append(s)
    return salida


def eficiencia_valida(sesion: dict, tarea_id: str) -> bool:
    return sesion.get("observaciones", {}).get(tarea_id, {}).get("eficiencia_valida", True)


def tareas_excluidas(sesiones: list[dict]) -> list[dict]:
    """Tareas con eficiencia no válida, con su motivo, para declararlas en los documentos."""
    salida = []
    for s in sesiones:
        for tid, o in s.get("observaciones", {}).items():
            if not o.get("eficiencia_valida", True):
                salida.append({"codigo": s["codigo"], "id": tid, "motivo": o.get("motivo", "")})
    return salida


def _media(xs: list[float]) -> float | None:
    return sum(xs) / len(xs) if xs else None


def resumen(sesiones: list[dict], objetivos: dict[str, float], clics_equipo: dict[str, float]) -> dict | None:
    """objetivos: id de tarea -> tiempo objetivo (s); clics_equipo: id de tarea -> clics de la línea base."""
    if not sesiones:
        return None
    por_tarea: dict[str, dict] = {}
    for s in sesiones:
        for t in s["tareas"]:
            fila = por_tarea.setdefault(t["id"], {"id": t["id"], "nombre": t.get("nombre", t["id"]), "intentos": 0, "ok": 0, "tiempos": [], "clics": [], "seq": []})
            fila["intentos"] += 1
            valida = eficiencia_valida(s, t["id"])
            if t.get("completada"):
                fila["ok"] += 1
                if t.get("duracionS") is not None and valida:
                    fila["tiempos"].append(t["duracionS"])
            if t.get("clics") is not None and valida:
                fila["clics"].append(t["clics"])
            if t.get("dificultad"):
                fila["seq"].append(t["dificultad"])
    tareas = []
    for fila in por_tarea.values():
        efect = 100 * fila["ok"] / fila["intentos"]
        tiempo = _media(fila["tiempos"])
        obj = objetivos.get(fila["id"])
        tareas.append({
            **fila,
            "efectividad": efect,
            "tiempo_medio": tiempo,
            "tiempo_objetivo": obj,
            "clics_medios": _media(fila["clics"]),
            "clics_equipo": clics_equipo.get(fila["id"]),
            "seq_medio": _media(fila["seq"]),
            "cumple_efectividad": efect >= META_EFECTIVIDAD,
            "cumple_tiempo": (tiempo <= obj) if (tiempo is not None and obj is not None) else None,
        })
    todas_seq = [x for fila in por_tarea.values() for x in fila["seq"]]
    intentos = sum(f["intentos"] for f in por_tarea.values())
    ok = sum(f["ok"] for f in por_tarea.values())
    seq = _media(todas_seq)
    return {
        "personas": len(sesiones),
        "codigos": [s["codigo"] for s in sesiones],
        "fechas": sorted({s["fecha"][:10] for s in sesiones}),
        "intentos": intentos,
        "completadas": ok,
        "efectividad": 100 * ok / intentos if intentos else None,
        "seq_medio": seq,
        "seq_n": len(todas_seq),
        "tareas": sorted(tareas, key=lambda t: (len(t["id"]), t["id"])),
        "cumple_seq": (seq >= META_SEQ) if seq is not None else None,
        "excluidas": tareas_excluidas(sesiones),
    }


def coma(x: float | None, d: int = 1) -> str:
    return "—" if x is None else f"{x:.{d}f}".replace(".", ",")
