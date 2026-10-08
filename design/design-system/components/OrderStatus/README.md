# OrderStatus

Insignia de estado del pedido con los siete nombres del canon, sin variaciones.

## Qué aporta quien lo usa

`status`: `creado`, `pagado`, `en-alistamiento`, `listo-para-retiro`, `entregado`, `cancelado` o `pago-fallido`.

## Reglas

- Los nombres son fijos: Creado, pendiente de pago · Pagado · En alistamiento · Listo para retiro · Entregado · Cancelado · Pago fallido. No inventes estados ni sinónimos.
- Cada estado lleva ícono y palabra; `cancelado` y `pago-fallido` van acompañados del motivo (ver `OrderRow`).
