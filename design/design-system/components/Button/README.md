# Button

Botón único para todas las acciones: texto con verbo, ícono de apoyo opcional y tooltip cuando hace falta precisar sobre qué actúa.

## Variantes

- `primary`: la acción principal de la pantalla, **una sola por pantalla** (en el catálogo, una por tarjeta). Fondo `orange-600`, texto blanco 5,26:1.
- `secondary`: alternativas y salidas ("Volver al carrito", "Ver carrito", "Iniciar sesión").
- `ghost`: acción ligera ("Seguir comprando", "Revisar de nuevo").
- `ghost-danger`: solo "Cancelar pedido".
- `navy`: acciones sobre el pie o bandas azul marino.

Tamaños: `md` (44 px, objetivo táctil mínimo), `lg` (48 px) para la acción que avanza un paso, `sm` dentro de avisos. `full` ocupa el ancho de la tarjeta o del resumen.

## Qué aporta quien lo usa

`children` (verbo + objeto), `onClick` o `href`, `icon` / `iconRight` (nombre de `Icon`, siempre con texto), `loading`, `tooltip` (una línea que precisa la acción: "Agregar {producto} al carrito"), `disabled` **con** `disabledReason`.

## Reglas

- Un botón deshabilitado siempre dice por qué, debajo del botón ("Producto agotado: por ahora no hay unidades.").
- `loading` cambia el texto a gerundio ("Agregando…") y anuncia `aria-busy`; nunca deja el botón sin texto.
- Transición de color de 150 ms; al presionar baja 1 px.
- Nunca `orange-500` con texto blanco (3,14:1).
