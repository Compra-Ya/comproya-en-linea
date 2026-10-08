# Inventario de pantallas y capturas — estado actual

Capturas a **1440 px** y **390 px** de ancho, página completa. Generadas con `e2e/capturas/capturar-estado-actual.mjs` (ver [README](../README.md)). Las rutas con número (`/pago/25`) son pedidos de la base local de pruebas. Las capturas `09` y `42` simulan la respuesta del servidor sin foto, porque en el catálogo de pruebas todo producto publicado tiene foto.

## 1. Pantallas del flujo

| Pantalla | Ruta | Archivo fuente | Alcance |
|---|---|---|---|
| Catálogo y búsqueda | `/` | `frontend/src/app/page.tsx` | Caso de Uso 2 |
| Detalle de producto con disponibilidad por sucursal | `/producto/[id]` | `frontend/src/app/producto/[id]/page.tsx` | Caso de Uso 2 |
| Carrito (invitado y registrado) | `/carrito` | `frontend/src/app/carrito/page.tsx` | Caso de Uso 2 |
| Confirmar pedido (sucursal + cupón) | `/pedido/confirmar` | `frontend/src/app/pedido/confirmar/page.tsx` | Caso de Uso 2 |
| Pago (tarjeta / débito bancario) | `/pago/[orderId]` | `frontend/src/app/pago/[orderId]/page.tsx` | Caso de Uso 2 |
| Comprobante con código de retiro | `/comprobante/[orderId]` | `frontend/src/app/comprobante/[orderId]/page.tsx` | Caso de Uso 2 |
| Mis pedidos | `/pedidos` | `frontend/src/app/pedidos/page.tsx` | Caso de Uso 2 |
| Registro (paso previo) | `/registro` | `frontend/src/app/registro/page.tsx` | Paso previo |
| Inicio de sesión (paso previo) | `/ingresar` | `frontend/src/app/ingresar/page.tsx` | Paso previo |
| Consentimiento (destino del registro) | `/privacidad` | `frontend/src/app/privacidad/page.tsx` | Paso previo |
| Publicar producto, detalle interno de pedido | `/interno/publicar`, `/interno/pedidos/[id]` | `frontend/src/app/interno/**` | Fuera del alcance del rediseño |

Componentes compartidos: `frontend/src/components/ShopHeader.tsx`, `frontend/src/components/ProductImage.tsx`; estilos: `frontend/src/app/globals.css`; textos de cabecera y pie: `frontend/src/app/layout.tsx`.

## 2. Capturas por estado

Cada fila es el mismo estado a 1440 px y a 390 px. «Avisos» son los textos de aviso o error que la pantalla mostraba.

