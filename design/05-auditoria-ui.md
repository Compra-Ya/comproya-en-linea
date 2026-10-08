# 05 — Auditoría de UI/UX del estado actual

Ordenada por gravedad. Cada hallazgo cita su captura (`1440/NN-…` o `390/NN-…` dentro de `02-estado-actual/`) y los casos de usabilidad que bloquea ([04](04-requisitos-usabilidad.md)). Gravedad: **Crítica** = impide completar la tarea o la hace engañosa; **Alta** = causa errores o abandono; **Media** = fricción o inconsistencia.

## 1. Hallazgos

### Críticos

| ID | Hallazgo | Evidencia | Bloquea |
|---|---|---|---|
| A-01 | **El pago con débito bancario no se puede completar desde la interfaz.** "Simular confirmación" y "Simular rechazo" muestran el aviso rojo "Encabezado X-Debito-Secreto ausente o inválido": el frontend no envía el secreto que exige el servidor. Además, esos botones son una herramienta de prueba visible para el cliente. | [1440/34-pago-debito-simular-falla.png](02-estado-actual/1440/34-pago-debito-simular-falla.png) | UT-04, UT-07, UT-10, UT-12 (si se elige débito) |
| A-03 | **Los errores del comprobante se disfrazan.** Cualquier fallo (pedido sin pagar, pedido de otro cliente con 403) produce unos 30 s de "Confirmando el pago con la pasarela…" y luego "El pago aún no se ha confirmado. Si acabas de pagar con tarjeta, espera unos segundos y recarga.", sin botón de reintento. Para el pedido ajeno el mensaje es falso. "Mis pedidos" sin sesión muestra "Unauthorized". | [1440/40](02-estado-actual/1440/40-comprobante-no-disponible.png), [1440/41](02-estado-actual/1440/41-comprobante-pedido-de-otro-cliente-403.png), [1440/21](02-estado-actual/1440/21-pedidos-sin-sesion.png) | UT-04, UT-07, UT-10 |
| A-18 | **El flujo no se puede usar a 390 px de ancho.** Los estilos en línea de varias pantallas fijan columnas (por ejemplo `1fr 340px`, `360px 1fr`) que anulan los puntos de quiebre de la hoja de estilos. De 41 capturas a 390 px, **16 son más anchas que la pantalla** (detalle de producto hasta 972 px, carrito 528 px, confirmar pedido 549–576 px) y obligan a desplazarse en horizontal. En confirmar pedido los nombres y precios de los productos se parten en una columna muy estrecha. | [390/07](02-estado-actual/390/07-producto-detalle-televisor.png), [390/16](02-estado-actual/390/16-carrito-invitado-con-productos.png), [390/25](02-estado-actual/390/25-confirmar-pedido.png) | UT-01 a UT-12 |

### Altos

