# ComproYa en Línea

Canal de comercio electrónico B2C de Tiendas ComproYa — proyecto de curso de Ingeniería de Software II, Universidad Central. Este repositorio es la implementación técnica del sistema descrito en el canon del proyecto; no es el entregable académico (ese se produce y entrega aparte), pero comparte la misma fuente de verdad.

## Por dónde empezar

Si es la primera vez que se abre este repositorio (persona o Claude Code), leer en este orden:

1. `CLAUDE.md` — contexto y reglas para trabajar en este repositorio.
2. `docs/canon/CANON-ComproYa.md` — qué se está construyendo, para quién, con qué reglas de negocio.
3. `docs/arquitectura.md` — cómo está diseñado.
4. `docs/plan-de-trabajo.md` — en qué orden se construye.
5. `docs/mockups-plan.md` — qué pantallas hacen falta antes de programar.
6. `docs/despliegue-gcp.md` — cómo se despliega.

## Estado

- Canon y documentos de arquitectura/plan: listos.
- `backend/prisma/`: script de siembra del catálogo, construido y probado (ver `backend/README.md`).
- Resto del backend (NestJS), frontend (Next.js) e infraestructura de GCP: por construir, siguiendo `docs/plan-de-trabajo.md` desde la Fase 0.

## Cómo seguir desde aquí

1. Crear este repositorio en GitHub y subir este contenido.
2. Abrir el repositorio con Claude Code — `CLAUDE.md` se carga automáticamente.
3. Fase 0: correr `/design` contra la lista de `docs/mockups-plan.md`, y en paralelo seguir `docs/despliegue-gcp.md` para dejar GCP y el pipeline de despliegue listos.
4. A partir de ahí, sprint por sprint según `docs/plan-de-trabajo.md`.
