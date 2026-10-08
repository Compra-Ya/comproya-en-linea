# OrderSummary

Resumen de valores del pedido con la acción principal del paso.

## Qué aporta quien lo usa

`subtotal`, `discount` y `discountLabel` (solo si hay cupón aplicado), `total`, `itemsCount`, `title` ("Resumen del pedido" por defecto; "Total pagado" en el comprobante con `totalLabel`), y como `children` el `Button` primary del paso.

## Reglas

- Muestra los valores que devuelve el servidor, sin recalcular (regla del brief).
- En escritorio va a la derecha de la lista; por debajo de `bp-md` va debajo, con el botón a todo el ancho.
