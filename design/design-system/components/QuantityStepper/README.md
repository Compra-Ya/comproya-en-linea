# QuantityStepper

Cantidad de un producto en el carrito, con botones que se anuncian como "Disminuir cantidad" y "Aumentar cantidad".

## Qué aporta quien lo usa

`value`, `onChange`, `min` (1 por defecto), `max` (las unidades disponibles que devuelve el servidor, si se conocen), `label`.

## Reglas

- En el mínimo, "Disminuir" se deshabilita; para quitar el producto se usa "Quitar".
- Si la cantidad supera las unidades disponibles, el error se muestra en la línea del producto, con su nombre.
