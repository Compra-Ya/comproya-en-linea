# Spinner

Indicador de que el sistema trabaja, siempre con una frase que dice qué está haciendo.

## Qué aporta quien lo usa

`label`: la acción en curso en primera persona del plural ("Estamos confirmando tu pago…"). Sin `label`, solo lo anuncia a lectores de pantalla como "Cargando".

## Reglas

- Para esperas de página completa (catálogo, carrito) usa `Skeleton`, que conserva la estructura.
- Para esperas con plazo (débito bancario) usa `Notice` `tone="progress"` con la hora límite.
