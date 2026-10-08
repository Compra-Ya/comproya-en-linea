# Tabs

Selector de la forma de pago en la pantalla "Pagar pedido #N".

## Qué aporta quien lo usa

`items` (`{id, label, icon}`), `value`, `onChange`, `label` (nombre del grupo para lectores de pantalla).

## Reglas

- Dos pestañas, con estos nombres exactos: "Pago con tarjeta" y "Pago con débito bancario". Nunca "PSE".
- Cambiar de pestaña no inicia ningún pago: el pago empieza con el `Button` primary de cada pestaña.