| Estado | Ruta | Archivo fuente | 1440 px | 390 px | Avisos en pantalla |
|---|---|---|---|---|---|
| Catálogo con productos (éxito) | `/` | `frontend/src/app/page.tsx` | [01-catalogo-exito.png](1440/01-catalogo-exito.png) | [01-catalogo-exito.png](390/01-catalogo-exito.png) | — |
| Búsqueda sin resultados | `/?q=zzzzqqq` | `frontend/src/app/page.tsx` | [02-catalogo-vacio.png](1440/02-catalogo-vacio.png) | [02-catalogo-vacio.png](390/02-catalogo-vacio.png) | — |
| Búsqueda de menos de 3 caracteres | `/?q=ab` | `frontend/src/app/page.tsx` | [03-catalogo-busqueda-corta.png](1440/03-catalogo-busqueda-corta.png) | [03-catalogo-busqueda-corta.png](390/03-catalogo-busqueda-corta.png) | La búsqueda requiere al menos 3 caracteres |
| Búsqueda con resultados (fotos retail) | `/?q=Chair` | `frontend/src/app/page.tsx` | [04-catalogo-busqueda-chair.png](1440/04-catalogo-busqueda-chair.png) | [04-catalogo-busqueda-chair.png](390/04-catalogo-busqueda-chair.png) | — |
| Mientras llega la respuesta de /catalogo/productos (retrasada 3,5 s) | `/` | `frontend/src/app/page.tsx` | [05-catalogo-cargando.png](1440/05-catalogo-cargando.png) | [05-catalogo-cargando.png](390/05-catalogo-cargando.png) | — |
| Fallo de red al pedir el catálogo | `/` | `frontend/src/app/page.tsx` | [06-catalogo-error.png](1440/06-catalogo-error.png) | [06-catalogo-error.png](390/06-catalogo-error.png) | No se pudo cargar el catálogo |
| Detalle con disponibilidad por sucursal (2 sincronizadas, el resto sin sincronizar) | `/producto/2405` | `frontend/src/app/producto/[id]/page.tsx` | [07-producto-detalle-televisor.png](1440/07-producto-detalle-televisor.png) | [07-producto-detalle-televisor.png](390/07-producto-detalle-televisor.png) | — |
| Detalle con foto retail | `/producto/209` | `frontend/src/app/producto/[id]/page.tsx` | [08-producto-detalle-silla.png](1440/08-producto-detalle-silla.png) | [08-producto-detalle-silla.png](390/08-producto-detalle-silla.png) | — |
| Placeholder por categoría (respuesta simulada sin imageUrl: hoy todo producto publicado tiene foto) | `/producto/209` | `frontend/src/app/producto/[id]/page.tsx` | [09-producto-sin-foto.png](1440/09-producto-sin-foto.png) | [09-producto-sin-foto.png](390/09-producto-sin-foto.png) | — |
| Excepción: producto no publicado | `/producto/1` | `frontend/src/app/producto/[id]/page.tsx` | [10-producto-no-publicado.png](1440/10-producto-no-publicado.png) | [10-producto-no-publicado.png](390/10-producto-no-publicado.png) | — |
| Producto inexistente | `/producto/9999999` | `frontend/src/app/producto/[id]/page.tsx` | [11-producto-inexistente.png](1440/11-producto-inexistente.png) | [11-producto-inexistente.png](390/11-producto-inexistente.png) | — |
| Fallo al consultar la disponibilidad | `/producto/2405` | `frontend/src/app/producto/[id]/page.tsx` | [12-producto-error-disponibilidad.png](1440/12-producto-error-disponibilidad.png) | [12-producto-error-disponibilidad.png](390/12-producto-error-disponibilidad.png) | No se pudo consultar la disponibilidad |
| Excepción: carrito vacío | `/carrito` | `frontend/src/app/carrito/page.tsx` | [13-carrito-vacio-invitado.png](1440/13-carrito-vacio-invitado.png) | [13-carrito-vacio-invitado.png](390/13-carrito-vacio-invitado.png) | — |
| Mientras llega GET /carrito (retrasado 3 s) | `/carrito` | `frontend/src/app/carrito/page.tsx` | [14-carrito-cargando.png](1440/14-carrito-cargando.png) | [14-carrito-cargando.png](390/14-carrito-cargando.png) | — |
| Aviso de éxito tras 'Retirar aquí' | `/producto/2405` | `frontend/src/app/producto/[id]/page.tsx` | [15-producto-agregado-al-carrito.png](1440/15-producto-agregado-al-carrito.png) | [15-producto-agregado-al-carrito.png](390/15-producto-agregado-al-carrito.png) | Producto agregado al carrito para retirar en esta sucursal. Ver carrito |
| Carrito de invitado con productos y complementarios | `/carrito` | `frontend/src/app/carrito/page.tsx` | [16-carrito-invitado-con-productos.png](1440/16-carrito-invitado-con-productos.png) | [16-carrito-invitado-con-productos.png](390/16-carrito-invitado-con-productos.png) | — |
| Registro (paso previo) | `/registro` | `frontend/src/app/registro/page.tsx` | [17-registro.png](1440/17-registro.png) | [17-registro.png](390/17-registro.png) | — |
| Excepción E-1: documento ya registrado | `/registro` | `frontend/src/app/registro/page.tsx` | [18-registro-error-documento-duplicado.png](1440/18-registro-error-documento-duplicado.png) | [18-registro-error-documento-duplicado.png](390/18-registro-error-documento-duplicado.png) | Ya existe una cuenta registrada con ese documento |
| Inicio de sesión (paso previo) | `/ingresar` | `frontend/src/app/ingresar/page.tsx` | [19-ingresar.png](1440/19-ingresar.png) | [19-ingresar.png](390/19-ingresar.png) | — |
| Credenciales inválidas | `/ingresar` | `frontend/src/app/ingresar/page.tsx` | [20-ingresar-error-credenciales.png](1440/20-ingresar-error-credenciales.png) | [20-ingresar-error-credenciales.png](390/20-ingresar-error-credenciales.png) | Credenciales inválidas |
| Mis pedidos sin iniciar sesión | `/pedidos` | `frontend/src/app/pedidos/page.tsx` | [21-pedidos-sin-sesion.png](1440/21-pedidos-sin-sesion.png) | [21-pedidos-sin-sesion.png](390/21-pedidos-sin-sesion.png) | Unauthorized |
| Mis pedidos sin pedidos (cliente nuevo) | `/pedidos` | `frontend/src/app/pedidos/page.tsx` | [22-pedidos-vacio.png](1440/22-pedidos-vacio.png) | [22-pedidos-vacio.png](390/22-pedidos-vacio.png) | — |
| Consentimiento (destino tras el registro) | `/privacidad` | `frontend/src/app/privacidad/page.tsx` | [23-privacidad-consentimiento.png](1440/23-privacidad-consentimiento.png) | [23-privacidad-consentimiento.png](390/23-privacidad-consentimiento.png) | — |
| Carrito de cliente registrado | `/carrito` | `frontend/src/app/carrito/page.tsx` | [24-carrito-registrado-con-productos.png](1440/24-carrito-registrado-con-productos.png) | [24-carrito-registrado-con-productos.png](390/24-carrito-registrado-con-productos.png) | — |
| Confirmación de pedido (sucursal por defecto: la primera de la lista) | `/pedido/confirmar` | `frontend/src/app/pedido/confirmar/page.tsx` | [25-confirmar-pedido.png](1440/25-confirmar-pedido.png) | [25-confirmar-pedido.png](390/25-confirmar-pedido.png) | — |
| Excepción: unidades insuficientes (cantidad 9999) | `/pedido/confirmar` | `frontend/src/app/pedido/confirmar/page.tsx` | [26-confirmar-error-unidades-insuficientes.png](1440/26-confirmar-error-unidades-insuficientes.png) | [26-confirmar-error-unidades-insuficientes.png](390/26-confirmar-error-unidades-insuficientes.png) | Solo hay 128 unidades disponibles para el producto 209 en la sucursal 6 |
| Excepción: sucursal sin sincronizar hace más de 15 min | `/pedido/confirmar` | `frontend/src/app/pedido/confirmar/page.tsx` | [27-confirmar-error-sucursal-desincronizada.png](1440/27-confirmar-error-sucursal-desincronizada.png) | [27-confirmar-error-sucursal-desincronizada.png](390/27-confirmar-error-sucursal-desincronizada.png) | La sucursal 3 lleva más de 15 minutos sin sincronizar con el ERP y no ofrece retiro |
| Tras 'Aplicar' con un código inventado (aún sin validar) | `/pedido/confirmar` | `frontend/src/app/pedido/confirmar/page.tsx` | [28-confirmar-cupon-aplicado-sin-validar.png](1440/28-confirmar-cupon-aplicado-sin-validar.png) | [28-confirmar-cupon-aplicado-sin-validar.png](390/28-confirmar-cupon-aplicado-sin-validar.png) | Cupón aplicado al confirmar (se valida en el servidor) |
| Excepción: cupón inválido | `/pedido/confirmar` | `frontend/src/app/pedido/confirmar/page.tsx` | [29-confirmar-error-cupon-invalido.png](1440/29-confirmar-error-cupon-invalido.png) | [29-confirmar-error-cupon-invalido.png](390/29-confirmar-error-cupon-invalido.png) | Cupón aplicado al confirmar (se valida en el servidor) · El cupón de lealtad no existe o no está vigente |
| Cupón LEALTAD10 aplicado | `/pedido/confirmar` | `frontend/src/app/pedido/confirmar/page.tsx` | [30-confirmar-cupon-valido.png](1440/30-confirmar-cupon-valido.png) | [30-confirmar-cupon-valido.png](390/30-confirmar-cupon-valido.png) | Cupón aplicado al confirmar (se valida en el servidor) |
| Pago: pestaña Tarjeta | `/pago/25` | `frontend/src/app/pago/[orderId]/page.tsx` | [31-pago-tarjeta.png](1440/31-pago-tarjeta.png) | [31-pago-tarjeta.png](390/31-pago-tarjeta.png) | — |
| Pago: pestaña Débito bancario | `/pago/25` | `frontend/src/app/pago/[orderId]/page.tsx` | [32-pago-debito-inicio.png](1440/32-pago-debito-inicio.png) | [32-pago-debito-inicio.png](390/32-pago-debito-inicio.png) | — |
| Estado: esperando confirmación del débito | `/pago/25` | `frontend/src/app/pago/[orderId]/page.tsx` | [33-pago-debito-esperando.png](1440/33-pago-debito-esperando.png) | [33-pago-debito-esperando.png](390/33-pago-debito-esperando.png) | Esperando confirmación del débito bancario… |
| Resultado real de 'Simular confirmación' (el frontend no envía X-Debito-Secreto) | `/pago/25` | `frontend/src/app/pago/[orderId]/page.tsx` | [34-pago-debito-simular-falla.png](1440/34-pago-debito-simular-falla.png) | [34-pago-debito-simular-falla.png](390/34-pago-debito-simular-falla.png) | Encabezado X-Debito-Secreto ausente o inválido · Esperando confirmación del débito bancario… |
| Comprobante con código de retiro | `/comprobante/25` | `frontend/src/app/comprobante/[orderId]/page.tsx` | [35-comprobante-exito.png](1440/35-comprobante-exito.png) | [35-comprobante-exito.png](390/35-comprobante-exito.png) | — |
| Excepción: pago con tarjeta no admitido (pedido ya pagado) | `/pago/25` | `frontend/src/app/pago/[orderId]/page.tsx` | [36-pago-tarjeta-error-pedido-ya-pagado.png](1440/36-pago-tarjeta-error-pedido-ya-pagado.png) | [36-pago-tarjeta-error-pedido-ya-pagado.png](390/36-pago-tarjeta-error-pedido-ya-pagado.png) | El pedido ya no admite un nuevo intento de pago |
| Excepción: pago con tarjeta cancelado o fallido (regreso desde Stripe) | `/pago/25?cancelado=1` | `frontend/src/app/pago/[orderId]/page.tsx` | [37-pago-tarjeta-cancelado.png](1440/37-pago-tarjeta-cancelado.png) | [37-pago-tarjeta-cancelado.png](390/37-pago-tarjeta-cancelado.png) | El pago con tarjeta fue cancelado o no se completó. |
| Mis pedidos: pagado y cancelado por débito rechazado | `/pedidos` | `frontend/src/app/pedidos/page.tsx` | [38-pedidos-con-estados.png](1440/38-pedidos-con-estados.png) | [38-pedidos-con-estados.png](390/38-pedidos-con-estados.png) | — |
| Estado intermedio: 'Confirmando el pago con la pasarela…' | `/comprobante/27` | `frontend/src/app/comprobante/[orderId]/page.tsx` | [39-comprobante-reintentando.png](1440/39-comprobante-reintentando.png) | [39-comprobante-reintentando.png](390/39-comprobante-reintentando.png) | — |
| Excepción: comprobante no disponible (pedido sin pagar) | `/comprobante/27` | `frontend/src/app/comprobante/[orderId]/page.tsx` | [40-comprobante-no-disponible.png](1440/40-comprobante-no-disponible.png) | [40-comprobante-no-disponible.png](390/40-comprobante-no-disponible.png) | El pago aún no se ha confirmado. Si acabas de pagar con tarjeta, espera unos segundos y recarga. |
| Excepción: pedido de otro cliente (la API responde 403) | `/comprobante/25` | `frontend/src/app/comprobante/[orderId]/page.tsx` | [41-comprobante-pedido-de-otro-cliente-403.png](1440/41-comprobante-pedido-de-otro-cliente-403.png) | [41-comprobante-pedido-de-otro-cliente-403.png](390/41-comprobante-pedido-de-otro-cliente-403.png) | El pago aún no se ha confirmado. Si acabas de pagar con tarjeta, espera unos segundos y recarga. |
| Catálogo con placeholders (respuesta simulada sin imageUrl en una de cada dos tarjetas) | `/` | `frontend/src/app/page.tsx` | [42-catalogo-placeholders.png](1440/42-catalogo-placeholders.png) | [42-catalogo-placeholders.png](390/42-catalogo-placeholders.png) | — |

## 3. Estados que no existen hoy

- **Cargando del catálogo y del detalle:** no hay indicador; la captura `05` muestra la pantalla sin productos mientras llega la respuesta.
- **Cargando del comprobante:** solo el texto «Confirmando el pago con la pasarela…» (captura `39`).
- **Pago con tarjeta en la pasarela (Stripe Checkout):** pantalla externa, no capturada.
- **Pedido en alistamiento, listo para retiro, entregado:** estados que mueve un rol interno; en Mis pedidos solo cambia la etiqueta de texto, sin acción para el cliente.
- **Firma de webhook y secreto de débito inválidos:** sin pantalla; ver `respuestas-api.json` y [03-flujo-cu2.md](../03-flujo-cu2.md).
