# 06 — Textos: actuales y propuesta

Los textos "actuales" están copiados del código (`frontend/src/app/**`, `frontend/src/components/ShopHeader.tsx`) y de las respuestas del servidor. La propuesta usa el vocabulario del [brief](01-brief.md#5-vocabulario-de-la-interfaz-español): **confirmar pedido**, **pago con débito bancario**, **unidades disponibles**, **código de retiro**, **producto complementario**. Principios: sin identificadores internos (RN-nn, ERP, "homologado", números de sucursal), cada error dice qué pasó y qué hacer, y las cifras son las del canon (15 minutos, 5 días calendario, 30 minutos).

Convención: `{…}` es un dato que viene del servidor; el texto de la propuesta es una sugerencia que el diseñador puede ajustar manteniendo el sentido y las cifras.

## 1. Vocabulario: hallazgos en el texto actual

| Texto actual | Dónde | Problema | Propuesta |
|---|---|---|---|
| "Continuar a la confirmación" | Carrito | Nombre del paso distinto al de la pantalla siguiente | "Confirmar pedido" |
| "Paso 2 de 3 · Confirmación" | Confirmar pedido | Nombre de paso inconsistente; el paso 3 (pago) no es el último | "Paso 2 de 4 · Confirmar pedido" |
| "Unidades disponibles publicadas" | Detalle (encabezado de columna) | "publicadas" es interno | "Unidades disponibles" |
| "Débito bancario" (pestaña) | Pago | Correcto, pero la etiqueta del botón es "Continuar con mi banco" | Pestaña "Pago con débito bancario" |
| "Código homologado CURA-000003" | Detalle | Término interno | Quitar de la vista del cliente |
| "Sucursal #6" | Detalle | Identificador interno | Nombre de la sucursal ("ComproYa Barranquilla") |
| "identificador de correlación" | Comprobante | Término interno | Quitar o llamarlo "Referencia del pedido" |
| "Simular confirmación" / "Simular rechazo" | Pago | Herramienta de prueba visible para el cliente | No debe verse en el portal desplegado |

No se encontró en la interfaz actual ninguno de estos términos prohibidos: "checkout", "PSE", "stock", "cross-sell". El texto del encabezado "Cupón de lealtad" y "Productos complementarios" ("También podría interesarte") son correctos en sentido, pero ver 3.3.

## 2. Textos transversales

### 2.1 Cabecera de tienda (`ShopHeader`)

| Actual | Propuesta |
|---|---|
| "Retira en sucursal en el día · Cobertura en 8 sucursales" | "Compra en línea y retira en sucursal" (la cifra de sucursales debe salir de los datos, no estar escrita a mano; hoy hay 9 en la base) |
| "Mis pedidos" (enlace superior) | "Mis pedidos" (mantener) |
| "Todas" (selector deshabilitado) | Quitar el selector si no filtra |
| "Buscar productos, marcas y categorías…" | "Buscar productos" (la búsqueda requiere al menos 3 caracteres: decirlo al fallar, ver 3.1) |
| "Buscar" | "Buscar" |
| "Iniciar sesión" / "Hola," / "Salir" | "Iniciar sesión" / "Hola, {nombre}" / "Cerrar sesión" |
| "Carrito" / "$ {subtotal}" | "Carrito ({n} productos) · $ {subtotal}" |
| "Todas las categorías" · "Carrito" · "Mi cuenta" | "Catálogo" · "Carrito" · "Mis pedidos" · "Mi cuenta" |
| "8 sucursales sincronizadas" | "{n} sucursales con retiro disponible" (dato real; hoy es texto fijo) |

### 2.2 Pie de página

| Actual | Propuesta |
|---|---|
| "© 2026 ComproYa. Todos los derechos reservados." | Mantener |
| "Proyecto académico — Ingeniería de Software II, Universidad Central. Sin fines comerciales. Las imágenes de producto pertenecen a sus respectivos titulares." | Mantener literal (aviso obligatorio, agregado en la Tarea B) |
| Columnas: "Categorías", "Ayuda" (Mis pedidos, Privacidad y consentimiento), "Compañía" (Tiendas ComproYa, Canal digital B2C), "Cuenta" | "Compañía" y "Canal digital B2C" no aportan al cliente: reemplazar por "Cómo funciona el retiro" (ver 3.4) |

## 3. Por pantalla

### 3.1 Catálogo (`/`)

| Actual | Propuesta |
|---|---|
| "Catálogo homologado y verificado" (etiqueta del hero) | Quitar ("homologado" es interno) |
| "Todo lo que buscas, con disponibilidad real en tu sucursal" / `Resultados para "{q}"` | "Encuentra tu producto y retíralo en tu sucursal" / `Resultados para "{q}"` |
| "Miles de productos publicados con precio digital vigente y unidades disponibles calculadas en tiempo real. Sin sorpresas al retirar." | "Mira las unidades disponibles en cada sucursal, paga en línea y retira con tu código de retiro." |
| "Explorar el catálogo" · "Publicar producto" | "Ver productos". **Quitar "Publicar producto"**: es una acción de un rol interno |
| Estadísticas: "8 Sucursales con retiro" · "≤5 min Disponibilidad actualizada" · "{n} Productos publicados" | Solo cifras que salen de datos reales. "≤5 min" no corresponde al umbral del canon (15 minutos): si se muestra, usar 15 minutos y decir "Una sucursal deja de ofrecer retiro si lleva más de 15 minutos sin sincronizar" |
| Insignias: "Retiro el mismo día — En las 8 sucursales sincronizadas" · "Compra protegida — Reserva de unidades antes del cobro" · "Paga como quieras — Tarjeta o débito bancario" · "Soporte 24/7 — Consulta el estado de tu pedido" | "Retiro en sucursal — Elige dónde retirar al confirmar el pedido" · "Unidades reservadas — Al confirmar el pedido reservamos tus unidades" · "Dos formas de pago — Tarjeta o pago con débito bancario" · quitar "Soporte 24/7" (no existe en el canon) o reemplazar por "Sigue tu pedido en Mis pedidos" |
| "Explora por categoría" · "Todas" · "{n} productos" | Mantener. Los nombres de categoría vienen en inglés de la fuente de datos ("beauty", "mens-shirts"): ver [07-contenido.md](07-contenido.md) |
| "Cupones de lealtad esperándote — Vincula tu identificador de lealtad y aplica tus cupones al confirmar el pedido." · "Vincular mi lealtad" | "Cupones de lealtad — Vincula tu cuenta al programa de lealtad y aplica tus cupones al confirmar el pedido." · "Vincular mi cuenta" |
| "Catálogo" · "{n} productos publicados encontrados" | "Productos" · "{n} productos" |
| "Agregar al carrito" / "Agregando…" | Mantener |
| "Producto agregado al carrito. Elige la sucursal de retiro al confirmar el pedido." | Mantener; mostrarlo junto al botón pulsado, con enlace "Ver carrito" |
| "La búsqueda requiere al menos 3 caracteres" | "Escribe al menos 3 letras para buscar." |
| "No hay productos publicados que coincidan." | "No encontramos productos para "{q}". Revisa la ortografía o prueba con otra palabra." + botón "Ver todos los productos" |
| "No se pudo cargar el catálogo" | "No pudimos cargar los productos. Revisa tu conexión e inténtalo de nuevo." + botón "Reintentar" |
| "Cargar más ({n} de {total})" · "Cargando…" | "Ver más productos ({n} de {total})" |
| Corazón con `title="Decorativo — sin lista de deseos implementada"` | Quitar (lista de deseos está fuera del alcance) |
| "Pruebas" (categoría) | Ya no se muestra: sus 2 productos de prueba quedaron despublicados en el catálogo de pruebas |

### 3.2 Detalle de producto (`/producto/[id]`)

| Actual | Propuesta |
|---|---|
| "{categoría} · Código homologado {código}" | "{categoría}" |
| Encabezados de tabla: "Sucursal" · "Unidades disponibles publicadas" · "Sincronización" | "Sucursal" · "Unidades disponibles" · "Retiro" |
| "Sucursal #{id}" | "{nombre de la sucursal}, {ciudad}" |
| "Sincronizado hace {n} min" | "Disponible para retiro" |
| "Sin sincronizar hace {n} min" | "No disponible para retiro: sin información actualizada hace más de 15 minutos" |
| "Retirar aquí" (deshabilitado sin explicación) | "Retirar aquí"; cuando no está disponible, mostrar el motivo cerca del botón |
| "Una sucursal con más de 15 minutos sin sincronizar con el ERP no puede ofrecer retiro (RN-04). Las unidades disponibles publicadas ya descuentan el umbral de seguridad y las reservas de otros pedidos (RN-03)." (aviso rojo permanente) | "Si una sucursal lleva más de 15 minutos sin actualizar su información, no ofrece retiro hasta que se actualice." (aviso neutro, sin códigos) |
| "Producto agregado al carrito para retirar en esta sucursal." · "Ver carrito" | "Agregamos {producto} a tu carrito para retirarlo en {sucursal}." · "Ver carrito" |
| "No se pudo consultar la disponibilidad" | "No pudimos consultar las unidades disponibles. Inténtalo de nuevo." + "Reintentar" |
| (producto no publicado o inexistente: sin texto) | "Este producto ya no está disponible en la tienda en línea." + "Volver al catálogo" |

### 3.3 Carrito (`/carrito`)

| Actual | Propuesta |
|---|---|
| "Tu carrito" · "Se mantiene guardado aunque cambies de dispositivo." | Mantener; si es invitado, "Inicia sesión para guardarlo en tu cuenta" |
| "El carrito está vacío." | "Tu carrito está vacío." + "Ver productos" |
| "$ {precio} c/u" · "Quitar" · "–" / "+" | "{precio} cada uno" · "Quitar" · botones con texto accesible "Disminuir cantidad" / "Aumentar cantidad" |
| "También podría interesarte" · "Hasta 4 productos complementarios, curados por el Analista de Marketing." | "Productos complementarios" · quitar la mención al Analista de Marketing (rol interno) |
| "Agregar" (complementario) | "Agregar" |
| "Resumen" · "Subtotal" · "Productos" · "Total" | Mantener |
| "Continuar a la confirmación" | "Confirmar pedido" |
| "Cargando…" | Indicador de carga dentro de la estructura de la página |
| "No se pudo cargar el carrito" · "No se pudo actualizar el carrito" · "No se pudo agregar el producto" | "No pudimos actualizar tu carrito. Inténtalo de nuevo." + "Reintentar" |

### 3.4 Confirmar pedido (`/pedido/confirmar`)

| Actual | Propuesta |
|---|---|
| "Paso 2 de 3 · Confirmación" | "Paso 2 de 4 · Confirmar pedido" |
| "Confirmar pedido" · "Productos" · "Retiro" · "Sucursal" | Mantener |
| "{sucursal} — {ciudad}" (todas, incluso sin sincronizar) | Solo sucursales con retiro disponible, o las otras marcadas "Sin retiro por ahora" |
| "El código de retiro se genera al confirmar." | "Al confirmar el pedido se genera tu código de retiro. Se puede usar una sola vez y vence 5 días calendario después." (antes de pagar, aún no hay código: decir "después de pagar") |
| "Resumen del pedido" · "Subtotal" · "Total" | Añadir línea "Descuento por cupón" cuando exista |
| "Cupón de lealtad" · placeholder "LEALTAD10" · "Aplicar" | "Cupón de lealtad" · placeholder "Escribe tu código" · "Aplicar" (el placeholder no debe sugerir un código real) |
| "Cupón aplicado al confirmar (se valida en el servidor)" | Mostrar solo después de validar: "Cupón {código} aplicado: {n} % de descuento" |
| "Un cupón se redime una sola vez por pedido, incluso si reintentas la confirmación (RN-07)." | "Cada cupón se usa una sola vez por pedido." |
| "Al confirmar, tus unidades quedan reservadas en el ERP antes de cualquier cobro (RN-05)." | "Al confirmar el pedido reservamos tus unidades hasta que pagues." (decir hasta qué hora, con el dato real de vigencia de la reserva) |
| "Confirmar pedido" (botón) | Mantener |
| "Elige una sucursal de retiro." | Mantener |
| "No se pudo confirmar el pedido" | "No pudimos confirmar tu pedido. Inténtalo de nuevo." |
| "Solo hay {n} unidades disponibles para el producto {id} en la sucursal {id}" | "Solo quedan {n} unidades disponibles de {producto} en {sucursal}. Ajusta la cantidad en tu carrito." + botón "Volver al carrito" |
| "La sucursal {id} lleva más de 15 minutos sin sincronizar con el ERP y no ofrece retiro" | "{sucursal} no ofrece retiro por ahora. Elige otra sucursal." |
| "El cupón de lealtad no existe o no está vigente" | "Ese cupón no es válido o ya venció. Revisa el código o continúa sin cupón." |
| "Las unidades disponibles cambiaron antes de completar la reserva; vuelve a intentarlo" | "Las unidades de este producto cambiaron justo ahora. Vuelve a confirmar el pedido." |
| "El carrito está vacío, no hay nada que confirmar" | "Tu carrito está vacío." + "Ver productos" |

### 3.5 Pago (`/pago/[orderId]`)

| Actual | Propuesta |
|---|---|
| "Pagar pedido #{id}" | "Pagar pedido #{id}" (mantener) + total a pagar |
| Pestañas: "Tarjeta" · "Débito bancario" | "Pago con tarjeta" · "Pago con débito bancario" |
| "Este pago lo administra Stripe, en modo de prueba. ComproYa no almacena ni procesa el número de tarjeta: solo recibe un token emitido por la pasarela (RN-06)." | "Pagarás con tarjeta en la página segura de la pasarela de pagos. ComproYa nunca ve ni guarda los datos de tu tarjeta." (quitar "token", "RN-06"; la mención a "modo de prueba" es del proyecto académico: se puede mantener como aviso aparte) |
| "Pagar con tarjeta" | "Pagar con tarjeta" |
| "Selecciona tu banco" · "Banco Central" (deshabilitado) | Mantener solo si hay más de un banco; si no, quitar el selector |
| "Se simula la confirmación del banco (no hay una pasarela de débito bancario real conectada). Si no hay confirmación en 30 minutos, el pedido se cancela." | "Si el banco no confirma tu pago en 30 minutos, cancelamos el pedido y liberamos tus unidades." (el aviso de simulación pertenece al aviso académico) |
| "Continuar con mi banco" | "Continuar con el pago con débito bancario" |
| "Referencia: {ref}" | "Referencia de pago: {ref}" |
| "Esperando confirmación del débito bancario…" | "Esperando la confirmación de tu banco. Tienes hasta las {HH:MM} (30 minutos). Esta pantalla se actualiza sola." + enlace "Ver mis pedidos" |
| "Simular confirmación" / "Simular rechazo" | Quitar del portal desplegado |
| "El banco rechazó el débito (E-2). El pedido se canceló y la reserva se liberó." | "Tu banco rechazó el pago. Cancelamos el pedido y liberamos tus unidades. Puedes volver a intentarlo desde el catálogo." |
| "El pago con tarjeta fue cancelado o no se completó." | "No se completó tu pago con tarjeta. Tu pedido sigue reservado hasta las {HH:MM}: intenta de nuevo o elige el pago con débito bancario." |
| "El pedido ya no admite un nuevo intento de pago" | "Este pedido ya no admite pagos. Revisa su estado en Mis pedidos." |
| "No se pudo iniciar el pago con tarjeta" · "No se pudo iniciar el pago con débito bancario" · "No se pudo procesar la notificación" | "No pudimos iniciar el pago. Inténtalo de nuevo." |
| "Encabezado X-Debito-Secreto ausente o inválido" (visible hoy) | Nunca debe llegar al cliente |

### 3.6 Comprobante (`/comprobante/[orderId]`)

| Actual | Propuesta |
|---|---|
| "Continúa el flujo de pago, una vez el pago quedó confirmado" (banda gris superior, texto de maqueta) | Quitar |
| "Confirmando el pago con la pasarela…" | "Estamos confirmando tu pago…" con indicador de progreso y tiempo estimado |
| "El pago aún no se ha confirmado. Si acabas de pagar con tarjeta, espera unos segundos y recarga." (también para el caso de pedido de otro cliente) | Por caso: "Todavía no recibimos la confirmación de tu pago." + botones "Revisar de nuevo" y "Ver mis pedidos"; "No encontramos este pedido en tu cuenta." para el caso 403 |
| "Pago confirmado" | "¡Pago confirmado!" |
| "Pedido #{id} · identificador de correlación {id}" | "Pedido #{id}" |
| "Código de retiro" · "Válido hasta el {fecha} · de un solo uso" | "Tu código de retiro" · "Vence el {fecha} (5 días calendario). Se puede usar una sola vez." |
| "Total pagado" | "Total pagado" (el valor es el que devuelve el servidor, sin recalcular) |
| "Sucursal de retiro: {nombre} — {ciudad}" | "Retira en {nombre}, {ciudad}" |
| "Volver al catálogo" | "Seguir comprando" y "Ver mis pedidos" |

### 3.7 Mis pedidos (`/pedidos`)

| Actual | Propuesta |
|---|---|
| "Mis pedidos" | Mantener |
| "Unauthorized" (sin sesión) / "Inicia sesión para ver tus pedidos" (texto previsto) | "Inicia sesión para ver tus pedidos." + botón "Iniciar sesión" |
| "Todavía no tienes pedidos." | "Todavía no tienes pedidos." + "Ver productos" |
| Estados: "Creado, pendiente de pago" · "Pagado" · "En alistamiento" · "Listo para retiro" · "Entregado" · "Cancelado" · "Pago fallido" | Mantener los nombres; añadir para cada uno la siguiente acción y, en "Cancelado" o "Pago fallido", el motivo |
| "Pagar" · "Ver comprobante" | "Pagar" · "Ver comprobante y código de retiro" |
| (no existe) | "Cancelar pedido" mientras el pedido no haya iniciado alistamiento; después: "Este pedido ya está en alistamiento y no se puede cancelar." |

### 3.8 Registro e ingreso (paso previo)

| Actual | Propuesta |
|---|---|
| Registro: "Crea tu cuenta para hacer seguimiento a tus pedidos" · "Nombre completo" · "Documento de identidad" · "Correo electrónico" · "Contraseña" · "Acepto el tratamiento de mis datos personales y podré administrar mi consentimiento después de registrarme." · "Tu cuenta quedará vinculada a tu identificador de lealtad si ya tienes uno registrado en el programa de lealtad." · "Crear cuenta" | Mantener, con ayuda en línea ("Mínimo 8 caracteres") y mensajes por campo |
| "Ya existe una cuenta registrada con ese documento" | "Ya hay una cuenta con ese documento. ¿Quieres iniciar sesión?" + enlace |
| Ingreso: "Ingresar a ComproYa" · "Accede a tu cuenta para ver tus pedidos." · "Correo electrónico" · "Contraseña" · "Iniciar sesión" · "¿No tienes cuenta? Regístrate" | Mantener |
| "Credenciales inválidas" | "El correo o la contraseña no coinciden. Revisa los datos e inténtalo de nuevo." |
