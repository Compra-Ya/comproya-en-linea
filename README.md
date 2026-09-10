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
- Backend (NestJS) y frontend (Next.js): construidos para los sprints 1 a 5 del canon — catálogo (CU-01, CU-02, CU-03), cuenta (CU-04, CU-05, CU-06), carrito (CU-07, CU-08), pedido (CU-09, CU-10) y pago (CU-15, CU-16, CU-17, con Stripe Checkout en modo de prueba). Detalle en `backend/README.md` y `frontend/README.md`.
- Sprint 6 (`operacion`: CU-11 a CU-14) e infraestructura de GCP: por construir, siguiendo `docs/plan-de-trabajo.md`.
- Mockups formales de Fase 0 (`docs/mockups-plan.md`, con `/design`): no se rehicieron en esta entrega — las pantallas se construyeron funcionales, siguiendo la asignación de actor/caso de uso de ese plan, pero sin el diseño visual detallado que produce `/design`.

## Cómo correr el proyecto en local

Requiere Node 22+ y Docker (para Postgres local; si ya tienes Cloud SQL u otro Postgres, usa esa cadena de conexión en su lugar).

```bash
# 1. Base de datos
docker compose up -d

# 2. Backend
cd backend
npm install
cp .env.example .env        # completar JWT_SECRET y, para probar pagos, las llaves de Stripe (ver backend/README.md)
npm run prisma:migrate
npm run seed:all            # datos de ejemplo: catálogo, cuentas, carritos, pedidos, pagos
npm run start:dev           # http://localhost:3001/api

# 3. Frontend (en otra terminal)
cd frontend
npm install
cp .env.example .env.local
npm run dev                 # http://localhost:3000
```

Pruebas automatizadas (contra una base de datos de pruebas real, separada de la de desarrollo): `cd backend && npm test` — ver `backend/README.md` para el paso único de preparar `comproya_test`.

Para probar el pago de punta a punta con las tarjetas de prueba de Stripe (flujo feliz y pago rechazado), ver la sección correspondiente en `backend/README.md`.

## Cómo seguir desde aquí

1. Sprint 6 (`operacion`): CU-11 consulta de estado, CU-12 alistamiento y entrega en sucursal, CU-13 cancelación del pedido, CU-14 supervisión de pedidos en riesgo — siguiendo `docs/plan-de-trabajo.md`, Fase 6.
2. Mockups formales de Fase 0 con `/design`, si el equipo los necesita para el entregable académico además de lo ya construido.
3. Bootstrap de GCP y despliegue continuo, siguiendo `docs/despliegue-gcp.md`.
