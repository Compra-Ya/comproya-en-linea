# ShopHeader

La misma cabecera de tienda en **todas** las pantallas, incluidas confirmar pedido, pago y comprobante (A-02, UT-06).

## Variantes

- completa: barra superior `navy-700`, sello y nombre, buscador siempre visible, cuenta, carrito con cantidad y subtotal, y la navegación Catálogo · Carrito · Mis pedidos · Mi cuenta.
- `variant="compact"`: para confirmar pedido, pago y comprobante. Quita la barra superior y el buscador; conserva sello, cuenta, carrito y la misma navegación.

## Qué aporta quien lo usa

`active` (`catalogo`, `carrito`, `pedidos`, `cuenta`), `cartCount`, `cartTotal` (el subtotal que devuelve el servidor), `customerName` (sin él, "Iniciar sesión"), `branchesWithPickup` (número real; si no se conoce, no se pasa y no se muestra), `onSearch`, `query`.

## Reglas

- Ninguna cifra escrita a mano: "8 sucursales" sale de los datos o no aparece (A-12).
- El carrito no es una categoría: va como enlace de navegación con ícono y texto.
- Sin selector "Todas" en el buscador mientras no filtre.
- A 390 px el buscador pasa a su propia fila a todo el ancho, el botón de carrito se oculta y la navegación se vuelve una barra de cuatro columnas con ícono y texto, donde "Carrito (n)" sigue visible.
