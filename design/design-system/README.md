Sistema de diseño del portal de compra de **ComproYa en Línea**: el Cliente digital busca un producto, lo paga en línea y lo retira en una sucursal con su código de retiro, sin ayuda de nadie. Cada regla de este sistema existe para que esa compra se entienda a la primera (los 12 casos de usabilidad UT-01 a UT-12) y funcione a 390 px de ancho.

## Principios

1. **Cada pantalla dice qué se hace ahí.** Un título `title` con el nombre de la tarea ("Confirmar pedido", "Pagar pedido #19", "Comprobante de tu pedido") y una sola acción `primary`.
2. **El usuario siempre sabe dónde está y cómo salir.** `ShopHeader` en todas las pantallas (versión `compact` en confirmar, pago y comprobante), `CheckoutSteps` en los cuatro pasos y un "Volver" explícito.
3. **El estado del sistema siempre está a la vista.** Cargando: `Skeleton`. Procesando: `Notice` `progress` con la hora límite. Reservado: la hora de vencimiento.
4. **Todo error dice qué pasó, qué hacer y ofrece el botón.** `Notice` `danger` con `action`, junto a lo que lo causó.
5. **Las reglas se explican donde se aplican, en una línea.** 15 minutos de sincronización en `BranchAvailability`, cupón de un solo uso en `CouponField`, 5 días calendario en `PickupCode`, cancelación antes del alistamiento en `OrderRow`.
6. **La interfaz muestra lo que devuelve el servidor.** Totales, descuentos y unidades disponibles no se recalculan ni se escriben a mano.

## Contenido y voz

- Español de Colombia, de tú, frases cortas y en positivo: "Agregamos el televisor a tu carrito", "Tus unidades están reservadas hasta las 15:27".
- Mayúscula solo al inicio de la frase y en nombres propios: "Confirmar pedido", no "Confirmar Pedido".
- Vocabulario fijo, igual en botones, títulos y pasos:

| Usar | Nunca |
|---|---|
| confirmar pedido | checkout, confirmación |
| pago con débito bancario | PSE |
| unidades disponibles | stock, publicadas |
| código de retiro | token, correlación |
| producto complementario | cross-sell, "curados por el Analista de Marketing" |
| ComproYa Barranquilla, Barranquilla | Sucursal #6 |

- Sin términos internos: RN-03, E-2, ERP, homologado, SKU, API, Unauthorized, nombres de encabezados HTTP.
- Cifras exactas en vez de adjetivos: "5 días calendario", "30 minutos", "más de 15 minutos". Nunca "rápido" ni "24/7".
- Ninguna cifra de datos escrita a mano ("8 sucursales"): sale del servidor o no se muestra.
- Sin emoji. Los textos de cada pantalla están en `design/06-copy.md`, columna "Propuesta".

Ejemplos del tono:

> No pudimos cargar los productos. Revisa tu conexión e inténtalo de nuevo. **[Reintentar]**

> Esperando la confirmación de tu banco. Tienes hasta las 15:42 (30 minutos). Esta pantalla se actualiza sola.

> Vence el martes 13 de octubre (5 días calendario). Se puede usar una sola vez.

## Color

La identidad naranja y azul de los mockups se conserva; los tonos que llevan texto se oscurecieron hasta pasar 4,5:1 (hallazgo A-14).