| ID | Hallazgo | Evidencia | Bloquea |
|---|---|---|---|
| A-02 | **Cromo y navegación inconsistentes.** Catálogo, detalle, carrito y mis pedidos usan la cabecera de tienda; confirmar pedido, pago y comprobante usan un encabezado distinto con solo el logotipo. El enlace "Carrito" de la barra de categorías figura junto a "Todas las categorías" como si fueran categorías. | [1440/25](02-estado-actual/1440/25-confirmar-pedido.png), [1440/31](02-estado-actual/1440/31-pago-tarjeta.png), [1440/35](02-estado-actual/1440/35-comprobante-exito.png) | UT-03, UT-06, UT-08 |
| A-05 | **No hay indicador de progreso del flujo.** Solo confirmar pedido dice "Paso 2 de 3 · Confirmación"; el carrito, el pago y el comprobante no dicen en qué paso están, y el "3" no cuenta el comprobante. | [1440/25](02-estado-actual/1440/25-confirmar-pedido.png) | UT-03, UT-05 |
| A-07 | **El estado del sistema es invisible.** Catálogo y carrito cargando: sin indicador (el carrito muestra solo "Cargando…" sin estructura). Débito: "Esperando confirmación del débito bancario…" sin hora límite ni actualización automática; al vencer los 30 minutos la pantalla no cambia. La reserva de unidades no se muestra (ni que existe ni hasta cuándo). | [1440/05](02-estado-actual/1440/05-catalogo-cargando.png), [1440/14](02-estado-actual/1440/14-carrito-cargando.png), [1440/33](02-estado-actual/1440/33-pago-debito-esperando.png) | UT-07, UT-10 |
| A-08 | **El cupón se "aplica" sin validar.** "Aplicar" muestra "Cupón aplicado al confirmar (se valida en el servidor)" con cualquier texto; si el cupón es inválido, el error aparece sin quitar el aviso verde (los dos a la vez). El descuento no se ve en el resumen. | [1440/28](02-estado-actual/1440/28-confirmar-cupon-aplicado-sin-validar.png), [1440/29](02-estado-actual/1440/29-confirmar-error-cupon-invalido.png), [1440/30](02-estado-actual/1440/30-confirmar-cupon-valido.png) | UT-09, UT-12 |
| A-09 | **Jerga interna en pantalla.** Códigos de regla (RN-03, RN-04, RN-05, RN-06, RN-07, E-2), "ERP", "Código homologado", "identificador de correlación", "token", "Stripe, en modo de prueba", "Analista de Marketing". El cliente no tiene por qué entenderlos. | [1440/07](02-estado-actual/1440/07-producto-detalle-televisor.png), [1440/25](02-estado-actual/1440/25-confirmar-pedido.png), [1440/31](02-estado-actual/1440/31-pago-tarjeta.png) | UT-02, UT-05, UT-11 |
| A-11 | **Faltan salidas.** Sin "Volver al carrito" en confirmar pedido; sin "Cancelar" ni "Ver mis pedidos" en pago; el comprobante solo ofrece "Volver al catálogo". **No existe la acción "Cancelar pedido"** en ninguna pantalla aunque la regla de cancelación antes del alistamiento es parte del caso de uso. | [1440/25](02-estado-actual/1440/25-confirmar-pedido.png), [1440/38](02-estado-actual/1440/38-pedidos-con-estados.png) | UT-03, UT-06, UT-10 |
| A-20 | **Producto no publicado o inexistente: pantalla vacía sin mensaje.** El servidor responde 404, la pantalla no lo muestra y deja la tabla de sucursales; al pulsar "Retirar aquí" recién aparece el error. | [1440/10](02-estado-actual/1440/10-producto-no-publicado.png), [1440/11](02-estado-actual/1440/11-producto-inexistente.png) | UT-04 |

### Medios

