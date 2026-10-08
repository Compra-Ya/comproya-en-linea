# Button

Botón único para todas las acciones del flujo: reemplaza `btn-primary`, `btn-primary-lg`, `btn-navy`, `btn-outline-red` y `btn-login` (A-17).

## Variantes

- `primary`: la acción principal de la pantalla, **una sola por pantalla** ("Confirmar pedido", "Pagar con tarjeta", "Agregar al carrito" en cada tarjeta). Fondo `orange-600`, texto blanco 5,26:1.
- `secondary`: salidas y alternativas ("Volver al carrito", "Iniciar sesión", "Aplicar" del cupón). Borde `line-strong`.
- `ghost`: enlaces con forma de botón en avisos ("Ver mis pedidos", "Reintentar" dentro de un `Notice`).
- `danger`: solo "Cancelar pedido".

`size="lg"` (46 px) solo para la acción que avanza un paso del flujo. `full` ocupa todo el ancho: úsalo en tarjetas de producto y en el resumen a 390 px.

## Qué aporta quien lo usa

`children` (el texto, verbo + objeto, del vocabulario del brief), `onClick` o `href` (con `href` se pinta un `<a>`), `icon` opcional (nombre de `Icon`, siempre acompañado de texto), `loading` mientras el servidor responde (el botón se deshabilita y anuncia `aria-busy`).

## Reglas

- Un botón deshabilitado no se explica solo: si una acción no está disponible, muestra el motivo al lado (ver `BranchAvailability`) o no pintes el botón.
- No uses `orange-500` para botones: con texto blanco da 3,14:1.
- El texto del botón que avanza es el nombre del paso siguiente: "Confirmar pedido" lleva a la pantalla "Confirmar pedido".
