Vas a implementar el rediseño del frontend de ComproYa en Línea (Next.js en `frontend/`, TypeScript). El diseño está aprobado; tu trabajo es llevarlo a código sin cambiar la lógica de negocio.

## Lee primero, en este orden

1. `design/rediseno/README.md`: pantallas, rutas, estados, reglas y pendientes.
2. `design/design-system/README.md`: principios, vocabulario, color, tipografía, movimiento, accesibilidad.
3. `design/design-system/components/index.d.ts` y el `README.md` de cada componente en `design/design-system/components/<X>/`.
4. `design/design-system/components/bundle.js` y `bundle.css`: implementación de referencia de cada componente (comportamiento, clases, estados, tooltips). Es la fuente de verdad visual.
5. `design/rediseno/pantallas/*.dc.html` y `screens.css`: cada pantalla con su markup, textos definitivos y estados. Las imágenes `/_blob/<id>` se resuelven con `design/rediseno/assets-map.json`.
6. `design/04-requisitos-usabilidad.md` y `design/07-contenido.md`, y `frontend/src/lib/categorias.ts` para nombres, descripciones y fotos de categoría.

Antes de escribir código, revisa cómo están hoy las rutas, `globals.css`, los componentes de `frontend/src/components/` y el cliente de API, y dime en una lista corta qué ruta actual corresponde a cada pantalla del diseño y qué datos de la API alimentan cada una. Si algo del diseño necesita un dato que la API no da, avísame en vez de inventarlo.

## Reglas

- No cambies la lógica de negocio ni el backend. Totales, descuentos, unidades disponibles y estados se muestran tal como los devuelve el servidor, sin recalcular. Los datos de ejemplo de los `.dc.html` (productos, precios, pedidos, dirección) no se copian al código.
- Vocabulario y textos: los de los `.dc.html`. Nunca «checkout», «stock», «cross-sell», «PSE» ni términos internos (RN-nn, ERP, homologado, IDs).
- Precios con un `formatCOP` compartido: `$ 1.899.900`, sin decimales.
- Todo ícono con texto visible; todo control de solo ícono con `aria-label` y tooltip con verbo; todo botón deshabilitado con su motivo visible.
- Accesibilidad: contraste 4,5:1, foco visible con `--focus`, objetivos táctiles de 44 px, `label` asociado a cada campo, errores con `aria-describedby`, `prefers-reduced-motion` respetado. Nada de desplazamiento horizontal a 390 px.
- Sin dependencias nuevas de UI salvo que las justifiques antes. Íconos: los SVG de línea del sistema (copia los trazos de `PATHS` en `bundle.js` a un componente `Icon`), no una librería externa.
- Fuera de alcance: reseñas, lista de deseos, recomendaciones automáticas, devoluciones, facturación, mapa de envío, retiro en sucursal.

## Plan por fases (detente y muéstrame el resultado al final de cada una)

**Fase 1 — Fundaciones.**
- Lleva `design/design-system/tokens.css` a `frontend/src/app/globals.css` (variables en `:root`, Geist 400–800). Mantén temporalmente alias de las variables viejas (`--orange`, `--navy`, …) apuntando a las nuevas para no romper pantallas no migradas.
- Copia los logos de `design/design-system/assets/Logos/` a `frontend/public/marca/` y usa `logo-app.svg` como favicon.

**Fase 2 — Componentes.** Crea `frontend/src/components/ui/` con un componente TSX por cada componente del sistema, con las props de `index.d.ts` y los estilos de `bundle.css` (CSS Modules o un `ui.css` global con las mismas clases `cy-*`; elige uno y sé consistente). Orden: `Icon`, `Tooltip`, `Button`, `IconButton`, `InfoTip`, `Notice`, `Badge`, `OrderStatus`, `Spinner`, `Skeleton`, `EmptyState`, `Field`, `Checkbox`, `QuantityStepper`, `CouponField`, `ShopHeader`, `CheckoutSteps`, `Breadcrumbs`, `AcademicFooter`, `ProductImage`, `ProductCard`, `AddedToCart`, `CategoryCard`, `CategoryCarousel`, `LineItem`, `OrderSummary`, `ShippingSummary`, `OrderRow`, `Card`. Reemplaza `ShopHeader.tsx` y `ProductImage.tsx` actuales. Agrega una ruta interna `/dev/componentes` (no enlazada) que muestre cada componente en sus estados, como `design/rediseno/pantallas/Componentes.dc.html`.

**Fase 3 — Pantallas del flujo**, una por una y en este orden: Catálogo, Categoría, Detalle, Carrito, Datos y envío, Pago, Pedido confirmado, Mis pedidos, Ingresar y Crear cuenta. Para cada una implementa **todos** sus estados (ver tabla del README) con datos reales: cargando con `Skeleton`, vacío con `EmptyState`, error con `Notice` + acción, y los específicos (agregado, agotado, cupón válido/inválido, sin sesión, pago no completado, confirmando, la confirmación tarda). La misma cabecera en todas (`compact` desde Datos y envío) y `CheckoutSteps` con «Volver» en los cuatro pasos. Iniciar sesión y crear cuenta deben devolver a la pantalla de origen con el carrito intacto.

**Fase 4 — Verificación.**
- Actualiza `e2e/capturas/capturar-estado-actual.mjs` (o crea uno nuevo) para capturar cada pantalla y estado a 1440 y 390 px en `design/verificacion-rediseno/`, y comprueba en cada captura que `document.documentElement.scrollWidth` no supere el ancho de la ventana.
- Recorre con teclado el flujo completo (Tab, Enter, Esc en tooltips) y confirma foco visible en todo control.
- Corre `npm run build` y `npm run lint` del frontend sin errores.
- Entrégame una tabla: pantalla × estado × captura 1440 × captura 390 × OK/pendiente, y la lista de lo que no pudiste implementar o necesita decisión del backend (ver «Pendientes» del README).
