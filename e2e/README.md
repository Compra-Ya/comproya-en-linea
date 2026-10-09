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

## Estado frente al rediseño (venta digital con envío)

Las tres pruebas de `tests/` (`cu-04-01`, `cu-09-01`, `cu-09-02`) se escribieron para la interfaz anterior: retiro en sucursal con código de retiro, y un registro que termina en `/privacidad` con el consentimiento pendiente. La interfaz actual es venta digital con envío (`../docs/modo-venta-digital.md`), así que **están desfasadas**: `cu-04-01` falla en el primer paso porque busca los placeholders del formulario anterior (comprobado), y `cu-09-01` y `cu-09-02` eligen sucursal y esperan un código de retiro. No se modificaron porque están ligadas a `Plan_Pruebas_ComproYa.docx` (sección 9.4) y a la evidencia de `../evidencia/`.

Verificación del rediseño (otra familia de scripts, en `capturas/`, con base local, backend y frontend corriendo):

```bash
node capturas/verificar-rediseno.mjs      # 36 estados × 1440 y 390 px → ../design/verificacion-rediseno/
AXE=1 node capturas/verificar-rediseno.mjs # lo mismo con axe-core (WCAG 2.1 A y AA, incluye contraste) → axe.json
node capturas/verificar-teclado.mjs       # flujo completo solo con teclado → ../design/verificacion-rediseno/teclado.md
node capturas/verificar-movimiento.mjs    # prefers-reduced-motion: el carrusel queda quieto
```