| ID | Hallazgo | Evidencia | Bloquea |
|---|---|---|---|
| A-04 | **Íconos sin etiqueta o sin función.** Los íconos de categoría son todos el mismo dibujo (un rectángulo); el corazón de la tarjeta de producto es decorativo (su propio `title` dice "Decorativo — sin lista de deseos implementada") y sugiere una función fuera del alcance; el selector "Todas" de la búsqueda está deshabilitado; los botones de cantidad son "–" y "+". | [1440/01](02-estado-actual/1440/01-catalogo-exito.png) | UT-02 |
| A-06 | **El catálogo queda enterrado.** Antes del listado hay un hero, cuatro insignias, 26 categorías y un banner; la lista de productos empieza hacia los 1650 px de una página de 3719 px. | [1440/01](02-estado-actual/1440/01-catalogo-exito.png) | UT-01, UT-08 |
| A-10 | **Vocabulario inconsistente en los nombres de paso.** "Continuar a la confirmación" → "Confirmar pedido" → "Paso 2 de 3 · Confirmación" → "Pagar pedido" → "Pago confirmado" → "Comprobante" (esta última palabra no aparece nunca en pantalla). | [06-copy.md](06-copy.md) | UT-01, UT-11 |
| A-12 | **Datos y promesas fijos en el texto.** "8 sucursales" (hay 9 en la base), "8 sucursales sincronizadas" (mientras tanto hay 2 con retiro), "≤5 min" (el umbral del canon es 15 minutos), "Soporte 24/7" (no está en el canon). El hero del cliente incluye "Publicar producto", acción de un rol interno. | [1440/01](02-estado-actual/1440/01-catalogo-exito.png), [1440/07](02-estado-actual/1440/07-producto-detalle-televisor.png) | UT-01, UT-05 |
| A-13 | **Identificadores internos en lugar de nombres.** Sucursales como "Sucursal #6"; errores con "producto 209 en la sucursal 6"; categorías en inglés ("mens-shirts", "home-decoration"). | [1440/07](02-estado-actual/1440/07-producto-detalle-televisor.png), [1440/26](02-estado-actual/1440/26-confirmar-error-unidades-insuficientes.png) | UT-02 |
| A-14 | **Contraste insuficiente.** Relaciones de contraste calculadas con la fórmula WCAG: texto blanco sobre el naranja de los botones 3,14:1; texto tenue (`--ink-faint`) sobre blanco 2,81:1; verde sobre verde claro 3,32:1; rojo sobre rojo claro 3,95:1; ámbar sobre ámbar claro 2,86:1 (el mínimo para texto normal es 4,5:1). Los botones deshabilitados quedan atenuados sin decir por qué. | [1440/07](02-estado-actual/1440/07-producto-detalle-televisor.png) | UT-02 |
| A-15 | **El aviso de "producto agregado" aparece lejos de la acción.** En el catálogo se muestra sobre el título "Catálogo", arriba de la grilla; si el usuario está en la fila 4, no lo ve. | [1440/01](02-estado-actual/1440/01-catalogo-exito.png) | UT-08 |
| A-16 | **Formularios sin ayuda.** Las etiquetas no están asociadas a sus campos (`htmlFor`: 0 usos en todo el frontend), los errores no indican el campo, el selector de sucursal de confirmar pedido lista también las sucursales que no ofrecen retiro. | [1440/27](02-estado-actual/1440/27-confirmar-error-sucursal-desincronizada.png), [1440/18](02-estado-actual/1440/18-registro-error-documento-duplicado.png) | UT-09 |
| A-17 | **Componentes que se comportan distinto según la pantalla.** Tres estilos de botón principal (`btn-primary`, `btn-primary-lg`, `btn-navy`), dos cabeceras, estados de carga resueltos de formas distintas, "Mis pedidos" sin fecha ni total. | [1440/38](02-estado-actual/1440/38-pedidos-con-estados.png) | UT-11 |
| A-19 | **Mis pedidos es una lista mínima.** Número y estado, sin fecha, sucursal, total ni código de retiro; el motivo de "Cancelado" o "Pago fallido" no se explica. | [1440/38](02-estado-actual/1440/38-pedidos-con-estados.png) | UT-07, UT-11 |

## 2. Tokens actuales

Fuente: `frontend/src/app/globals.css`. Los tokens vienen de los mockups del canon (`docs/mockups-plan.md`).

### 2.1 Colores (variables CSS en `:root`)

| Token | Valor | Uso actual |
|---|---|---|
| `--orange` | `#f2661d` | Acción principal, enlaces, etiquetas |
| `--orange-soft` | `#fef1e7` | Fondo de acento |
| `--navy` | `#163d6d` | Barra superior, pie, acción secundaria |
| `--navy-soft` | `#eaf0f7` | Fondo de acento secundario |
| `--ink` | `#171717` | Texto principal |
| `--ink-soft` | `#6b6b6b` | Texto secundario (contraste 5,33:1 sobre blanco) |
| `--ink-faint` | `#9a9a9a` | Texto terciario (contraste 2,81:1 sobre blanco) |
| `--line` | `#e5e5e5` | Bordes |
| `--surface` | `#ffffff` | Superficies |
| `--surface-muted` | `#f7f7f7` | Fondo de página |
| `--ok` / `--ok-soft` | `#059669` / `#d1fae5` | Éxito |
| `--danger` / `--danger-soft` | `#dc2626` / `#fee2e2` | Error |
| `--warn` / `--warn-soft` | `#d97706` / `#fef3c7` | Advertencia |

