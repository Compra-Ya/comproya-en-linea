# 04 — Requisitos de usabilidad (ISO/IEC 9126-2, sección 8.3)

Doce casos de prueba, aplicados con un usuario real sobre el portal desplegado, en el Caso de Uso 2 "Compra completa en el canal digital". Los identificadores `UT-01` a `UT-12` son de este documento (no vienen del canon); sirven para referirse a cada caso desde el diseño.

Referencias de pantalla: ver [03-flujo-cu2.md](03-flujo-cu2.md) y [05-auditoria-ui.md](05-auditoria-ui.md) (`A-nn`).

> **Actualización (venta digital con envío).** La prueba se aplica sobre el flujo sin retiro en sucursal (`docs/modo-venta-digital.md`). Donde este documento dice «Confirmar pedido» léase **Datos y envío**; donde dice «código de retiro» o «comprobante», léase **pedido confirmado con su número de pedido**. Los cuatro pasos visibles son Carrito, Datos y envío, Pago y Pedido confirmado. Los casos de prueba y sus metas no cambian. La implementación de cada pantalla y sus estados está en [rediseno/README.md](rediseno/README.md), y la evidencia (36 estados a 1440 y 390 px, recorrido con teclado) en [verificacion-rediseno/](verificacion-rediseno/).

## 1. Comprensibilidad

| ID | Caso de prueba | Pantalla o elemento que ejercita | Qué debe garantizar el diseño para pasarlo | Problemas actuales que lo bloquean |
|---|---|---|---|---|
| UT-01 | Propósito de la pantalla | Las 7 pantallas del flujo; en especial catálogo, confirmar pedido y pago | Cada pantalla tiene un título que dice qué se hace ahí ("Confirmar pedido", "Pagar pedido #N", "Comprobante de tu pedido") y una acción principal única y evidente. Meta: el usuario describe el propósito de cada pantalla sin ayuda en ≥ 80 % de las pantallas. | A-06, A-10, A-12 |
| UT-02 | Comprensión de íconos y textos | Cabecera de tienda, insignias del catálogo, íconos de categoría, carrito, estados del pedido | Todo ícono lleva etiqueta de texto visible (no solo `title` ni color). Quitar términos internos (RN-nn, ERP, "homologado", "correlación", "Sucursal #N"). Meta: el usuario interpreta correctamente ≥ 80 % de íconos y textos sin ayuda. | A-04, A-09, A-13, A-14 |
| UT-03 | Flujo de una tarea simple | Buscar un producto → agregarlo → confirmar → pagar → ver el código de retiro | Una ruta lineal con indicador de progreso en los cuatro pasos (Carrito, Confirmar pedido, Pago, Comprobante) y un "Volver" explícito en cada paso. El usuario completa la tarea sin retroceder por desorientación. | A-02, A-05, A-11 |
| UT-04 | Mensajes de error | Los 10 casos de [03-flujo-cu2.md](03-flujo-cu2.md), sección 2 | Todo mensaje de error: (a) dice qué pasó en lenguaje de cliente, (b) dice qué hacer ahora y (c) ofrece el botón o enlace que lo hace. Ningún mensaje técnico, ningún identificador interno. Un error no se queda detrás de una espera de 30 s. | A-01, A-03, A-07, A-08 |
| UT-05 | Uso sin documentación | Todo el flujo, sin manual ni ayuda de un tercero | El flujo se completa sin leer nada fuera de la pantalla. Las reglas se explican donde se aplican, en una línea (15 minutos de sincronización, 5 días de vigencia, cupón de un solo uso, cancelación antes del alistamiento). | A-05, A-09, A-12 |
| UT-06 | Navegación entre 3 módulos | Catálogo ↔ Carrito ↔ Mis pedidos (y cuenta) | La misma cabecera de tienda en **todas** las pantallas (incluidas confirmar, pago y comprobante, con una versión reducida si se desea), con Catálogo, Carrito, Mis pedidos, Cuenta, y una ruta clara de vuelta al inicio. Meta: el usuario pasa entre 3 módulos y vuelve al inicio sin error de navegación. | A-02, A-11 |
| UT-07 | Estado del sistema | Pago, espera del débito, reserva de unidades, comprobante | El estado del sistema siempre está visible: "Procesando el pago…", "Esperando la confirmación del débito bancario (vence a las HH:MM)", "Tus unidades están reservadas hasta HH:MM", "Pago confirmado". Indicador de carga en catálogo, carrito y comprobante. | A-03, A-07, A-12 |

