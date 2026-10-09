Sistema de diseño de **ComproYa en Línea**, la tienda web de electrodomésticos y retail. El Cliente digital explora o busca, agrega productos al carrito, escribe sus datos y su dirección de envío, paga con tarjeta en la pasarela de Stripe y ve "Pedido confirmado", sin ayuda de nadie. Cada regla existe para que esa compra se entienda a la primera (casos de usabilidad UT-01 a UT-12, a 390 y 1440 px) y para que la tienda se sienta cercana, confiable y con ganas de seguir explorando.

## Principios

1. **Cada pantalla dice qué se hace ahí.** Un título `title` con el nombre de la tarea y una sola acción `primary`.
2. **Siempre sabes dónde estás y cómo salir.** `ShopHeader` en todas las pantallas (`compact` del paso 2 en adelante), `Breadcrumbs` en categoría y detalle, `CheckoutSteps` con "Volver" en los cuatro pasos.
3. **Todo ícono lleva palabra; todo control de solo ícono lleva tooltip.** El ícono apoya, el texto explica, el tooltip precisa ("Quitar del carrito", "Ver más categorías").
4. **El estado del sistema siempre está a la vista.** `Skeleton` al cargar, "Agregando…" en el botón, `Notice` `progress` al confirmar el pago, reserva de unidades mientras pagas.
5. **Todo error dice qué pasó, cómo corregirlo y ofrece el botón.** Junto a lo que lo causó y sin borrar lo escrito.
6. **Las reglas se explican donde se aplican.** Cupón de un solo uso en `CouponField`, tarjeta en la pasarela en Pago, cancelación antes del alistamiento en `OrderRow`.
7. **La interfaz muestra lo que devuelve el servidor.** Totales, descuentos y unidades disponibles no se recalculan ni se escriben a mano.

## Contenido y voz

- Español de Colombia, de tú, frases cortas y cálidas: "Agregamos 2 unidades a tu carrito", "Estamos confirmando tu pago…".
- Mayúscula solo al inicio y en nombres propios.
- Vocabulario fijo en botones, títulos y pasos:

| Usar | Nunca |
|---|---|
| pedido confirmado | checkout, comprobante |
| unidades disponibles | stock, existencias publicadas |
| pago con tarjeta, pasarela de pagos | token, Stripe Checkout como nombre de pantalla |
| cupón de lealtad | código promocional |
| producto complementario | cross-sell, recomendado para ti |
| Datos y envío | dirección de facturación |

- Sin términos internos (RN-04, ERP, homologado, SKU, identificadores de sucursal o de producto).
- Precios en pesos colombianos sin decimales y con punto de miles: `$ 1.899.900`. Usa `formatCOP`.
- Cifras exactas y que vengan de los datos; nada de "rápido", "24/7" ni cantidades escritas a mano.
- Sin emoji.

> Agregamos 2 unidades a tu carrito. **[Ver carrito]** **[Seguir comprando]**

> Faltan dígitos: escribe los 10 números de tu celular.

> Escribirás tu tarjeta en la página segura de la pasarela de pagos. ComproYa nunca ve ni guarda los datos de tu tarjeta.

## Color

El naranja guía la acción y el azul marino da confianza.

