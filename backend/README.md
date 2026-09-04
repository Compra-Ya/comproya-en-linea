# Backend — ComproYa en Línea

Monolito modular en NestJS (ver `../docs/arquitectura.md`). Todavía no está scaffoldeado — lo único que existe hoy es la capa de datos: el esquema de Prisma y el script de siembra del catálogo, construidos y probados antes que el resto del proyecto.

## Lo que ya existe

`prisma/schema.prisma` define `Categoria`, `Producto`, `Sucursal` y `Disponibilidad` — el modelo de datos del módulo `catalogo` (sub-problemas SP-01 y SP-02 del canon). Los módulos de los sprints siguientes (`cuenta`, `carrito`, `pedido`, `pago`, `operacion`) agregan sus propios modelos a este mismo `schema.prisma` a medida que se implementan — no se crea un `schema.prisma` por módulo, Prisma trabaja mejor con uno solo.

`prisma/seed.ts` puebla ese esquema con ~1200 productos: una base real de [DummyJSON](https://dummyjson.com) (194 productos, sin scraping) más productos sintéticos generados con Faker hasta superar el objetivo. Respeta RN-01 (código homologado único, ~90% publicado), RN-02 (costo siempre por debajo del precio digital) y deja ~1 de cada 6 filas de disponibilidad con sincronización vencida para poder probar RN-04 contra datos reales. El detalle completo está comentado en `prisma/seed.ts` y `prisma/lib/`.

## Cómo usarlo

```bash
npm install
cp .env.example .env        # completar DATABASE_URL (Cloud SQL o Postgres local)
npm run prisma:migrate      # crea las tablas
npm run seed                # siembra: DummyJSON + Faker hasta 1200 productos
```

`npm run seed:test` corre el mismo proceso en modo `--dry-run`: genera y valida el catálogo (sin códigos duplicados, RN-02 respetada en el 100%) sin tocar ninguna base de datos. Útil para verificar que el generador sigue sano después de cambios, sin depender de tener Postgres a mano.

`scripts/test-generacion.ts` es la prueba de las funciones puras de generación (sin red, sin base de datos) — corre con `npx ts-node scripts/test-generacion.ts`.

## Lo que falta (Claude Code lo construye siguiendo `../docs/plan-de-trabajo.md`)

Scaffold de NestJS, un módulo por sub-problema del canon, los adaptadores de sistemas externos simulados (`docs/arquitectura.md` sección 6), la integración con Stripe en modo sandbox, y los tres endpoints internos que consume Cloud Scheduler (`docs/despliegue-gcp.md` sección 7).
