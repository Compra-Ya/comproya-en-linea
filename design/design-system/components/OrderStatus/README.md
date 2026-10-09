# OrderStatus

Estado del pedido en palabras, con ícono y tono fijos.

## Qué aporta quien lo usa

`status`: `creado` (se lee "Pendiente de pago"), `pagado`, `en-alistamiento`, `entregado`, `cancelado` o `pago-fallido`.

## Reglas

- Un pedido se cancela solo antes de empezar el alistamiento (`creado` y `pagado`).
- `cancelado` y `pago-fallido` van siempre con su explicación (ver `OrderRow`).
- Si el servidor agrega un estado de envío (por ejemplo "En camino"), se agrega aquí con su palabra exacta, no en cada pantalla.
