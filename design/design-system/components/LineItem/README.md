# LineItem

Fila de producto: foto, nombre, precio unitario ("cada uno"), cantidad, total de la línea y "Quitar".

## Qué aporta quien lo usa

`name`, `image`, `unitPrice`, `quantity`, `max`, `lineTotal` (del servidor; si no llega se muestra precio × cantidad), `onQuantity`, `onRemove`, `readOnly` (en Pago y Pedido confirmado).

## Reglas

- "Quitar" lleva ícono de papelera, texto visible y tooltip "Quitar {producto} del carrito".
- A 390 px la cantidad y el total pasan bajo el nombre.
