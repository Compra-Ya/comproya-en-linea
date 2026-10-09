# Field

Campo de formulario con etiqueta visible asociada, ayuda en línea y error en el propio campo.

## Qué aporta quien lo usa

`label`, `hint` (la regla antes de equivocarse), `error` (qué pasó y cómo corregirlo), `valid` (marca de campo correcto), `icon` (apoyo dentro del campo), `optional`, `labelTip` (abre un `InfoTip` junto a la etiqueta), `as` (`input`, `select` con `options`, `textarea`) y las props nativas (`type`, `inputMode`, `autoComplete`, `value`, `onChange`).

## Reglas

- El error aparece debajo del campo, en `danger-ink`, con ícono, y **conserva lo escrito**.
- Valida al salir del campo; el borde pasa a `danger` y el fondo a un rojo muy claro.
- Usa `autoComplete` real (`name`, `tel`, `street-address`, `address-level2`) para que el navegador ayude.
- El placeholder es un ejemplo, nunca la etiqueta.
