# 08 — Prompt para el diseñador (IA o persona): venta digital con envío

Para pegar tal cual en la herramienta que genera las pantallas. Adjuntar con él: `design/design-system/`, el tablero del logo y las capturas actuales de `design/verificacion-rediseno/` (para ver qué hay hoy y mejorarlo).

> Nota: este prompt cubre el flujo de la **prueba de usabilidad** (venta digital con envío, sin retiro en sucursal; ver `docs/modo-venta-digital.md`). Los documentos `01` a `07` describen el flujo con retiro en sucursal del canon.

```
Eres diseñador/a de producto senior especializado/a en e-commerce y usabilidad. Rediseña las pantallas de
"ComproYa en Línea", una tienda web colombiana de electrodomésticos y retail. Hoy el sitio se ve feo, plano y mal
organizado: no da ganas de comprar. Quiero un e-commerce con vida, ordenado y claro, que se sienta como una tienda
real. Tú decides la composición, el ritmo visual y los detalles; las restricciones están al final.

EL FLUJO QUE SE EVALÚA (venta digital con envío)
El cliente entra a la tienda, explora por categorías o busca, abre un producto, elige la cantidad y lo agrega a su
carrito; revisa el carrito y ajusta cantidades; escribe sus datos y su dirección de envío; paga con tarjeta en la
pasarela de Stripe (modo de prueba, en una página externa); y vuelve a ver "Pedido confirmado". No hay retiro en
sucursal, ni elección de sucursal, ni asesor: todo se entiende solo.

CÓMO SE EVALÚA
El profesor de usabilidad aplica 12 casos de prueba (ISO/IEC 9126-2, sección 8.3) con una persona real, en celular
(390 px) y en computador (1440 px): propósito de cada pantalla, comprensión de íconos y textos, una tarea simple,
mensajes de error, uso sin documentación, navegación entre 3 módulos, estado del sistema, tiempo de la función
básica (comprar un producto), errores al aprender, necesidad de ayuda, retención al día 2 y una función avanzada
(aplicar un cupón). El profesor mira mucho los tooltips y la iconografía. Diseña para pasarlos.

QUÉ QUIERO QUE SIENTA LA PERSONA
Cercanía, confianza y ganas de seguir explorando. Fotos grandes de producto; jerarquía clara; aire sin pantallas
vacías; el naranja guía la acción y el azul marino da confianza; tarjetas que inviten a pulsar; pequeños detalles de
vida (hover, transiciones de 150 a 200 ms, esqueletos de carga, confirmaciones amables, estados vacíos con foto o
ilustración sencilla). Sin animaciones decorativas largas; respetar "reducir movimiento".

ICONOGRAFÍA Y AYUDAS (lo que más pesa)
- Todo ícono lleva etiqueta de texto visible; el ícono solo es apoyo.
- Todo control que sea solo ícono (flechas del carrusel, cantidad + y −, quitar, cerrar) tiene tooltip al pasar el
  mouse y al enfocar con teclado, con un verbo claro: "Quitar del carrito", "Aumentar cantidad", "Ver más categorías".
- Un solo estilo de íconos de línea (trazo 1,7, puntas redondeadas, 24 px), coherente con el del sistema de diseño.
  Dibuja los que falten: agregar al carrito (carrito con "+"), quitar, envío/paquete, tarjeta, cupón, reloj, recibo,
  ubicación, información, alerta, éxito.
- "Agregar al carrito" lleva ícono de carrito con "+" y tooltip "Agregar {producto} al carrito"; al pulsarlo muestra
  cargando y luego "Agregamos 2 unidades a tu carrito" con "Ver carrito" y "Seguir comprando", junto al botón.
- Tooltips de una línea en los conceptos dudosos: "unidades disponibles", "cupón de lealtad", "pasarela de pagos".
- Un botón deshabilitado siempre dice por qué ("Producto agotado: por ahora no hay unidades").

PANTALLAS (cada una a 1440 px y 390 px, con sus estados: cargando, vacío, error y éxito)
1. Catálogo y búsqueda: titular corto y los tres pasos (Elige, Paga en línea, Recíbelo en casa); buscador siempre
   visible; carrusel infinito de categorías en una sola fila (foto redonda y nombre; se detiene al pasar el mouse;
   flechas con tooltip; se desliza con el dedo); productos desde la primera pantalla; "Ver más productos"; beneficios
   y banner de lealtad después, sin protagonismo.
2. Página de categoría (una por categoría): portada con foto, nombre, descripción y cantidad de productos; migas de
   pan; el mismo carrusel; rejilla de productos.
3. Detalle de producto: foto grande 1:1; categoría; nombre; precio grande en pesos colombianos ("$ 179.000", sin
   decimales); "Hay 285 unidades disponibles" (o "Producto agotado"); selector de cantidad con máximo por pedido;
   botón "Agregar al carrito"; garantías de una línea (pago con tarjeta en la pasarela segura, envío a la dirección
   que escribas); migas de pan.
4. Carrito (invitado o con sesión): una fila por producto con foto, nombre, precio unitario, cantidad (stepper con
   tooltips), total de la línea y "Quitar"; resumen al lado (debajo en celular) con productos, subtotal y total;
   productos complementarios (hasta 4) sin protagonismo; botón "Continuar con tus datos de envío". Estados: vacío con
   "Ver productos", cargando, error con "Reintentar".
5. Datos y envío (paso 2 de 4): campos nombre completo, teléfono, dirección, ciudad e indicaciones (opcional), con
   ayuda en línea y error por campo (qué pasó y cómo corregirlo, sin borrar lo escrito); cupón de lealtad opcional
   (la función avanzada: "Aplicar" con un solo mensaje claro, válido o inválido, y el descuento visible); resumen
   del pedido; aviso de que las unidades se reservan mientras paga; botón "Continuar al pago". Si no hay sesión:
   aviso con "Iniciar sesión" y "Crear cuenta" que conserva el carrito y regresa a este paso.
6. Pago (paso 3 de 4): resumen del pedido y dirección de envío; explicación de que la tarjeta se escribe en la página
   segura de la pasarela y que ComproYa nunca la ve; aviso de modo de prueba con la tarjeta 4242 4242 4242 4242;
   botón "Pagar con tarjeta"; estado "No se completó tu pago" con opción de reintentar si la persona vuelve de la
   pasarela sin pagar.
7. Pedido confirmado (paso 4 de 4): confirmación con alegría contenida, número de pedido, productos, total pagado
   (el que devuelve el servidor), dirección de envío y teléfono; salidas "Ver mis pedidos" y "Seguir comprando".
   Mientras se confirma el pago: "Estamos confirmando tu pago…" con progreso; si tarda: "Todavía no recibimos la
   confirmación de tu pago" con "Revisar de nuevo" y "Ver mis pedidos".
8. Mis pedidos: tarjeta por pedido con número, estado en palabras, cantidad de productos, total, ciudad de envío y la
   siguiente acción ("Pagar", "Ver pedido confirmado"); explicación del estado cuando hay fallo o cancelación.
9. Registro e inicio de sesión (solo como paso previo): cortos, con ayuda en cada campo y errores por campo; el
   inicio de sesión devuelve a donde la persona estaba.
Además: cabecera con logo, buscador, cuenta y carrito (versión reducida del paso 2 en adelante), navegación
Catálogo, Carrito, Mis pedidos, Mi cuenta, indicador de 4 pasos (Carrito, Datos y envío, Pago, Pedido confirmado)
con "Volver", y pie con el aviso académico.

RESTRICCIONES (no negociables)
- Actor: Cliente digital. No existe asesor, ni retiro en sucursal, ni código de retiro en este flujo.
- No inventes funciones fuera de alcance: recomendaciones automáticas, reseñas o estrellas, lista de deseos,
  devoluciones, facturación, logística propia, campañas, catálogo de terceros, seguimiento del envío en mapa. Los
  productos complementarios (hasta 4) pueden aparecer, sin protagonismo.
- Idioma: español de Colombia, de tú. Vocabulario: "pedido confirmado", "unidades disponibles", "pago con tarjeta",
  "cupón de lealtad", "producto complementario". Nunca "checkout", "stock", "cross-sell". Sin términos internos
  (RN-04, ERP, "homologado", identificadores de sucursal). Cifras exactas, ninguna escrita a mano si debe venir de los datos.
- Precios en pesos colombianos (COP) sin decimales, con punto de miles: "$ 1.899.900".
- No cambies la lógica de negocio: muestra lo que devuelve el servidor (totales, descuentos, unidades), sin recalcular.
- Reglas visibles: el cupón se usa una vez por pedido; la tarjeta nunca se captura en ComproYa; un pedido solo se
  cancela antes de empezar el alistamiento.
- Accesibilidad: contraste de texto 4,5:1 o más, foco visible en todo control, objetivos táctiles de 44 px, nada que
  dependa solo del color, sin desplazamiento horizontal a 390 px.
- Marca: logo del tablero adjunto (símbolo con flecha y carrito, naranja y azul marino). Paleta base: naranja #B9480D
  (acción), azul marino #163D6D, texto #171717; el naranja de marca #F2661D solo en bloques de identidad, nunca con
  texto blanco. Tipografía Geist (400 a 800).
- Contenido real: 2115 productos con foto, 25 categorías con foto y descripción; fotos 1:1, algunas horizontales y
  verticales; nombres en español; precios en COP. Detalle en design/07-contenido.md.

ENTREGABLES
Por pantalla: escritorio y celular en sus estados; un tablero de componentes (botones con ícono y tooltip, tarjeta de
producto, tarjeta de categoría, carrusel, stepper, avisos, campos con error, indicador de pasos, insignias de
estado); un tablero de íconos con nombre y tooltip; y una frase por pantalla que diga qué caso de usabilidad
(UT-01 a UT-12) resuelve cada decisión.
```