- `orange-600` es el color de acción: `Button` primary, enlaces, navegación activa, el código de retiro. Úsalo con moderación: si todo es naranja, nada es la acción principal.
- `orange-500` es el naranja de marca original. Solo en el sello CY y en bloques de identidad; nunca con texto blanco encima (3,14:1).
- `navy-700` para la barra superior, el paso completado, los avisos informativos y el anillo de foco (`focus`).
- `ink` para todo texto; `ink-soft` es el texto más tenue permitido. El antiguo `--ink-faint` (#9a9a9a) queda retirado.
- Fondo de página `surface-muted`; tarjetas, cabecera y campos `surface`. Divisores `line`; bordes de control `line-strong` (3:1).
- Estados: el texto va en `ok-ink`, `danger-ink`, `warn-ink` sobre su fondo `-soft`; `ok`, `danger` y `warn` son para íconos y bordes. Todo estado lleva palabra o ícono además del color: verde y rojo nunca se distinguen solo por el tono.
- Deshabilitado: `surface-disabled` con texto `ink-soft`, no opacidad. Y siempre con el motivo al lado.

## Tipografía

Geist (Google Fonts, pesos 400 a 800) con respaldo `system-ui`. Una escala cerrada reemplaza los once tamaños sueltos actuales.

- `title` (24/30, 700) para el título de pantalla, uno por pantalla. `display` (30/36, 800) solo en el titular del catálogo.
- `heading` (18/24) para secciones y tarjetas; `subheading` (15/20) dentro de tarjetas.
- `body` (14/20) para todo texto; `body-strong` para botones y navegación; `small` (13/18) para tablas, resumen y reglas de una línea.
- `label` (12/16, 600) para etiquetas de campo e insignias. Es el tamaño mínimo: nada en 11 px.
- `price` (16/22) en tarjetas, `price-lg` (28/34) en el detalle y el comprobante; `code` (28/34, espaciado 0,08 em) solo para el código de retiro.

## Espaciado, radios y forma

- Escala de 4 px: `space-1` a `space-10`. Margen lateral `space-6` en escritorio y `space-4` a 390 px. Separación entre secciones `space-8`.
- Radios: `radius-md` (10 px) en botones, campos, avisos y miniaturas; `radius-lg` (14 px) en tarjetas; `radius-pill` en insignias; `radius-sm` en el sello y la pestaña activa.
- Se separa con bordes `line`, no con sombras. `shadow-sm` solo en la pestaña activa.
- Controles de `control-md` (42 px); la acción que avanza un paso en `control-lg` (46 px).

## Diseño y adaptación

- Contenido a `container` (1180 px) de ancho máximo.
- Todo funciona a 390 px **sin desplazamiento horizontal** (A-18): nada de columnas fijas en estilos en línea (`1fr 340px`, `360px 1fr`). Por debajo de `bp-md` el resumen pasa debajo de la lista; por debajo de `bp-sm`, una columna.
- Catálogo: el listado de productos aparece en la primera pantalla, con el buscador; el titular y los beneficios van arriba en poco espacio (A-06). Rejilla de `ProductCard` de `minmax(180px, 1fr)`, dos columnas a 390 px.
- Detalle: foto 1:1 a la izquierda (360 a 480 px), nombre, `price-lg`, y `BranchAvailability` debajo.
- Carrito, confirmar pedido y pago: lista o formulario a la izquierda, `OrderSummary` a la derecha con la acción principal.

## Estados e interacción

- Foco visible en todo control: `focus` 2 px sólido con 2 px de separación.
- Hover: `primary` pasa a `orange-700`; `secondary` a `surface-muted`.
- Cargando: `Skeleton` con la estructura de la página; en botones, `loading` (spinner y texto "Agregando…", "Validando…").
- La confirmación aparece junto a la acción que la provocó (tarjeta, fila de sucursal), nunca arriba de la página.
- Sin animación decorativa; el spinner se ralentiza con `prefers-reduced-motion`.

## Iconografía

Íconos de línea de 24 × 24, trazo 1,7, puntas redondeadas y `currentColor`, el estilo del ícono de carrito de `ShopHeader`. Se usan con `Icon`. Solo el carrito viene del código original; el resto se dibujó en el mismo estilo para este sistema.

- Todo ícono va con su etiqueta de texto visible (UT-02); el ícono solo es apoyo.
- Sin íconos de categoría que repiten el mismo dibujo, sin corazón de lista de deseos, sin emoji.

## Marca

No hay archivo de logotipo: la marca es el sello "CY" (blanco sobre `orange-500`, radio `radius-sm`, 34 px) seguido de "ComproYa" en Geist 800 a 19 px, tal como lo pinta el código. Se usa dentro de `ShopHeader` y siempre enlaza al catálogo.

## Componentes por pantalla

| Pantalla | Título | Acción principal | Componentes |
|---|---|---|---|
| Catálogo `/` | Productos | Agregar al carrito | ShopHeader, ProductCard, Skeleton, Notice |
| Detalle `/producto/[id]` | {nombre del producto} | Retirar aquí | ProductImage, BranchAvailability, Notice |
| Carrito `/carrito` | Tu carrito | Confirmar pedido | CheckoutSteps (1), LineItem, OrderSummary |
| Confirmar pedido | Confirmar pedido | Confirmar pedido | CheckoutSteps (2), Field (sucursal), CouponField, LineItem, OrderSummary |
| Pago `/pago/[id]` | Pagar pedido #N | Pagar con tarjeta / Continuar con el pago con débito bancario | CheckoutSteps (3), Tabs, Notice (progress, warn) |
| Comprobante | Comprobante de tu pedido | Ver mis pedidos | CheckoutSteps (4), PickupCode, OrderSummary |
| Mis pedidos `/pedidos` | Mis pedidos | según el estado | OrderRow, OrderStatus |
| Registro e ingreso | Crea tu cuenta / Ingresar a ComproYa | Crear cuenta / Iniciar sesión | Field, Checkbox, Notice |

Todas llevan `ShopHeader` arriba y `AcademicFooter` abajo.

## Adiciones intencionales

El código actual no tiene estos componentes; se agregan porque la auditoría los exige: `CheckoutSteps` (A-05), `BranchAvailability` con motivo (A-13, A-16), `CouponField` con un solo mensaje (A-08), `Skeleton` y `Spinner` (A-07), `OrderRow` con siguiente acción y cancelación (A-11, A-19), `OrderStatus` (A-17) e `Icon` (A-04). Fuera de alcance y sin componente: reseñas, lista de deseos, recomendaciones, devoluciones y la aplicación de sala.
