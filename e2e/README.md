# Pruebas del sistema (Playwright) — CU-09-01 y CU-09-02

Pruebas de caja negra del Caso de Uso 2 (Plan_Pruebas_ComproYa.docx, sección 9.4), contra la aplicación real (frontend + backend + Stripe en modo de prueba). No usan `webServer` de Playwright porque son **tres procesos** que hay que levantar por separado, en este orden:

## 1. Base de datos local

```bash
docker compose up -d          # desde la raíz del repo
```

## 2. Backend

```bash
cd backend
npm run start:dev             # http://localhost:3001/api
```

## 3. Frontend

```bash
cd frontend
npm run dev                   # http://localhost:3000
```

## 4. Webhook de Stripe (obligatorio — sin esto CU-09-01/CU-09-02 nunca terminan)

```bash
cd backend
stripe listen --api-key "$STRIPE_SECRET_KEY" --forward-to http://localhost:3001/api/pagos/webhook/stripe
```

La primera vez, copia el `whsec_...` que imprime este comando a `backend/.env` → `STRIPE_WEBHOOK_SECRET`, y reinicia el backend. `backend/.env` debe tener una clave real de Stripe en modo de prueba (`sk_test_...`, no el placeholder de `.env.test`).

## 5. Correr las pruebas

```bash
cd e2e
npm install
npx playwright install chromium   # solo la primera vez
npx playwright test
```

Cada prueba guarda sus capturas en `../evidencia/CU-09-01/` y `../evidencia/CU-09-02/`.

## Nota sobre CU-09-02

Un rechazo de tarjeta en Stripe Checkout no cierra la sesión (queda abierta para reintentar). El backend solo pasa el pedido a `Pago fallido` cuando la sesión expira de verdad — Stripe exige un mínimo real de 30 minutos entre creación y expiración de una Checkout Session (comprobado contra la API real), así que no se puede acortar ese plazo para la prueba. Por eso, después de capturar el rechazo real en pantalla, el test expira esa misma sesión con la API real de Stripe (`stripe.checkout.sessions.expire`), lo que dispara el webhook real `checkout.session.expired` — ningún endpoint interno de ComproYa se usa para forzar el resultado.
