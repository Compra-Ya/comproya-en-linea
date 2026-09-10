# Backend — ComproYa en Línea

Monolito modular en NestJS (ver `../docs/arquitectura.md`). Un módulo de Nest por sub-problema del canon; ningún módulo importa entidades de otro directamente, solo a través del servicio de aplicación que ese módulo exporta.

Modelos, campos y scripts van en **inglés** (buenas prácticas de base de datos); los comentarios del código citan en español los identificadores del canon (RN-XX, C-XX, CU-XX) para mantener la trazabilidad que exige `CLAUDE.md`.

## Módulos implementados

| Módulo | Sub-problema | Casos de uso | Sprint | Puerto / adaptador simulado |
|---|---|---|---|---|
| `catalogo` | SP-01, SP-02 | CU-01, CU-02, CU-03 | 1 | `PuertoErp` → `AdaptadorErpSimulado` |
| `cuenta` | SP-07, SP-08 | CU-04, CU-05, CU-06 | 2 | `PuertoLealtad` → `AdaptadorLealtadSimulado` |
| `carrito` | SP-03 | CU-07, CU-08 | 3 | — |
| `pedido` | SP-04 | CU-09, CU-10 | 4 | — (usa `catalogo` para reservar/liberar unidades) |
| `pago` | SP-05 | CU-15, CU-16, CU-17 | 5 | `PuertoPasarelaDePagos` → `AdaptadorStripe` (tarjeta); débito bancario simulado con un endpoint propio |

`operacion` (SP-06, sprint 6: CU-11 a CU-14) queda fuera de esta entrega — no se construyó.

Infraestructura transversal (no un sub-problema propio del canon): `src/auth` (JWT propio, `docs/arquitectura.md` sección 7), `src/prisma` (cliente único de Prisma).

## Cómo correr en local

```bash
npm install
cp .env.example .env             # completar DATABASE_URL, JWT_SECRET, Stripe (ver abajo)

# Postgres local (si no tienes Cloud SQL a mano):
cd .. && docker compose up -d && cd backend

npm run prisma:migrate           # crea las tablas (ya migradas si vienes del historial de este repo)
npm run seed:all                 # catálogo + cuentas + carritos + pedidos + pagos de ejemplo

npm run start:dev                # http://localhost:3001/api
```

## Pruebas automatizadas

Corren contra una base de datos Postgres real y separada (`comproya_test`), nunca contra la de desarrollo — así se prueban las reglas de negocio contra persistencia real, no con mocks en memoria (ver `CLAUDE.md`).

```bash
# Una sola vez: crear la base de datos de pruebas y migrarla.
docker exec <contenedor-postgres> psql -U postgres -c "CREATE DATABASE comproya_test;"
DATABASE_URL="postgresql://postgres:comproya@localhost:5433/comproya_test" npx prisma migrate deploy

npm test
```

Cada regla de negocio con prueba obligatoria (`CLAUDE.md`) tiene al menos un caso, ejercitando también los caminos de error E-1 y E-2:

| Regla | Dónde se prueba |
|---|---|
| RN-01, RN-02 | `src/catalogo/catalogo.service.spec.ts` |
| RN-03, RN-04 | `src/catalogo/catalogo.service.spec.ts` |
| RN-05, RN-07, RN-08, RN-09 | `src/pedido/pedido.service.spec.ts` |
| RN-06 | `src/pago/pago.service.spec.ts` |
| RN-10, RN-11 | `src/cuenta/cuenta.service.spec.ts` |
| E-1 (documento duplicado) | `src/cuenta/cuenta.service.spec.ts` |
| E-2 (pago rechazado / vencido) | `src/pago/pago.service.spec.ts` |

## Probar el pago con Stripe (modo de prueba)

1. Crea una cuenta gratuita en [dashboard.stripe.com](https://dashboard.stripe.com) y activa el interruptor **Test mode**.
2. En *Developers → API keys*, copia la *Secret key* (`sk_test_...`) y la *Publishable key* (`pk_test_...`) a `.env`.
3. Para el webhook en local, usa la [Stripe CLI](https://stripe.com/docs/stripe-cli): `stripe listen --forward-to localhost:3001/api/pagos/webhook/stripe` — te da el `whsec_...` que va en `STRIPE_WEBHOOK_SECRET`.
4. En la pantalla de pago, usa las [tarjetas de prueba de Stripe](https://stripe.com/docs/testing):
   - `4242 4242 4242 4242` (cualquier fecha futura, cualquier CVC) → pago autorizado, dispara `checkout.session.completed`.
   - `4000 0000 0000 0002` → pago rechazado (camino de error E-2).
5. El comprobante (CU-17) solo aparece después de que el webhook confirme el pago — nunca por la redirección del navegador.

El pago con débito bancario (CU-16) no depende de Stripe: se simula con un endpoint propio (`POST /api/pagos/debito/:orderId/notificacion`) porque no hay una pasarela de débito bancario real conectada — ver `docs/arquitectura.md` sección 6.

## Jobs programados

`SupresionJob` (RN-11, cada hora) y `LiberacionReservasJob` (red de seguridad de RN-05/pago con tarjeta o débito bancario vencido, cada 5 min) usan `@nestjs/schedule` dentro del mismo monolito en vez de Cloud Scheduler + Cloud Run Jobs — ver la nota en el resumen de esta entrega sobre por qué. Se desactivan con `JOBS_ENABLED=false` (las pruebas automatizadas los desactivan y llaman su lógica directamente).

## Scripts de siembra

Uno por módulo, en el mismo orden de llaves foráneas. Cada uno soporta `-- --dry-run` (genera y valida sin tocar la base de datos):

```bash
npm run seed                # catálogo: DummyJSON + Faker hasta 1200 productos
npm run seed:account        # clientes + consentimiento
npm run seed:cart           # carritos, ítems, productos complementarios
npm run seed:order          # pedidos, reservas, historial, cupones de lealtad
npm run seed:payment        # pagos
npm run seed:all            # corre los cinco anteriores en orden
```

Invariantes que cada script valida (no solo el camino feliz): códigos homologados y códigos de retiro únicos, RN-02 (costo < precio digital), RN-04 (~1/6 de la disponibilidad con sincronización vencida), 8-12% de clientes sin identificador de lealtad (discrepancia real del canon, sección 10), al menos un pedido en riesgo (C-13, para P-14) y al menos uno cancelable (RN-09, para P-13).

`npm run test:generation` corre la prueba de las funciones puras de generación de los cinco módulos (sin red, sin base de datos).

## Lo que falta

El módulo `operacion` (sprint 6: CU-11 consulta de estado, CU-12 alistamiento y entrega, CU-13 cancelación, CU-14 pedidos en riesgo) — deliberadamente fuera de esta entrega. RN-09 (cancelación antes de alistar) queda modelada en `OrderStatus` pero sin pantalla ni endpoint propio, tal como lo pide el alcance de esta tarea.
