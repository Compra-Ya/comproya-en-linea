# CouponField

Cupón de lealtad opcional en "Datos y envío". Es la función avanzada de la prueba UT-12.

## Estados

`idle` (ayuda "Cada cupón se usa una sola vez por pedido."), `checking` ("Validando…"), `applied` (mensaje verde con el descuento real; el campo queda bloqueado y el botón cambia a "Quitar"), `invalid` ("Ese cupón no existe o ya venció. Revisa el código o continúa sin cupón.").

## Qué aporta quien lo usa

`value`, `onChange`, `onApply` (valida en el servidor), `onRemove`, `status`, `appliedText` con el porcentaje y el valor que devolvió el servidor.

## Reglas

- Un solo mensaje a la vez.
- "Aplicado" solo después de validar; el descuento aparece en `OrderSummary` en el mismo momento.
- El "?" de la etiqueta explica qué es un cupón de lealtad.
