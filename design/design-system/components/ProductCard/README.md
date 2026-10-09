# ProductCard

Tarjeta del catálogo: foto grande, categoría, nombre, precio grande, unidades disponibles y "Agregar al carrito" con su confirmación en el mismo lugar.

## Estados

`idle`, `adding` ("Agregando…"), `added` (`AddedToCart` compacto en lugar del botón), `error`, y agotado (`units: 0`: botón "Agotado" deshabilitado con el motivo "Producto agotado: por ahora no hay unidades.").

## Qué aporta quien lo usa

`name`, `category` (nombre en español), `price` (del servidor), `units` (unidades disponibles del servidor), `image`, `href`, `onAdd`, `state`, `addedQuantity`.

## Reglas

- Al pasar el mouse la tarjeta sube 2 px, gana sombra `shadow-md` y la foto crece 4 % (200 ms); con "reducir movimiento", nada se mueve.
- El botón lleva el ícono carrito con "+" y el tooltip "Agregar {producto} al carrito".
- Sin corazón, estrellas ni reseñas.
- Rejilla de `minmax(200px, 1fr)` con hueco `space-4`; dos columnas a 390 px.
