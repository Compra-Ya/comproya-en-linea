# 08 — Prompt para el diseñador (IA o persona)

Para pegar tal cual en la herramienta que genera las pantallas. Adjuntar con él: `design/01-brief.md`, `design/04-requisitos-usabilidad.md`, `design/05-auditoria-ui.md`, `design/design-system/` y el tablero del logo.

```
Eres diseñador/a de producto senior especializado/a en e-commerce y usabilidad. Rediseña las pantallas de
"ComproYa en Línea", la tienda web de una cadena de retail en Colombia. Hoy el sitio se ve feo, plano y mal
organizado: no da ganas de comprar. Quiero un e-commerce con vida, ordenado, claro y que se sienta como una
tienda real, no como un formulario. Tú decides la composición, el ritmo visual y los detalles; las
restricciones están al final.

QUÉ ES EL PRODUCTO
Canal de comercio electrónico B2C de Tiendas ComproYa (electrodomésticos y retail: línea blanca, televisores,
tecnología, hogar, cocina, moda, deportes, alimentos). El Cliente digital busca un producto, ve cuántas unidades
hay en cada sucursal, lo paga en línea (tarjeta en la pasarela, o pago con débito bancario) y lo retira en la
sucursal que eligió mostrando su código de retiro. No hay envíos ni asesor en tienda: la compra se entiende
sola. Es un proyecto académico de Ingeniería de Software II (Universidad Central), pero debe verse como una marca real.

QUIÉN LO USA Y CÓMO SE EVALÚA
Personas comunes, de cualquier edad, en celular (390 px) y computador (1440 px). El profesor de usabilidad aplica
12 casos de prueba (ISO/IEC 9126-2, sección 8.3) con un usuario real: propósito de cada pantalla, comprensión de
íconos y textos, tarea simple, mensajes de error, uso sin documentación, navegación entre 3 módulos, estado del
sistema, tiempo de la función básica, errores al aprender, necesidad de ayuda, retención al día 2 y tiempo de una
función avanzada (aplicar un cupón). Diseña para pasarlos.

QUÉ QUIERO QUE SIENTA EL USUARIO
Cercanía, confianza y ganas de seguir explorando. Más imágenes y menos cajas grises; jerarquía clara; mucho aire
pero sin pantallas vacías; color con intención (el naranja guía la acción, el azul marino da confianza); tarjetas
de producto que inviten a pulsar; pequeños detalles de vida (hover, transiciones suaves de 150 a 200 ms, estados de
carga con esqueletos, confirmaciones amables, estados vacíos con ilustración sencilla o foto). Nada de
animaciones decorativas largas; respetar "reducir movimiento".

ICONOGRAFÍA Y AYUDAS (lo que más pesa en la evaluación)
- Todo ícono lleva etiqueta de texto visible. El ícono solo es apoyo, nunca la única pista.
- Si un control es solo ícono (flechas del carrusel, quitar, cantidad +/−, cerrar), debe tener tooltip (al pasar el
  mouse y al enfocar con teclado) con un verbo claro: "Quitar del carrito", "Aumentar cantidad", "Ver más categorías".
- Un solo estilo de íconos de línea (trazo 1,7, puntas redondeadas, 24 px), coherente con el ícono de carrito del
  sistema de diseño. Propón y dibuja los que falten: agregar al carrito (carrito con "+"), quitar, sucursal/tienda,
  cupón, tarjeta, banco, reloj (vencimiento), recibo, ubicación, información, alerta, éxito.
- El botón "Agregar al carrito" lleva el ícono de carrito con "+" y tooltip "Agregar {producto} al carrito"; al
  pulsarlo muestra cargando, luego "Agregado" con enlace "Ver carrito", junto al botón (no arriba de la página).
- Tooltips breves de ayuda en los conceptos que el usuario puede ignorar: "unidades disponibles", "código de
  retiro", "pago con débito bancario", "cupón de lealtad" (un signo de interrogación o "i" con texto de una línea).
- Estados deshabilitados siempre con el motivo al lado ("No ofrece retiro por ahora: sin información actualizada").

PANTALLAS A DISEÑAR (cada una a 1440 px y 390 px, con sus estados: cargando, vacío, error y éxito)
1. Catálogo y búsqueda: titular corto, buscador siempre visible, CARRUSEL INFINITO DE CATEGORÍAS en una sola fila
   (foto redonda + nombre, se detiene al pasar el mouse, flechas con tooltip, desliza con el dedo en celular), y los
   productos desde la primera pantalla. Filtros o chips de orden si aportan. Beneficios y banner de lealtad después
   de los productos, sin protagonismo.
2. Página de categoría (una por categoría: Muebles, Celulares, Portátiles, Alimentos y bebidas, etc.): portada con
   foto, nombre, descripción corta y cantidad de productos; migas de pan (Catálogo > Categoría); el mismo carrusel
   para saltar a otra categoría; rejilla de productos con "Ver más". Cada categoría puede tener su propio acento
   visual dentro de la paleta.
3. Detalle de producto: foto grande 1:1 (con zoom o galería si hay más de una), nombre, precio grande, disponibilidad
   por sucursal en lista legible (nombre de la sucursal y ciudad, unidades disponibles, estado de retiro con motivo, botón
   "Retirar aquí"), y la regla de los 15 minutos explicada en una línea.
4. Carrito (invitado y registrado): filas con foto, nombre, cantidad con stepper y tooltips, quitar, total por línea;
   resumen fijo al lado (debajo en celular) con el total que devuelve el servidor; productos complementarios (hasta 4)
   sin protagonismo.
5. Confirmar pedido: indicador de 4 pasos (Carrito, Confirmar pedido, Pago, Comprobante) con "Volver"; sucursal de
   retiro; cupón de lealtad (la función avanzada: validación clara, un solo mensaje, descuento visible); aviso de que
   las unidades quedan reservadas.
6. Pago: pestañas "Pago con tarjeta" y "Pago con débito bancario"; aclarar que la tarjeta se ingresa en la pasarela y
   que ComproYa nunca la ve; estado "Esperando la confirmación de tu banco" con la hora límite (30 minutos) y que la
   pantalla se actualiza sola; error y reintento claros.
7. Comprobante: confirmación con alegría contenida, CÓDIGO DE RETIRO muy visible (grande, copiar con un clic, "de un
   solo uso, vence a los 5 días calendario"), sucursal y resumen; salidas "Seguir comprando" y "Ver mis pedidos".
8. Mis pedidos: tarjeta por pedido con estado, fecha, sucursal, total y la siguiente acción; "Cancelar pedido" visible
   solo mientras no haya empezado el alistamiento, y el motivo cuando ya no se puede.
9. Registro e inicio de sesión (solo como paso previo): cortos, con ayuda en cada campo y errores por campo.
Además: cabecera con logo, buscador, cuenta y carrito (versión reducida en confirmar, pago y comprobante), navegación
Catálogo, Carrito, Mis pedidos, Mi cuenta, y pie con el aviso académico.

REGLAS QUE LA INTERFAZ DEBE HACER VISIBLES
Sucursal sin sincronizar hace más de 15 minutos no ofrece retiro; el código de retiro es de un solo uso y vence a los
5 días calendario; un pedido solo se cancela antes del alistamiento; un cupón se redime una vez por pedido; el canal
nunca captura datos de tarjeta.

RESTRICCIONES (no negociables)
- Actor: Cliente digital. No existe asesor en tienda.
- No inventes funciones fuera de alcance: recomendaciones automáticas, reseñas o estrellas, lista de deseos,
  devoluciones, facturación, logística propia, campañas, catálogo de terceros. Los productos complementarios (hasta 4)
  pueden aparecer, sin protagonismo.
- Vocabulario en español de Colombia, de tú: "confirmar pedido", "pago con débito bancario", "unidades disponibles",
  "código de retiro", "producto complementario". Nunca "checkout", "PSE", "stock" ni "cross-sell". Sin términos
  internos (RN-04, ERP, "homologado", identificadores de sucursal). Cifras exactas en lugar de adjetivos; ninguna
  cifra escrita a mano que deba venir de los datos.
- No cambies la lógica de negocio: muestra lo que devuelve el servidor (totales, descuentos, unidades), sin recalcular.
- Accesibilidad: contraste mínimo 4,5:1 en texto, foco visible en todo control, objetivos táctiles de 44 px, nada
  que dependa solo del color, sin desplazamiento horizontal a 390 px.
- Marca: usa el logo del tablero adjunto (símbolo con flecha de retiro y carrito, naranja y azul marino). Paleta base:
  naranja #B9480D (acción), azul marino #163D6D, texto #171717; el naranja de marca #F2661D solo en bloques de
  identidad, nunca con texto blanco. Tipografía Geist (400 a 800).
- Contenido real disponible: 2115 productos con foto (formatos 1:1, algunos horizontales y verticales), 25 categorías
  con foto y descripción. Detalle en design/07-contenido.md.

ENTREGABLES
Para cada pantalla: versión de escritorio y de celular en sus estados (cargando, vacío, error, éxito); un tablero de
componentes (botones con ícono y tooltip, tarjeta de producto, tarjeta de categoría, carrusel, avisos, campos,
stepper, insignias de estado) y un tablero de íconos con su nombre y su tooltip. Explica en una frase por pantalla
qué decisión de diseño resuelve qué caso de prueba de usabilidad (UT-01 a UT-12).
```
