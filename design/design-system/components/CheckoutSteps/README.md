# CheckoutSteps

Indicador de progreso de los cuatro pasos de la compra, con "Volver" explícito (A-05, UT-03).

## Qué aporta quien lo usa

`current` (1 Carrito, 2 Confirmar pedido, 3 Pago, 4 Comprobante) y `back` (`{label, href}`) en los pasos 2 y 3: "Volver al carrito", "Volver a confirmar pedido".

## Reglas

- Va debajo de `ShopHeader` y encima del título de pantalla en las cuatro pantallas del flujo, en la misma posición.
- Los nombres de los pasos son los títulos de las pantallas. No uses "Confirmación" ni "Checkout".
- A 390 px se resume en una línea: "Paso 2 de 4 · Confirmar pedido".
- En el comprobante no hay "Volver": las salidas son "Seguir comprando" y "Ver mis pedidos".
