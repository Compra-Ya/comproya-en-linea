# BranchAvailability

Disponibilidad del producto por sucursal en el detalle, con el nombre de la sucursal y el motivo cuando no hay retiro (A-13, regla de los 15 minutos).

## Qué aporta quien lo usa

`branches` (`{id, name, city, units, canPickup}`: `units` es `unidadesDisponibles` y `canPickup` es `puedeRetirar`, tal como llegan del servidor), `onPickup(branch)`, `selectedId` (la sucursal ya en el carrito).

## Reglas

- Nunca "Sucursal #6": nombre y ciudad, de `GET /catalogo/sucursales`.
- Una sucursal sin retiro no muestra un botón atenuado: muestra "Sin retiro por ahora" y el motivo en una línea.
- Ordena primero las que ofrecen retiro.
- Tras "Retirar aquí", la confirmación aparece en la misma fila.
- No muestres "Sincronizado hace N min" ni minutos negativos o enormes: el cliente solo necesita saber si puede retirar.
- A 390 px cada sucursal se apila en tres líneas, sin desplazamiento horizontal.