## 2. Facilidad de aprendizaje

| ID | Caso de prueba | Pantalla o elemento que ejercita | Qué debe garantizar el diseño para pasarlo | Problemas actuales que lo bloquean |
|---|---|---|---|---|
| UT-08 | Tiempo para una función básica | Buscar un producto y agregarlo al carrito (función básica propuesta) | Campo de búsqueda siempre visible y botón "Agregar al carrito" en la tarjeta del producto y en el detalle. Confirmación visible y cercana al botón tras agregar. Meta de medición: el tiempo lo fija el equipo de pruebas antes de la sesión; el diseño debe eliminar pasos innecesarios (hoy el aviso de éxito aparece en la parte superior del listado, lejos del botón pulsado). | A-02, A-15 |
| UT-09 | Errores durante el aprendizaje | Formularios (registro, ingreso, cupón), selector de sucursal, cantidades | Prevenir antes que corregir: validación en el campo, ayudas en línea, sucursales sin retiro no seleccionables o marcadas, "Aplicar" cupón que valida de verdad. Los errores no borran lo ya escrito. | A-03, A-08, A-16 |
| UT-10 | Necesidad de asistencia | Cualquier punto del flujo | Cero pantallas sin salida: siempre hay una acción siguiente visible y un enlace de ayuda al estado del pedido ("Mis pedidos"). Meta: ninguna solicitud de ayuda a un tercero durante la tarea. | A-01, A-07 |
| UT-11 | Retención al día 2 | Repetición del flujo completo, sin ayuda, un día después | Consistencia: mismos nombres, mismas posiciones, mismos colores de acción en todas las pantallas. Los nombres de la interfaz son los que el usuario usó el primer día ("confirmar pedido", "código de retiro"). Mis pedidos muestra el estado de cada pedido y su siguiente acción. | A-09, A-13, A-17 |
| UT-12 | Tiempo para una función avanzada | **Aplicar un cupón de lealtad al confirmar el pedido** (propuesta, ver sección 3) | La función avanzada se descubre y se completa sin ayuda: campo de cupón visible, validación inmediata, descuento visible en el resumen y mensaje claro si es inválido. | A-08 |

## 3. Función avanzada propuesta: aplicar un cupón de lealtad

Se propone **la aplicación del cupón** y no el pago con débito bancario, por estas razones:

1. **Es repetible y determinista.** El cupón se valida contra el programa de lealtad simulado: el resultado es el mismo en cada sesión de prueba. El débito depende de una confirmación del banco simulado que hoy **no se completa desde la interfaz** (ver A-01) y, cuando funcione, de una espera de hasta 30 minutos.
2. **Mide aprendizaje, no azar.** El débito mezcla tiempo de espera del sistema con tiempo de aprendizaje del usuario; el cupón mide solo lo segundo.
3. **Cumple el criterio de "función avanzada".** No es necesaria para comprar (es opcional), exige entender una regla (se redime una vez por pedido) y tiene un camino de error real (cupón inválido).
4. **Está dentro del alcance del caso de uso** (confirmación del pedido incluye el cupón de lealtad) y hace visible la regla "un cupón se redime una vez por pedido".

Dato para el equipo de pruebas: el código de cupón de prueba que usa la base local es `LEALTAD10` (10 %). En el portal desplegado hay que confirmar con qué cupones cuenta la base antes de la sesión; el diseño no debe suponer ninguno.

Como función avanzada alterna, si el equipo de pruebas prefiere el débito: requiere antes corregir A-01 y fijar un tiempo de espera de prueba corto.

## 4. Matriz de garantías transversales

| Garantía | Casos que cubre | Dónde |
|---|---|---|
| Ícono siempre con etiqueta de texto | UT-02, UT-05, UT-11 | Cabecera, categorías, insignias, carrito |
| Estado del sistema siempre visible (procesando pago, esperando débito, reserva vigente) | UT-07, UT-10 | Confirmar, pago, comprobante, mis pedidos |
| Error = qué pasó + qué hacer + botón | UT-04, UT-09, UT-10 | Todas |
| Ruta de vuelta al inicio desde cualquier módulo | UT-03, UT-06, UT-10 | Todas |
| Mismo cromo y mismos nombres en todo el flujo | UT-06, UT-11 | Todas |
| Reglas de negocio explicadas donde se aplican | UT-05, UT-09 | Detalle, confirmar, comprobante, mis pedidos |
| Funciona en 390 px de ancho sin desplazamiento horizontal | UT-01 a UT-12 | Todas |
