"""Normaliza una consulta JQL de Jira (proyecto SCRUM) guardada como JSON y escribe docs/cronograma/soporte/jira-<fecha>.json.

  python jira_snapshot.py <archivo_json_de_la_consulta> <AAAA-MM-DD>
La consulta se hace con searchJiraIssuesUsingJql: project = SCRUM, campos summary, status, issuetype, assignee, parent,
resolutiondate y customfield_10020 (sprint).
"""
import json
import sys
from pathlib import Path

origen, fecha = Path(sys.argv[1]), sys.argv[2]
nodos = json.loads(origen.read_text(encoding="utf-8"))["issues"]["nodes"]
filas = []
for n in nodos:
    f = n["fields"]
    sprints = (f.get("customFields", {}).get("Sprint") or {}).get("value") or []
    filas.append({
        "clave": n["key"], "tipo": f["issuetype"]["name"], "resumen": f["summary"], "estado": f["status"]["name"],
        "responsable": (f.get("assignee") or {}).get("displayName"), "padre": (f.get("parent") or {}).get("key"),
        "sprint": sprints[-1]["name"] if sprints else None, "sprint_estado": sprints[-1]["state"] if sprints else None,
        "resuelta": (f.get("resolutiondate") or "")[:19] or None, "url": n["webUrl"],
    })
salida = Path(__file__).resolve().parent.parent / "cronograma" / "soporte" / f"jira-{fecha}.json"
salida.parent.mkdir(parents=True, exist_ok=True)
salida.write_text(json.dumps({"fuente": "Jira SCRUM, consulta JQL", "fecha": fecha, "total": len(filas), "incidencias": filas}, ensure_ascii=False, indent=1), encoding="utf-8")
from collections import Counter
print(salida, len(filas), dict(Counter((x["tipo"], x["estado"]) for x in filas)))
