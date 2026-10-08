# Badge

Etiqueta corta de estado con texto siempre visible; el color nunca es la única señal (UT-02).

## Qué aporta quien lo usa

`tone` (`neutral`, `info`, `ok`, `warn`, `danger`, `brand`), `children` (dos a cuatro palabras), `icon` opcional (si no, un punto).

## Reglas

- El texto dice el estado completo: "Disponible para retiro", no "OK".
- `brand` solo para marcar un producto complementario o una etiqueta de catálogo; no compite con el precio.
- Para estados de pedido usa `OrderStatus`, que fija nombre, tono e ícono.
