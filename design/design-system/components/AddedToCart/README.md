# AddedToCart

Confirmación amable que reemplaza al botón "Agregar al carrito" justo donde se pulsó: "Agregamos 2 unidades a tu carrito", con "Ver carrito" y "Seguir comprando".

## Qué aporta quien lo usa

`quantity` (la cantidad que confirmó el servidor), `cartHref`, `onContinue` o `continueHref` (vuelve el botón a su estado normal), `compact` dentro de una tarjeta.

## Reglas

- Aparece en el mismo lugar del botón pulsado (tarjeta o detalle), nunca arriba de la página.
- Singular y plural correctos: "1 unidad", "2 unidades".
- Se anuncia con `role="status"`.
