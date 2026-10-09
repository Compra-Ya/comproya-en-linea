# IconButton

Botón de solo ícono (flechas del carrusel, cantidad, cerrar, pausar). Siempre tiene nombre accesible y tooltip con un verbo claro.

## Qué aporta quien lo usa

`icon`, `label` (obligatorio: el verbo, "Ver más categorías"; se usa como `aria-label` y como tooltip), `tooltip` si el texto visible debe ser más largo, `variant` (`secondary` circular con borde, `plain` sin borde dentro de otro control), `onClick`, `disabled`.

## Reglas

- 44 × 44 px siempre: es el objetivo táctil.
- El tooltip aparece a los 250 ms al pasar el mouse y de inmediato al enfocar con teclado; Esc lo cierra.
- Si existe espacio para texto visible, usa `Button` con ícono: el botón de solo ícono es para controles repetidos y conocidos.
