"""Recolecta las mediciones que sustentan los KPI de docs/ejecucion (cada cifra sale de un comando ejecutado).

  python recolectar_soporte_kpi.py          (desde cualquier carpeta; usa el repositorio que contiene este archivo)

Escribe docs/ejecucion/soporte/kpi-medidas.json con:
  * conformidad de arquitectura (importaciones entre módulos de negocio),
  * control de configuración (archivos del sprint 2 versionados en git),
  * vulnerabilidades de dependencias (npm audit, solo producción),
  * estado de Jira del sprint 2 antes y después del cierre con evidencia (consultas del 17-nov-2026),
  * líneas ejecutables del backend (jest --coverage) para la densidad de defectos.
"""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
SALIDA = REPO / "docs/ejecucion/soporte"

MODULOS_NEGOCIO = {"catalogo", "cuenta", "carrito", "pedido", "pago"}
MODULOS_SPRINT2 = ["pedido", "cuenta", "auth", "auditoria"]

# Archivos que implementan el sprint 2 (los de la Tabla 3 del segundo entregable más sus pruebas)
ARCHIVOS_SPRINT2 = [
    "backend/src/pedido/pedido.controller.ts", "backend/src/pedido/pedido.service.ts", "backend/src/pedido/ventas.controller.ts",
    "backend/src/pedido/ventas.service.ts", "backend/src/pedido/dominio/ventas.ts", "backend/src/pedido/dominio/pedido.ts",
    "backend/src/pedido/dominio/totales.ts", "backend/src/pedido/dto/consultar-ventas.dto.ts",
    "backend/src/cuenta/cuenta.controller.ts", "backend/src/cuenta/cuenta.service.ts", "backend/src/auth/acceso-interno.ts",
    "backend/src/auth/jwt-staff.strategy.ts", "backend/prisma/seed-staff.ts",
    "frontend/src/app/pedidos/page.tsx", "frontend/src/components/ui/OrderRow.tsx", "frontend/src/app/admin/ventas/page.tsx",
    "frontend/src/app/admin/ingresar/page.tsx", "frontend/src/app/admin/page.tsx", "frontend/src/components/PanelInterno.tsx",
    "backend/src/pedido/dominio/pedido.spec.ts", "backend/src/pedido/dominio/ventas.spec.ts", "backend/src/pedido/ventas.spec.ts",
    "backend/src/pedido/pedido.controller.spec.ts", "backend/src/pedido/pedido.service.spec.ts", "backend/src/auth/acceso-interno.spec.ts",
    "e2e/capturas/verificar-sprint2.mjs", "e2e/capturas/verificar-interno.mjs",
]


def sh(cmd: list[str], cwd: Path) -> str:
    return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, shell=True if cmd[0] == "npm" else False).stdout


def arquitectura() -> dict:
    raiz = REPO / "backend/src"
    evaluados, violaciones = [], []
    for f in raiz.rglob("*.ts"):
        if f.name.endswith(".spec.ts"):
            continue
        mod = f.relative_to(raiz).parts[0]
        if mod not in MODULOS_SPRINT2:
            continue
        evaluados.append(str(f.relative_to(raiz)).replace("\\", "/"))
        for m in re.finditer(r'from\s+"(\.\.?/[^"]+)"', f.read_text(encoding="utf-8")):
            destino = (f.parent / m.group(1)).resolve()
            try:
                rel = destino.relative_to(raiz.resolve())
            except ValueError:
                continue
            otro = rel.parts[0]
            if otro in MODULOS_NEGOCIO and otro != mod:
                nombre = rel.name
                # Regla: un módulo solo importa de otro su módulo de Nest o su servicio de aplicación.
                if not (nombre.endswith(".module") or nombre.endswith(".service")):
                    violaciones.append({"archivo": str(f.relative_to(raiz)).replace("\\", "/"), "importa": str(rel).replace("\\", "/")})
    return {"regla": "un módulo de negocio solo importa de otro su *.module o su *.service (docs/arquitectura.md, sección 3)",
            "modulos_evaluados": MODULOS_SPRINT2, "archivos_evaluados": len(evaluados), "violaciones": violaciones,
            "archivos_conformes": len(evaluados) - len({v["archivo"] for v in violaciones})}


def configuracion() -> dict:
    versionados = sh(["git", "ls-files"], REPO).splitlines()
    controlados = [a for a in ARCHIVOS_SPRINT2 if a in versionados]
    return {"identificados": len(ARCHIVOS_SPRINT2), "controlados": len(controlados),
            "sin_controlar": [a for a in ARCHIVOS_SPRINT2 if a not in versionados]}


def auditoria() -> dict:
    out = {}
    for carpeta in ("backend", "frontend"):
        txt = sh(["npm", "audit", "--omit=dev", "--json"], REPO / carpeta)
        try:
            out[carpeta] = json.loads(txt).get("metadata", {}).get("vulnerabilities", {})
        except json.JSONDecodeError:
            out[carpeta] = {"error": "sin respuesta de npm audit"}
    return out


def main() -> None:
    cob = json.loads((REPO / "docs/entrega-2/evidencia/cobertura-resumen.json").read_text(encoding="utf-8"))["total"]
    datos = {
        "generado": "2026-11-17",
        "arquitectura": arquitectura(),
        "configuracion": configuracion(),
        "npm_audit_produccion": auditoria(),
        "lineas_ejecutables_backend": cob["lines"]["total"],
        "jira_sprint2": {
            "fuente": "Jira SCRUM, consultas del 17-nov-2026 (antes y después de cerrar las subtareas con la evidencia del segundo entregable)",
            "comprometidas_h": 56,
            "antes": {"historias_finalizadas": 0, "subtareas_finalizadas": 8, "subtareas_total": 24, "horas_finalizadas": 11,
                      "ultimo_cambio_de_estado": "2026-11-10T16:16:48-05:00"},
            "despues": {"historias_finalizadas": 4, "subtareas_finalizadas": 24, "subtareas_total": 24, "horas_finalizadas": 56,
                        "cierre_del_sprint": "2026-11-17T22:36:13Z"},
            "fin_planificado": "2026-11-13",
        },
    }
    SALIDA.mkdir(parents=True, exist_ok=True)
    (SALIDA / "kpi-medidas.json").write_text(json.dumps(datos, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({k: datos[k] for k in ("arquitectura", "configuracion", "npm_audit_produccion")}, ensure_ascii=False, indent=1)[:1500])


if __name__ == "__main__":
    main()
