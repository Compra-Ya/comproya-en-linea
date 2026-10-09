# ShopHeader

La misma cabecera en todas las pantallas: logo, buscador siempre visible, cuenta y carrito, y la navegación Catálogo · Carrito · Mis pedidos · Mi cuenta.

## Variantes

- completa: barra azul marino con las dos promesas (envío a la dirección que escribas, pago en la pasarela segura), logo, buscador, cuenta y carrito con cantidad y subtotal.
- `compact`: del paso 2 en adelante. Sin barra superior ni buscador; muestra "Compra segura" y conserva cuenta, carrito y la navegación (UT-06).

## Qué aporta quien lo usa

`logoSrc` (el logo horizontal del grupo Logos), `active`, `cartCount`, `cartTotal` (subtotal del servidor), `customerName`, `query`, `onSearch`.

## Reglas

- Cada ícono de la navegación lleva su palabra; el carrito muestra la cantidad en un círculo naranja y su tooltip la dice completa.
- A 390 px el buscador ocupa su propia fila y la navegación es una barra de 4 columnas con ícono sobre texto.
