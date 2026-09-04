# Backlog de tareas — ComproYa en Línea

Este backlog no reemplaza `docs/plan-de-trabajo.md` (que ya trae las tareas por sprint) — lo precede. Antes de tocar lógica de negocio de ningún caso de uso, el equipo pidió dejar la base de datos completa con datos de prueba realistas, para que backend y frontend trabajen contra algo real desde el primer commit. Por eso esta prioridad 0 va antes que todo, incluida la Fase 0 de `plan-de-trabajo.md`.

**Aviso de alcance:** definir aquí el esquema completo (todos los módulos) es solo modelo de datos y fixtures — no adelanta lógica de negocio de sprints posteriores. La implementación de cada caso de uso se sigue haciendo estrictamente en el orden del canon (sección 9); lo único que se adelanta es la forma de las tablas, para no migrar el esquema seis veces.

## Prioridad 0 — Esquema completo + scripts de siembra de toda la base de datos ✅ hecho

Construido en esta sesión. Modelos, campos y scripts van **en inglés** (buenas prácticas de base de datos) — los comentarios del `schema.prisma` citan en español los identificadores del canon para mantener trazabilidad. Detalle completo en `backend/README.md`.

### 0.1 `backend/prisma/schema.prisma` — ya trae los seis módulos

| Módulo (sprint) | Modelos | RN/C que cubre |
|---|---|---|
| `catalogo` (1, ya existía) | `Category`, `Product` (+ `brand`), `Branch`, `Availability` | C-01, C-03, RN-01 a RN-04 |
| `cuenta` (2) | `Customer`, `Consent`, `DeletionRequest`, `BehaviorEvent` | C-14, C-15, C-16, RN-10, RN-11 |
| `carrito` (3) | `Cart`, `CartItem`, `ComplementaryProduct` | C-04, C-05 |
| `pedido` (4, 6) | `Order` (enum `OrderStatus`), `OrderItem`, `UnitsReservation`, `OrderStatusHistory`, `LoyaltyCoupon`, `CouponRedemption` | C-06, C-07, C-10 a C-13, RN-05, RN-07 a RN-09 |
| `pago` (5) | `Payment` (enums `PaymentMethod`, `PaymentStatus`) | C-08, C-09, RN-06 |

No se creó una tabla `Brand` aparte — DummyJSON ya trae `brand` por producto y ningún caso de uso del canon exige administrarla como entidad propia; quedó como columna simple en `Product`.

Validado con `npx prisma validate` y `npx prisma generate` (sin errores) contra Prisma 5.22 — el proyecto sigue en esa versión, no se actualizó a la mayor disponible para no introducir un cambio sin relación con esta tarea.

### 0.2 Scripts de siembra por módulo — ya existen

| Script | Qué siembra |
|---|---|
| `backend/prisma/seed.ts` (ya existía) | Categorías, productos (+ marca), sucursales (ahora 8, cifra oficial del canon — antes tenía 6), disponibilidad |
| `backend/prisma/seed-account.ts` | Clientes + consentimiento |
| `backend/prisma/seed-cart.ts` | Carritos, ítems, productos complementarios (tope 4) |
| `backend/prisma/seed-order.ts` | Pedidos (con escenarios fijos: en riesgo, cancelable, entregado, pago fallido), reservas de unidades, historial de estado, cupones de lealtad |
| `backend/prisma/seed-payment.ts` | Pagos |
| `backend/prisma/seed-all.ts` | Encadena los cinco anteriores en orden de llaves foráneas (`npm run seed:all`) |

Cada uno soporta `-- --dry-run` y valida sus invariantes antes de escribir (códigos únicos, RN-02, RN-04, 8-12% sin identificador de lealtad, al menos un pedido en riesgo y uno cancelable). `backend/scripts/test-generation.ts` (`npm run test:generation`) corre las cinco funciones puras de generación sin red ni base de datos — ya se ejecutó y pasó.

**Pendiente para el equipo (no se pudo hacer en esta sesión, no hay Postgres en este entorno):** correr `npm run prisma:migrate` y `npm run seed:all` contra una base de datos real (Cloud SQL o Postgres local) para confirmar los `INSERT` de punta a punta — la lógica y los tipos ya están validados, falta la corrida contra una base viva.

### 0.3 Reglas que no se pueden saltar al sembrar

- Ninguna cifra nueva: usar exactamente las de la sección 10 del canon (8 sucursales, 8-12 % de discrepancia de lealtad, umbral de 4 horas hábiles, etc.).
- Vocabulario del canon en nombres de tabla/campo — nunca "SKU", "checkout", "stock", etc. (sección 11 del canon), tampoco al traducir al inglés (por eso `Availability.erpUnits`, no `erpStock`).
- Los datos de prueba deben poder ejercitar cada RN-01 a RN-11 al menos una vez (es lo que después usan las pruebas unitarias que pide `CLAUDE.md`).

## Prioridad 1 — Scaffold de NestJS

Una vez la base de datos está poblada:

- [ ] `nest new backend` (o adaptar la estructura ya existente) con un `NestModule` por sub-problema, siguiendo `docs/arquitectura.md` sección 3: `catalogo`, `cuenta`, `carrito`, `pedido`, `pago`, `operacion`.
- [ ] Un módulo no importa entidades de otro directamente, solo a través de un servicio de aplicación expuesto (regla de `CLAUDE.md`).
- [ ] Adaptadores de sistemas externos simulados detrás de interfaz (`PuertoErp`, `PuertoPasarelaDePagos`, `PuertoLealtad`, `PuertoLogistica` — `docs/arquitectura.md` sección 6).
- [ ] Autenticación propia (Passport + JWT) en el módulo `cuenta` — sección 7 de `arquitectura.md`. Esto es lo que habilita el modal de login/registro de los mockups.

## Prioridad 2 en adelante — sprints 1 a 6

Ya están detallados caso de uso por caso de uso, con sus tareas de backend y frontend y su mockup correspondiente, en `docs/plan-de-trabajo.md` y `docs/mockups-brief.md`. No se repiten aquí — seguir ese orden tal cual, sin adelantar un caso de uso de un sprint posterior.
