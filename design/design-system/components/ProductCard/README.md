# ProductCard

Tarjeta del catálogo con agregar al carrito y confirmación junto al botón (A-15, UT-08).

## Qué aporta quien lo usa

`name`, `category` (nombre en español), `price` (el `digitalPrice` del servidor), `image`, `href` (al detalle), `onAdd`, `state` (`idle`, `adding`, `added`, `error`).

## Reglas

- La confirmación "Producto agregado al carrito…" aparece **dentro de la tarjeta pulsada**, con enlace "Ver carrito".
- El nombre ocupa hasta dos líneas; el precio va en `price` (16 px, 700).
- Sin corazón ni lista de deseos (fuera de alcance), sin estrellas ni reseñas, sin "SKU" ni código homologado.
- Rejilla: `minmax(180px, 1fr)` con hueco `space-4`; dos columnas a 390 px.
