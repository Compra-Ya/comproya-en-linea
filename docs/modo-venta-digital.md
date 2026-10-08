# Modo de venta digital con envío (prueba de usabilidad)

## Qué es y por qué existe

La evaluación de usabilidad (ISO/IEC 9126-2, sección 8.3) se aplica sobre una compra **solo digital**: el Cliente digital
agrega productos al carrito, elige la cantidad, escribe sus datos y su dirección de envío, paga con tarjeta en la
pasarela de Stripe (modo de prueba) y ve el pedido confirmado. No hay retiro en sucursal.

## Desviaciones frente al canon (decididas por el equipo para esta prueba)

El canon (`docs/canon/CANON-ComproYa.md`) define el retiro en sucursal con código de retiro. Este modo se aparta de él en:

| Canon | En el modo de venta digital |
|---|---|
| El cliente elige la sucursal de retiro | No elige sucursal: despacha la que tenga unidades para todo el pedido (`CatalogoService.elegirSucursalDeDespacho`) |
| RN-04: una sucursal sin sincronizar hace más de 15 minutos no ofrece retiro | No aplica al despacho (la reserva se hace sin exigir sincronización); RN-03 y RN-05 siguen vigentes |
| Código de retiro de un solo uso (RN-08), vence a los 5 días | No se muestra al cliente (el código se sigue generando) |
| Pago con tarjeta o con débito bancario | Solo tarjeta en la interfaz; el débito sigue en el servidor |
| "Logística propia" fuera de alcance | Se guardan los datos de envío del pedido, pero no hay seguimiento ni gestión de entrega |

Nada de lo del canon se borra: el modo retiro sigue disponible.

## Cómo se activa

- **Frontend:** `NEXT_PUBLIC_MODO_ENTREGA`. Sin definir (o cualquier valor distinto de `retiro`) es venta digital con envío; `retiro` vuelve al flujo del canon. Se lee al compilar, así que hay que reiniciar o recompilar el frontend al cambiarla.
- **Backend:** el modo lo decide cada solicitud: `POST /pedidos/confirmar` con `tipoEntrega: "ENVIO"` y `envio: { nombre, telefono, direccion, ciudad, notas? }`, o con `branchId` (retiro, por defecto).

## Qué cambió en el código

- Migración `add_delivery_mode`: `orders.delivery_mode` (`PICKUP` por defecto o `SHIPPING`) y `shipping_name`, `shipping_phone`, `shipping_address`, `shipping_city`, `shipping_notes`.
- `ConfirmarPedidoDto` valida los datos de envío con mensajes en español; `PedidoService.confirmar` los guarda; el comprobante los devuelve.
- Pruebas: `backend/src/pedido/pedido.envio.spec.ts` (envío sin sucursal, despacho sin sincronización, RN-03 y RN-05, validación por el endpoint real, y que el retiro sigue igual).
- Frontend: `src/lib/modo.ts` (modo y textos), detalle con cantidad (`DetalleProductoEnvio`), carrito, "Datos y envío", pago solo con tarjeta, "Pedido confirmado" y "Mis pedidos".

## Cómo correr la prueba en local

1. `docker compose up -d db`; aplicar migraciones; sembrar el catálogo.
2. Orden de los scripts de catálogo (en `backend/`): `apply-product-images.ts`, `traducir-nombres-de-productos.ts`, `categorizar-sinteticos.ts`, `normalizar-precios-cop.ts`, `publicar-solo-con-imagen.ts`.
3. Backend con `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAYMENT_TOKEN_ENCRYPTION_KEY` y `DEBITO_NOTIFICATION_SECRET`; frontend con `NEXT_PUBLIC_API_URL`.
4. Para que el pedido pase a "Pagado" hace falta el webhook de Stripe: `stripe listen --forward-to http://localhost:3001/api/pagos/webhook/stripe` y copiar el `whsec_…` a `STRIPE_WEBHOOK_SECRET`. En la pasarela de prueba se usa la tarjeta `4242 4242 4242 4242`.
5. Verificación automática del recorrido (sin pagar de verdad): `e2e/capturas/verificar-flujo-venta-digital.mjs`.
