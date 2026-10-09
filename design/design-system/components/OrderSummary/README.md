# OrderSummary

Resumen del pedido con la acción principal del paso.

## Qué aporta quien lo usa

`itemsCount`, `subtotal`, `discount` + `discountLabel` (si hay cupón), `shippingLabel` (texto del costo de envío si el servidor lo devuelve), `total`, `items` (miniaturas en Datos y envío, Pago y Pedido confirmado), `note` (reserva de unidades), `secure` (línea de la pasarela segura), `children` (el `Button` primary del paso), `title`, `totalLabel` ("Total pagado").

## Reglas

- Muestra los valores que devuelve el servidor, sin recalcular.
- A la derecha en escritorio (fijo al desplazar); debajo en celular.
