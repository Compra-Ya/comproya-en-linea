# Despliegue rápido — Vercel (frontend) + Railway (backend + Postgres)

Este documento es una **alternativa de demo**, no un reemplazo de `docs/despliegue-gcp.md`. El canon y `docs/arquitectura.md` siguen apuntando a GCP (Cloud Run + Cloud SQL) como destino real del proyecto; esto solo sirve para tener una URL pública rápida que enseñar mientras eso se hace. Nada del código depende de esta elección — el backend lee `PORT`/`DATABASE_URL` de variables de entorno igual en cualquier proveedor.

**Por qué no todo en Vercel:** Vercel es ideal para el frontend (Next.js), pero el backend tiene jobs programados en proceso (`SupresionJob`, `LiberacionReservasJob`, `@nestjs/schedule`) y una conexión persistente a Postgres vía Prisma — cosas que un entorno serverless como Vercel no sostiene sin reescribir esa parte. Railway corre el `backend/Dockerfile` tal cual, como un proceso de larga duración, sin tocar código.

## 1. Cuentas y credenciales que hacen falta

Ninguna de estas se escribe en el repositorio ni se comparte por chat — se cargan directamente en el panel de variables de entorno de Railway/Vercel/Stripe.

| Servicio | Qué crear | Para qué |
|---|---|---|
| [Railway](https://railway.app) | Cuenta + proyecto nuevo | Hospeda el backend (Docker) y el Postgres |
| [Stripe](https://dashboard.stripe.com) | Cuenta, en **modo de prueba** | CU-15 (pago con tarjeta) — nunca se necesita una cuenta en modo real para esta entrega |
| [Vercel](https://vercel.com) | Cuenta + proyecto nuevo | Hospeda el frontend (Next.js) |

## 2. Backend + Postgres en Railway

1. **New Project → Deploy from GitHub repo**, seleccionar este repositorio.
2. En el servicio creado, **Settings → Root Directory**: `backend` (Railway detecta el `Dockerfile` ahí).
3. **New → Database → PostgreSQL** dentro del mismo proyecto. Railway inyecta automáticamente `DATABASE_URL` al servicio del backend si los conectas (Settings del backend → Variables → "Add Reference" a la variable del Postgres) — no hay que copiar la cadena de conexión a mano.
4. En **Variables** del servicio backend, agregar (valores reales, nunca en `.env` del repo):
   - `JWT_SECRET` — un secreto largo y aleatorio (`openssl rand -base64 32`).
   - `FRONTEND_ORIGIN` — la URL de Vercel del paso 4, y sus dominios de preview si aplica, separados por coma (`main.enableCors` en `backend/src/main.ts` ya soporta una lista).
   - `JOBS_ENABLED` = `true`.
   - `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` — ver sección 4.
   - `TARGET_PRODUCTS` = `1200` (opcional, solo si van a correr `seed`).
   - Railway ya inyecta `PORT` automáticamente — el código ya lo respeta (`backend/src/main.ts`), no hay que fijarlo.
5. Deploy. Railway da una URL pública tipo `https://<algo>.up.railway.app`.
6. Correr las migraciones una vez, contra esa base de datos (desde la consola de Railway, "Run a command", o localmente con `DATABASE_URL` apuntando a la de Railway):
   ```bash
   npx prisma migrate deploy
   npm run seed:all   # opcional: datos de ejemplo
   ```

## 3. Frontend en Vercel

1. **Add New Project**, importar este mismo repositorio.
2. **Root Directory**: `frontend`.
3. Framework se detecta solo (Next.js). Variables de entorno:
   - `NEXT_PUBLIC_API_URL` = `https://<tu-backend-en-railway>/api`
4. Deploy. Vercel da la URL de producción (y una por cada preview de rama/PR).
5. Volver a Railway y completar `FRONTEND_ORIGIN` con esta URL (paso 2.4) — sin esto, el navegador bloquea las peticiones por CORS.

## 4. Stripe — completar el círculo del webhook

El signing secret del webhook solo existe después de que el backend tiene una URL pública, así que va al final:

1. En el [dashboard de Stripe](https://dashboard.stripe.com) (interruptor **Test mode** activado): *Developers → API keys* → copiar `Secret key` (`sk_test_...`) a `STRIPE_SECRET_KEY` en Railway.
2. *Developers → Webhooks → Add endpoint*: URL `https://<tu-backend-en-railway>/api/pagos/webhook/stripe`, evento `checkout.session.completed` (y `checkout.session.expired`, `payment_intent.payment_failed`).
3. Copiar el `Signing secret` (`whsec_...`) a `STRIPE_WEBHOOK_SECRET` en Railway.
4. Redeploy del backend en Railway para que tome las variables nuevas.
5. Probar con las [tarjetas de prueba de Stripe](https://stripe.com/docs/testing): `4242 4242 4242 4242` (pago exitoso) y `4000 0000 0000 0002` (rechazado, camino E-2).

## 5. Verificación final

- `https://<tu-backend-en-railway>/api/catalogo/sucursales` responde JSON (no 404/502).
- El frontend en Vercel carga el catálogo sin errores de CORS en la consola del navegador.
- Un pedido de prueba completo (registro → carrito → confirmar → pagar con tarjeta de prueba → comprobante) funciona de punta a punta.