- `orange-600` (#B9480D) es el color de acción: `Button` primary, enlaces, navegación activa, precios destacados del carrito. Una acción principal por pantalla.
- `orange-500` (#F2661D) es el naranja del símbolo del logo: solo en el logo y en bloques de identidad; nunca con texto blanco encima.
- `navy-700` (#163D6D) para la barra superior, el pie, los tooltips, el paso completado y el anillo de foco (`focus`). Domina en Pago: es la pantalla donde más pesa la confianza.
- `ink` para todo texto; `ink-soft` es lo más tenue permitido.
- Fondo `surface-muted`; tarjetas y cabecera `surface`. Divisores `line`; bordes de control `line-strong` (3:1).
- Estados: texto en `ok-ink`, `danger-ink`, `warn-ink` sobre su `-soft`. Todo estado lleva palabra o ícono, nunca solo color.
- Deshabilitado: `surface-disabled` con texto `ink-soft` y siempre con el motivo al lado.

## Tipografía

Geist (Google Fonts, 400 a 800). El logo usa su propia letra; no la imites en la interfaz.

- `display` (36/42, 800) en el titular del catálogo y la portada de categoría; `title` (24/30) en el título de cada pantalla.
- `heading` (18/24) para secciones; `subheading` (15/20) dentro de tarjetas.
- `body` (14/20) para todo texto; `small` (13/18) para ayudas y reglas de una línea; `label` (12/16) es el mínimo.
- Precios: 20 px 800 en tarjeta, `price-lg` (28/34) en el detalle, `order-number` para el número de pedido.

## Espaciado, forma y movimiento

- Escala de 4 px (`space-1` a `space-10`). Margen lateral `space-6` en escritorio y `space-4` a 390 px. Contenido a `container` (1280 px).
- Radios: `radius-md` en controles, `radius-lg` en tarjetas, `radius-xl` en portadas y bandas, `radius-pill` en buscador, insignias y categorías.
- Objetivo táctil mínimo 44 × 44 px (`control-md`); la acción que avanza un paso, 48 px (`control-lg`).
- En reposo se separa con bordes; al pasar el mouse, la tarjeta sube 2 px y gana `shadow-md`.
- Transiciones de 150 a 200 ms con salida suave en hover, foco, tooltip, confirmaciones y avisos. Sin animaciones decorativas largas. Con "reducir movimiento" no hay desplazamientos ni carrusel automático.
- Foco visible en todo control: 2 px `focus` con 2 px de separación (blanco sobre el pie azul).

## Diseño y adaptación

- Todo funciona a 390 px **sin desplazamiento horizontal**. Rejillas con `minmax`, nunca columnas fijas.
- Catálogo: titular corto con los tres pasos (Elige, Paga en línea, Recíbelo en casa), carrusel de categorías y productos desde la primera pantalla; beneficios y lealtad después.
- Detalle: foto 1:1 grande a la izquierda, compra a la derecha; en celular se apilan.
- Carrito, Datos y envío, Pago: contenido a la izquierda y `OrderSummary` a la derecha; en celular el resumen va debajo.

## Ayudas: íconos, tooltips e InfoTip

- `Icon`: línea 24 × 24, trazo 1,7, puntas redondeadas, `currentColor`. El tablero de `Icon` muestra cada nombre con su texto.
- `IconButton` para controles de solo ícono (flechas, cantidad, pausar, cerrar): 44 px, `aria-label` y tooltip con verbo.
- `Tooltip`: azul marino, una línea, aparece a los 250 ms con el mouse y de inmediato con el teclado; Esc lo cierra.
- `InfoTip` ("?") solo en los términos dudosos: unidades disponibles, cupón de lealtad, pasarela de pagos.

## Marca

El logo (símbolo con flecha y carrito, palabra "ComproYa" en azul marino con "Ya" en naranja) está en el grupo **Logos**: horizontal para fondo claro, horizontal en blanco para el pie azul, símbolo solo y versión de app/favicon. Se vectorizó desde el tablero de marca; si existe el archivo vectorial original, reemplázalo. En la interfaz va en `ShopHeader` (40 px de alto, 32 px a 390 px) y en `AcademicFooter`, siempre enlazado al catálogo. No lo redibujes, no cambies sus colores ni lo pongas sobre fotos.

## Componentes por pantalla

| Pantalla | Título | Acción principal | Componentes |
|---|---|---|---|
| Catálogo | (titular) | Agregar al carrito | ShopHeader, CategoryCarousel, ProductCard, Skeleton, EmptyState |
| Categoría | {categoría} | Agregar al carrito | Breadcrumbs, CategoryCarousel, ProductCard |
| Detalle | {producto} | Agregar al carrito | Breadcrumbs, ProductImage, QuantityStepper, AddedToCart, InfoTip |
| Carrito | Tu carrito | Continuar con tus datos de envío | CheckoutSteps 1, LineItem, OrderSummary, EmptyState |
| Datos y envío | Datos y envío | Continuar al pago | CheckoutSteps 2, Field, CouponField, OrderSummary, Notice |
| Pago | Pagar pedido #N | Pagar con tarjeta | CheckoutSteps 3, ShippingSummary, OrderSummary, Notice (info, test) |
| Pedido confirmado | ¡Pedido confirmado! | Ver mis pedidos | CheckoutSteps 4, LineItem, ShippingSummary, Notice (progress) |
| Mis pedidos | Mis pedidos | según el estado | OrderRow, OrderStatus, EmptyState |
| Ingreso y registro | Ingresar / Crear cuenta | Iniciar sesión / Crear cuenta | Field, Checkbox, Notice |

## Fuera de alcance (sin componente)

Reseñas o estrellas, lista de deseos, recomendaciones automáticas, devoluciones, facturación, seguimiento del envío en mapa, retiro en sucursal, asesor.
