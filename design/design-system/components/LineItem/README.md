# LineItem

Línea de producto en carrito, confirmar pedido y comprobante.

## Qué aporta quien lo usa

`name`, `image`, `unitPrice`, `quantity`, `max`, `branch` (si el producto ya tiene sucursal), `onQuantity`, `onRemove`, `readOnly` (en confirmar pedido y comprobante: muestra "3 unidades" en vez del selector).

## Reglas

- El precio unitario se lee "{precio} cada uno", nunca "c/u".
- El total de la línea es informativo; el total del pedido viene del servidor (`OrderSummary`).
- A 390 px los controles pasan bajo el nombre, alineados con él.
