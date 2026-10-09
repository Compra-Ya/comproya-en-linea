# Rediseño ComproYa en Línea — paquete para implementar

Diseño aprobado del flujo de compra con envío (catálogo → producto → carrito → datos y envío → pago con Stripe → pedido confirmado → mis pedidos), a 1440 y 390 px, con todos sus estados. Esta carpeta es la especificación; el sistema de diseño está en `design/design-system/`.

## Qué hay aquí

| Archivo | Qué es |
|---|---|
| `pantallas/*.dc.html` | Fuente de cada pantalla del lienzo de diseño. Es HTML legible: el layout es markup con clases de `screens.css` y los componentes aparecen como `<x-import component-from-global-scope="ComproYa.X" prop="…">`. Los textos son los definitivos. |
| `pantallas/screens.css` | Composición de pantallas (hero, rejillas, portada de categoría, columnas de checkout, acceso) con sus puntos de quiebre a 900 y 720 px. |
| `assets-map.json` | Cada `/_blob/<id>` que citan las pantallas → archivo real del repo (`frontend/public/...` o `design/design-system/assets/Logos/...`). |
| `../design-system/` | Tokens (`tokens.json`, `tokens.css`), guía (`README.md`), 29 componentes con guía (`components/<X>/README.md`), implementación de referencia (`components/bundle.js` + `bundle.css`), tipos (`components/index.d.ts`) y logos. |

El lienzo navegable con los 58 tableros está en Claude (artifact «Rediseño ComproYa en Línea»).

## Cómo leer una pantalla `.dc.html`

- `<sc-if value="{{flag}}">` = bloque condicional; los flags se calculan al final del archivo en `renderVals()` según la prop `estado`.
- `<sc-for list="{{lista}}" as="p">` = repetición.
- `{{algo}}` = valor que en la app real viene del servidor. Los datos de `renderVals()` (nombres de producto, precios, unidades, pedidos, dirección) son **de ejemplo**: en la implementación salen de la API.
- `href="Main.dc.html"` y similares son enlaces entre tableros; ver la tabla de rutas.
- Cada pantalla declara sus estados en `data-props` → `estado.options`.

## Pantallas, rutas y estados

| Pantalla (archivo) | Ruta sugerida | Estados a implementar |
|---|---|---|
| Catálogo (`Catalogo.dc.html`) | `/` y `/?q=` | éxito, cargando, búsqueda sin resultados, error, producto agregado |
| Categoría (`Categoria.dc.html`) | `/categoria/[slug]` | éxito, cargando, categoría con pocos productos |
| Detalle (`Producto.dc.html`) | `/producto/[id]` | disponible, agregado, agotado, cargando, no disponible |
| Carrito (`Carrito.dc.html`) | `/carrito` | con productos, vacío, cargando, error |
| Datos y envío (`Datos.dc.html`) | ruta actual del paso 2 | normal, errores por campo, cupón válido, cupón inválido, sin sesión |
| Pago (`Pago.dc.html`) | `/pago/[orderId]` | normal, abriendo la pasarela, no se completó (regreso con `?cancelado=1`) |
| Pedido confirmado (`Confirmado.dc.html`) | ruta actual del comprobante | confirmado, confirmando, la confirmación tarda |
| Mis pedidos (`Pedidos.dc.html`) | `/pedidos` | con pedidos, vacío, sin sesión, cargando |
| Ingresar / Crear cuenta (`Acceso.dc.html`) | `/ingresar`, `/registro` | ingresar, ingresar con error, crear cuenta, crear cuenta con errores |

Si una ruta ya existe con otro nombre, se conserva la ruta y se cambia la pantalla.

## Reglas que no se negocian

- No cambiar la lógica de negocio: totales, descuentos, unidades y estados vienen del servidor; la interfaz no recalcula.
- Vocabulario: pedido confirmado, unidades disponibles, pago con tarjeta, cupón de lealtad, producto complementario. Nunca checkout, stock, cross-sell, PSE, ni códigos internos (RN-nn, ERP, homologado, IDs).
- Precios con `formatCOP`: `$ 1.899.900`, sin decimales.
- Todo ícono con palabra visible; todo control de solo ícono con `aria-label` y tooltip con verbo; botón deshabilitado siempre con su motivo.
- Accesibilidad: texto 4,5:1, foco visible (2 px `--focus`), objetivos táctiles de 44 px, sin desplazamiento horizontal a 390 px, `prefers-reduced-motion` respetado (el carrusel no se mueve solo).
- Fuera de alcance: reseñas, lista de deseos, recomendaciones automáticas, devoluciones, facturación, mapa de envío, retiro en sucursal.

## Qué caso de usabilidad resuelve cada pantalla

- **Catálogo** — UT-01 y UT-08: titular corto, tres pasos y productos desde la primera pantalla; «Agregar al carrito» en cada tarjeta, con la confirmación junto al botón. UT-02: cada ícono con su palabra y tooltip. UT-07: esqueletos mientras carga.
- **Categoría** — UT-06: migas de pan y el mismo carrusel con la categoría actual marcada. UT-11: misma tarjeta, nombres y posiciones que el catálogo.
- **Detalle** — UT-05: «unidades disponibles» con su «?», máximo por pedido y garantías de una línea. UT-09: el selector no pasa del máximo. UT-04: «Agotado» dice por qué.
- **Carrito** — UT-03: paso 1 de 4 y el botón nombra el paso siguiente. UT-02: cantidad y «Quitar» con tooltip. UT-10: vacío con «Ver productos», error con «Reintentar».
- **Datos y envío** — UT-12: cupón visible, valida al pulsar «Aplicar», un solo mensaje y descuento en el resumen. UT-04/UT-09: error por campo que dice cómo corregir sin borrar lo escrito.
- **Pago** — UT-05: la tarjeta se escribe en la pasarela y ComproYa nunca la ve; aviso de modo de prueba con la 4242. UT-07: «Abriendo la pasarela segura…». UT-10: si no se completó, intentar de nuevo.
- **Pedido confirmado** — UT-07: «Estamos confirmando tu pago…» con progreso y plan B si tarda. UT-01: número, total del servidor, dirección y teléfono. UT-06: salidas a Mis pedidos y Seguir comprando.
- **Mis pedidos** — UT-11: estado en palabras y siguiente acción; fallos y cancelaciones explicados; cancelar solo antes del alistamiento.
- **Acceso** — UT-09/UT-10: ayuda por campo, errores que no borran lo escrito y regreso a la pantalla donde estaba la persona.

## Pendientes por confirmar con el backend

1. Estados de pedido del flujo con envío: el diseño usa Pendiente de pago, Pagado, En alistamiento, Entregado, Cancelado y Pago fallido. Si existe uno de envío («En camino»), se agrega en `ORDER_STATUS`.
2. Máximo de unidades por pedido (el diseño muestra 10) y si hay costo de envío (el resumen solo lo muestra si el servidor lo devuelve).
3. Validación del cupón al pulsar «Aplicar»: si hoy solo se valida al crear el pedido, hace falta un endpoint de validación o mostrar «Validando…» hasta la respuesta.
4. El logo se vectorizó desde el tablero de marca; reemplazarlo por el vectorial original si existe.
