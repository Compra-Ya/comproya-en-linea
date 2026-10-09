# QuantityStepper

Selector de cantidad con botones de 44 px y tooltips con verbo: "Disminuir cantidad", "Aumentar cantidad".

## Qué aporta quien lo usa

`value` + `onChange` (o `defaultValue` si no se controla), `min` (1), `max` (máximo por pedido que devuelve el servidor), `hint` ("Máximo 10 por pedido"), `label`.

## Reglas

- En el mínimo, "Disminuir" se deshabilita y su tooltip dice el mínimo; para sacar el producto se usa "Quitar".
- En el máximo, "Aumentar" se deshabilita con el tooltip "Llegaste al máximo por pedido".
- El número se anuncia al cambiar (`aria-live`).