### 2.2 Tipografía

- Familia: **Geist** (400, 500, 600, 700, 800) cargada desde Google Fonts con `@import`; respaldo `ui-sans-serif, system-ui, -apple-system, sans-serif`.
- Base: 14 px, interlineado 1,45. Títulos `h1`–`h4`: peso 700, espaciado de letras −0,01 em.
- Tamaños que se usan (CSS y estilos en línea): 11, 11,5, 12, 12,5, 13, 14, 15, 22, 24 y 26 px. Sin escala definida: son valores sueltos.

### 2.3 Espaciado, radios y puntos de quiebre

- Sin tokens de espaciado. Valores recurrentes: contenedor máximo 1180 px con relleno de 24 px (`.container`); `.card-pad` 20 px × 24 px; `.notice` 12 px × 14 px; huecos de rejilla de 16 px, 32 px y 40 px.
- Radios: 10 px (botones, avisos, campos), 14 px (tarjetas), 999 px (insignias, píldoras). 8 y 19 px aparecen una vez cada uno.
- Botones: altura fija de 42 px (`.btn`), 34 y 30 px en estilos en línea.
- Puntos de quiebre: dos, `900px` y `720px`. Las pantallas con rejillas en línea (detalle, carrito, confirmar, pago) no los respetan (ver A-18).

## 3. Componentes existentes

No hay biblioteca de componentes: son clases CSS globales (80 reglas) y un solo componente de React compartido por varias pantallas, más el nuevo de imagen.

| Componente | Archivo | Dónde se usa |
|---|---|---|
| `ShopHeader` (barra superior, buscador, sesión, carrito, barra de categorías) | `frontend/src/components/ShopHeader.tsx` | Catálogo, detalle, carrito, mis pedidos |
| `ProductImage` (foto o placeholder por categoría; nunca imagen rota) | `frontend/src/components/ProductImage.tsx` | Catálogo, detalle, carrito |
| Tarjeta de producto (`product-card`, `product-thumb`, `product-info`, `tag-orange`, `wishlist-btn`) | `page.tsx` (catálogo) | Catálogo |
| Botones (`btn`, `btn-primary`, `btn-navy`, `btn-outline-red`, `btn-full`, `btn-login`, `btn-primary-lg`, `btn-outline-lg`, `btn-white`) | `globals.css` | Todas |
| Avisos (`notice`, `notice-ok`, `notice-warn`, `notice-danger`, `notice-neutral`) e insignias (`badge`, `badge-ok`, `badge-danger`, `badge-orange`, `badge-neutral`) | `globals.css` | Todas |
| Tarjeta (`card`, `card-pad`), campo de formulario (`field`), casilla (`check-row`), pestañas (`tabs`) | `globals.css` | Formularios, pago |
| Línea de carrito (`line-item`, `thumb`, `stepper`), totales (`totalsrow`, `li`) | `globals.css` | Carrito, confirmar, comprobante |
| Envoltorio de acceso y pago (`auth-shell`, `auth-brand`, `auth-wrap`) | `globals.css` | Registro, ingreso, pago, comprobante |
| Código de retiro (`retiro-code`, `check-circle`) | `globals.css` | Comprobante |
| Landing (`hero`, `hero-*`, `badges-grid`, `badge-card`, `cat-grid`, `cat-item`, `wide-banner`, `footer*`, `section-head`) | `globals.css` | Catálogo |
| Pie académico (`pie-academico`) | `globals.css`, `layout.tsx` | Todas |
| Panel interno (`panel-shell`, `panel-sidebar`, `panel-topbar`, `panel-main`) | `globals.css` | Pantallas internas (fuera de alcance) |
