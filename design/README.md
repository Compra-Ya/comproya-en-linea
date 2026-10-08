# Carpeta de handoff para el diseñador — ComproYa en Línea

Material para rediseñar el frontend del **Caso de Uso 2 "Compra completa en el canal digital"** antes de la evaluación de usabilidad (ISO/IEC 9126-2, sección 8.3, 12 casos de prueba, con un usuario real sobre el portal desplegado).

**Esta carpeta no contiene el rediseño.** Contiene el brief, el estado actual con capturas, los requisitos que el diseño debe cumplir y los textos y contenidos disponibles.

> **El flujo de la prueba de usabilidad cambió:** ahora es venta digital con envío (carrito, cantidad, datos y dirección, pago con tarjeta en la pasarela, pedido confirmado), sin retiro en sucursal. El prompt para el diseñador de ese flujo es `08-prompt-diseno.md`; la decisión y el código están en `docs/modo-venta-digital.md`. Los documentos `01` a `07` se escribieron sobre el flujo con retiro del canon: sus reglas de retiro, sucursal y código de retiro no aplican a este modo.

## Orden de lectura

| # | Archivo | Para qué sirve | Tiempo |
|---|---|---|---|
| 1 | [01-brief.md](01-brief.md) | Producto, usuario, objetivo, alcance y vocabulario. **Leer primero.** | 5 min |
| 2 | [04-requisitos-usabilidad.md](04-requisitos-usabilidad.md) | Los 12 casos de prueba y lo que el diseño debe garantizar. Es el criterio de aceptación. | 10 min |
| 3 | [03-flujo-cu2.md](03-flujo-cu2.md) | Mapa de navegación y qué ve hoy el usuario en cada excepción, con el texto literal. | 10 min |
| 4 | [02-estado-actual/inventario.md](02-estado-actual/inventario.md) | Pantallas, rutas, archivos fuente y capturas a 1440 px y 390 px. | consulta |
| 5 | [05-auditoria-ui.md](05-auditoria-ui.md) | Problemas actuales ordenados por gravedad, con evidencia, tokens y componentes. | 15 min |
| 6 | [06-copy.md](06-copy.md) | Todos los textos actuales y la propuesta corregida. | consulta |
| 7 | [07-contenido.md](07-contenido.md) | Datos e imágenes disponibles por producto; proporciones y tamaños. | 5 min |
| 8 | [08-prompt-diseno.md](08-prompt-diseno.md) | Prompt listo para pegar en la herramienta que genera las pantallas. | 5 min |

Archivos de apoyo: [imagenes-origen.csv](imagenes-origen.csv) (origen de cada foto de producto), [02-estado-actual/respuestas-api.json](02-estado-actual/respuestas-api.json) (respuestas literales del servidor para las excepciones sin pantalla propia) y [02-estado-actual/capturas.json](02-estado-actual/capturas.json) (cada captura con su ruta y los avisos que mostraba).

## Cómo se produjeron las capturas

Con Playwright contra el portal corriendo en local (frontend en `localhost:3000`, backend en `localhost:3001`, base de datos local). El script es `e2e/capturas/capturar-estado-actual.mjs`; se puede volver a ejecutar para refrescar las capturas después de un cambio:

```bash
cd e2e
node capturas/capturar-estado-actual.mjs
```

Condiciones de las capturas que conviene saber:

- Hay 9 sucursales en la base local. Para mostrar ambos estados se sincronizaron dos (retiro disponible) y las demás conservan la sincronización vieja de la siembra, por eso aparecen con "Sin sincronizar hace 30000 min" o más. Es un dato de prueba, no un comportamiento normal.
- La pantalla de Stripe Checkout es de un tercero y no se capturó: el canal nunca ve datos de tarjeta.
- Las pantallas internas (`/interno/*`) están fuera del alcance de este rediseño.

## Reglas para quien diseñe

1. No proponer funcionalidades fuera del alcance (ver brief, sección 4).
2. No cambiar la lógica de negocio: el diseño muestra lo que devuelve el servidor, sin recalcular.
3. Usar el vocabulario del brief, sección 5, en todo texto de interfaz.
4. Si algo del brief contradice lo que ves en pantalla o en el canon (`docs/canon/CANON-ComproYa.md`), avisar antes de resolverlo.
