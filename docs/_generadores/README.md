# Generadores de los documentos de gestión

Los documentos de la asignatura se generan **editando el XML de las plantillas del docente**, sin cambiar sus estilos, encabezados ni el orden
de las secciones. Cada documento se puede regenerar cuando cambie un dato (Jira, pruebas, cronograma).

| Documento | Script | Plantilla del docente (carpeta del curso) |
|---|---|---|
| `docs/cronograma/` Plan de gestión del cronograma, Excel con ruta crítica y red del proyecto | `build_cronograma.py` | `1.4 PLANTILLA PLAN GESTION CRONOGRAMA.docx` |
| `docs/calidad/` Plan de gestión de la calidad | `build_calidad.py` | `1. PLANTILLA DE GESTION DE CALIDAD DEL SOFTWARE.docx` |
| `docs/ejecucion/` Gestión de la ejecución con los KPI | `recolectar_soporte_kpi.py` y `build_ejecucion.py` | `EJECUCION PROYECTO.docx` |
| `docs/entrega-2/` Segundo entregable (sprint 2) | `render_mermaid.mjs` y `build_entrega2.py` | formato de `Resultados_Pruebas_ComproYa.docx` |

## Requisitos

```bash
python -m venv venv && venv/Scripts/pip install python-docx openpyxl pillow pymupdf holidays
# diagramas UML (Mermaid, fuera del repositorio): npm i mermaid  y  MERMAID_JS=<ruta>/node_modules/mermaid/dist/mermaid.min.js
```

## Cómo regenerar

```bash
cd docs/_generadores
python build_cronograma.py <plantilla cronograma.docx>
python build_calidad.py <plantilla calidad.docx> ../entrega-2/evidencia
python recolectar_soporte_kpi.py && python build_ejecucion.py <plantilla ejecucion.docx>
MERMAID_JS=... node render_mermaid.mjs && python build_entrega2.py ../../Resultados_Pruebas_ComproYa.docx ../entrega-2/evidencia
```

## De dónde sale cada cifra

- **Pruebas y cobertura:** `cd backend && npx jest --runInBand --coverage` → `docs/entrega-2/evidencia/jest-completo.json` y `cobertura-resumen.json`.
- **Pantallas y comprobaciones de sistema:** `e2e/capturas/verificar-sprint2.mjs` y `verificar-interno.mjs` (capturas en `design/`).
- **Cronograma:** `cronograma_modelo.py` (CPM sobre las historias de Jira; las horas del sprint 1 se reconstruyen porque no se registraron).
- **Usabilidad:** `e2e/usabilidad/grabar-sesion.mjs` → `docs/usabilidad/sesiones` (la sección 7.4 del segundo entregable se llena sola con las sesiones de participantes).
- **Diagramas UML:** fuentes de texto en `diagramas/*.mmd`.
