# Tooltip

Etiqueta de una línea que aparece al pasar el mouse **y** al enfocar con teclado. Explica qué hace un control o qué significa un término.

## Qué aporta quien lo usa

`label` (una línea, máximo unas 8 palabras, empieza con verbo si es una acción), `children` (un solo elemento enfocable), `placement` (`top` o `bottom`), `open` para dejarlo visible en un tablero, `describe={false}` cuando el texto repite el nombre del control.

## Reglas

- Fondo `navy-700`, texto blanco 12 px semibold (10,9:1), radio `radius-sm`, flecha.
- Aparece tras 250 ms al pasar el mouse (evita parpadeos al mover el cursor) y sin espera con el foco; se va al salir o con Esc.
- Nunca guarda información que solo esté ahí: lo esencial va en texto visible; el tooltip precisa.
- En pantallas táctiles no hay hover: por eso todo ícono lleva también etiqueta visible.
