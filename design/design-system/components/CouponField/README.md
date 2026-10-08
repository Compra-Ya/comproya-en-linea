# CouponField

Campo del cupón de lealtad en "Confirmar pedido": la función avanzada de la prueba UT-12.

## Estados

- `idle`: campo vacío, ayuda "Cada cupón se usa una sola vez por pedido."
- `checking`: "Validando…" en el botón, mientras el servidor responde.
- `applied`: mensaje verde con el código y el descuento real; el campo queda de solo lectura y el botón cambia a "Quitar".
- `invalid`: "Ese cupón no es válido o ya venció. Revisa el código o continúa sin cupón."

## Qué aporta quien lo usa

`value`, `onChange`, `onApply` (llama a la validación del servidor), `onRemove`, `status`, `appliedText` (con el porcentaje que devolvió el servidor), `errorText` opcional.

## Reglas

- Se muestra **un solo mensaje a la vez** (A-08): nunca el verde y el rojo juntos.
- "Aplicado" solo después de validar de verdad. Si el servidor solo valida al confirmar, el estado tras "Aplicar" es `checking` hasta tener respuesta.
- El descuento aparece en `OrderSummary` como "Descuento por cupón" en cuanto se aplica.
- El placeholder es "Escribe tu código", nunca un código real.
