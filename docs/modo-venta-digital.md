# Venta digital con envío (prueba de usabilidad)

## Qué es y por qué existe

La evaluación de usabilidad (ISO/IEC 9126-2, sección 8.3) se aplica sobre una compra **solo digital**: el Cliente digital
agrega productos al carrito, elige la cantidad, escribe sus datos y su dirección de envío, paga con tarjeta en la
pasarela de Stripe (modo de prueba) y ve el pedido confirmado. No hay retiro en sucursal en la interfaz.

## Desviaciones frente al canon (decididas por el equipo para esta prueba)

El canon (`docs/canon/CANON-ComproYa.md`) define el retiro en sucursal con código de retiro. La interfaz se aparta de él en:

| Canon | En la venta digital |
|---|---|
| El cliente elige la sucursal de retiro | No elige sucursal: despacha la que tenga unidades para todo el pedido (`CatalogoService.elegirSucursalDeDespacho`) |
| RN-04: una sucursal sin sincronizar hace más de 15 minutos no ofrece retiro | No aplica al despacho (la reserva se hace sin exigir sincronización); RN-03 y RN-05 siguen vigentes |
| Código de retiro de un solo uso (RN-08), vence a los 5 días | No se muestra al cliente (el código se sigue generando) |
| Pago con tarjeta o con débito bancario | Solo tarjeta en la interfaz; el débito sigue en el servidor |
| "Logística propia" fuera de alcance | Se guardan los datos de envío del pedido, pero no hay seguimiento ni gestión de entrega |
| RN-09: un pedido se cancela mientras no haya iniciado su alistamiento (incluye el pedido ya pagado) | La interfaz solo ofrece «Cancelar pedido» antes de pagar; un pedido pagado no se cancela desde «Mis pedidos» porque en la venta digital no hay reembolso definido |

Nada de lo del canon se borra del servidor: el retiro con sucursal sigue disponible en la API.

## Qué es de la interfaz y qué es del servidor

- **Interfaz:** solo existe la venta con envío. Se retiró la variable `NEXT_PUBLIC_MODO_ENTREGA` y `src/lib/modo.ts`: ya no hay un interruptor en el frontend.
- **Servidor:** el modo lo decide cada solicitud. `POST /pedidos/confirmar` con `tipoEntrega: "ENVIO"` y `envio: { nombre, telefono, direccion, ciudad, notas? }` es la venta digital; con `branchId` (y sin `tipoEntrega`) es el retiro del canon.
- **Decisión pendiente:** `POST /pedidos/:id/cancelar` sigue la regla RN-09 y acepta pedidos pagados que no han iniciado alistamiento. La interfaz no lo ofrece, pero la API sí lo permite. Para cerrar la diferencia hace falta decidir el reembolso: o la API deja de cancelar pedidos pagados, o la interfaz lo ofrece junto con un reembolso.

## Qué cambió en el servidor para la venta digital y el rediseño

Los totales, descuentos y unidades los calcula siempre el servidor; la interfaz solo los muestra.

- Migración `add_delivery_mode`: `orders.delivery_mode` (`PICKUP` por defecto o `SHIPPING`) y `shipping_name`, `shipping_phone`, `shipping_address`, `shipping_city`, `shipping_notes`.
- `ConfirmarPedidoDto` valida los datos de envío con mensajes en español; `PedidoService.confirmar` los guarda; el comprobante los devuelve.
- Carrito: devuelve `subtotal`, `unidades`, `maxPorProducto` y `lineTotal` por línea (`carrito/dominio/totales.ts`). Tope de 10 unidades por producto (`comun/limites.ts`), también al fusionar el carrito de invitado.
- Catálogo: cada producto trae `unidadesDisponibles` (lo máximo que una sola sucursal puede despachar) y `maximoPorPedido` (el menor entre las unidades y 10).
- Pedido: `subtotal`, `descuento`, `total`, `codigoCupon` y `porcentajeCupon` (`pedido/dominio/totales.ts`), en el detalle, en el listado y en el comprobante.
- Cupón: `POST /cupones/validar` con `{ codigo }` devuelve `{ codigo, porcentaje, subtotal, descuento, total }` contra el carrito de la persona con sesión. El código se normaliza a mayúsculas. Cupón de prueba local: `LEALTAD10` (10 %).
- Cuenta: un correo repetido responde 409 «Ya existe una cuenta registrada con ese correo electrónico».
- Pruebas nuevas: `pedido.envio.spec.ts`, `pedido/dominio/totales.spec.ts`, `pedido.cupones.spec.ts`, `carrito.limites.spec.ts`, `catalogo.unidades.spec.ts` y el caso del correo repetido en `cuenta.service.spec.ts`.

## Cómo correr la prueba en local

1. `docker compose up -d db`; aplicar migraciones (`npx prisma migrate deploy`); sembrar el catálogo.
2. Orden de los scripts de catálogo (en `backend/`): `apply-product-images.ts`, `traducir-nombres-de-productos.ts`, `categorizar-sinteticos.ts`, `normalizar-precios-cop.ts`, `publicar-solo-con-imagen.ts` y `sembrar-complementarios.ts`. Todos aceptan `--dry-run`.
3. Backend con `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAYMENT_TOKEN_ENCRYPTION_KEY` y `DEBITO_NOTIFICATION_SECRET`; frontend con `NEXT_PUBLIC_API_URL`.
4. Para que el pedido pase a «Pagado» hace falta el webhook de Stripe: `stripe listen --forward-to http://localhost:3001/api/pagos/webhook/stripe` y copiar el `whsec_…` a `STRIPE_WEBHOOK_SECRET`. En la pasarela de prueba se usa la tarjeta `4242 4242 4242 4242`.
5. Verificación automática (sin pagar de verdad), desde `e2e/`:
   - `node capturas/verificar-rediseno.mjs`: 36 estados de pantalla a 1440 y 390 px, con desborde horizontal, vocabulario prohibido, nombres accesibles y `alt`. Escribe `design/verificacion-rediseno/tabla-verificacion.md`.
   - `node capturas/verificar-teclado.mjs`: recorrido solo con teclado hasta la pasarela, con foco visible y objetivos de 44 px. Escribe `design/verificacion-rediseno/teclado.md`.
