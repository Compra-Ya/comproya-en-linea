# Backend — ComproYa en Línea

Monolito modular en NestJS (ver `../docs/arquitectura.md`). Todavía no está scaffoldeado — lo único que existe hoy es la capa de datos: el esquema de Prisma completo (los seis módulos) y los scripts de siembra de toda la base de datos, construidos y probados antes que el resto del proyecto (ver `../docs/backlog-tareas.md`, prioridad 0).

Modelos, campos y scripts van en **inglés** (buenas prácticas de base de datos); los comentarios del schema citan en español los identificadores del canon (RN-XX, C-XX, CU-XX) para mantener la trazabilidad que exige `CLAUDE.md`.

## Lo que ya existe

`prisma/schema.prisma` trae los modelos de los seis módulos del canon, aunque solo `catalogo` tiene lógica de negocio implementada hasta el sprint 1 — los demás son modelo de datos + siembra, listos para que cada sprint les agregue su servicio de aplicación:

| Módulo (sprint) | Modelos |
|---|---|
| `catalogo` (1) | `Category`, `Product`, `Branch`, `Availability` |
| `cuenta` (2) | `Customer`, `Consent`, `DeletionRequest`, `BehaviorEvent` |
| `carrito` (3) | `Cart`, `CartItem`, `ComplementaryProduct` |
| `pedido` (4, 6) | `Order`, `OrderItem`, `UnitsReservation`, `OrderStatusHistory`, `LoyaltyCoupon`, `CouponRedemption` |
| `pago` (5) | `Payment` |

## Scripts de siembra

Uno por módulo, en el mismo orden de llaves foráneas. Cada uno soporta `-- --dry-run` (genera y valida sin tocar la base de datos):

```bash
npm install
cp .env.example .env        # completar DATABASE_URL (Cloud SQL o Postgres local)
npm run prisma:migrate      # crea las tablas

npm run seed                # catálogo: DummyJSON + Faker hasta 1200 productos
npm run seed:account        # clientes + consentimiento
npm run seed:cart           # carritos, ítems, productos complementarios
npm run seed:order          # pedidos, reservas, historial, cupones de lealtad
npm run seed:payment        # pagos

npm run seed:all            # corre los cinco anteriores en orden
```

Invariantes que cada script valida (no solo el camino feliz): códigos homologados y códigos de retiro únicos, RN-02 (costo < precio digital), RN-04 (~1/6 de la disponibilidad con sincronización vencida), 8-12% de clientes sin identificador de lealtad (discrepancia real del canon, sección 10), al menos un pedido en riesgo (C-13, para P-14) y al menos uno cancelable (RN-09, para P-13).

`npm run test:generation` corre la prueba de las funciones puras de generación de los cinco módulos (sin red, sin base de datos).

## Lo que falta (Claude Code lo construye siguiendo `../docs/plan-de-trabajo.md`)

Scaffold de NestJS, un módulo por sub-problema del canon (la lógica de negocio se implementa sprint por sprint, no antes — el esquema completo solo adelanta la forma de las tablas), los adaptadores de sistemas externos simulados (`docs/arquitectura.md` sección 6), la integración con Stripe en modo sandbox, y los tres endpoints internos que consume Cloud Scheduler (`docs/despliegue-gcp.md` sección 7).
