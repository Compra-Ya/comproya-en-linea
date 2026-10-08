# Field

Campo de formulario con etiqueta asociada (`htmlFor`), ayuda en línea y error en el propio campo (A-16, UT-09).

## Qué aporta quien lo usa

`label` (obligatorio, visible), `hint` (la regla antes de equivocarse: "Mínimo 8 caracteres"), `error` (qué pasó y qué hacer, con el nombre del campo implícito), `optional`, y las props del `<input>` (`type`, `value`, `onChange`, `autoComplete`). Con `as="select"` y `options` (`{value, label, disabled}`) pinta un selector.

## Reglas

- El error no borra lo escrito: conserva `value`.
- Valida al salir del campo, no en cada tecla.
- En el selector de sucursal, las que no ofrecen retiro van deshabilitadas y dicen "(sin retiro por ahora)".
- El placeholder nunca reemplaza la etiqueta ni sugiere un dato real.
