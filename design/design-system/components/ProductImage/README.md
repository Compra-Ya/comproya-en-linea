# ProductImage

Foto del producto en contenedor cuadrado, contenida sin recortar; si no hay foto o falla, el placeholder (nunca una imagen rota).

## Qué aporta quien lo usa

`src` (o `null`), `alt` (el nombre del producto), `category` (nombre de pantalla en español, para el placeholder), `size` (`card` o `thumb` de 64 px).

## Reglas

- 1034 de 2117 productos no tienen foto: el placeholder es un estado normal, no un error.
- Contenedor 1:1, `object-fit: contain`, fondo `surface`. No prometas zoom: hay una sola resolución de 300 a 800 px.
- El texto alternativo del placeholder es "Sin foto: {producto}".
- No supongas que foto y categoría coinciden (los nombres sintéticos no corresponden a su categoría).
