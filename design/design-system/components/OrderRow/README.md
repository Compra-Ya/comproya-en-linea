# OrderRow

Tarjeta de un pedido en "Mis pedidos": número, fecha, estado en palabras, cantidad de productos, total, ciudad de envío, explicación del estado y la siguiente acción.

## Acción por estado

| Estado | Acciones |
|---|---|
| Pendiente de pago | Pagar · Cancelar pedido |
| Pagado | Ver pedido confirmado · Cancelar pedido |
| En alistamiento | Ver pedido confirmado (y "Ya empezamos a alistarlo, así que no se puede cancelar.") |
| Entregado | Ver pedido confirmado |
| Cancelado | — (explicación) |
| Pago fallido | Pagar (explicación) |

## Qué aporta quien lo usa

`number`, `date`, `status`, `itemsCount`, `total`, `city`, `images`, `reason` (motivo de fallo o cancelación), `payHref`, `viewHref`, `onCancel`.
