# CANON — ComproYa en Línea · Canal de Venta Digital B2C

**Fuente única de verdad del proyecto.** Cualquier entregable debe ser consistente con este archivo. Si un documento futuro necesita algo que no está aquí, primero se agrega aquí.

**Versión:** 2.0 · **Última entrega reflejada:** Alcance reducido — Plan de gestión del alcance y Declaración de alcance, versión 1.0 en revisión (2026-10-19)

**Copia de trabajo.** Este archivo es una copia local, para que Claude Code lo tenga disponible sin depender de Claude Projects. El canon real y editable vive en Claude Projects — si algo cambia allá, actualizar esta copia en el mismo commit.

**Qué cambió frente a la versión 1.0.** El alcance se redujo mucho: una sola sucursal con una sola cifra de existencias, un ERP que el canal consume solo por una interfaz simulada, y foco en la venta transaccional. La versión 1.0 describía 8 sucursales, retiro en sucursal y siete actores internos. Los identificadores (RN, SP, C, CU) se conservan; las filas que ya no aplican siguen en las tablas, marcadas como «Fuera de alcance», para que nadie las vuelva a introducir sin querer. La sección 15 resume los cambios y la sección 8 trae la equivalencia entre los códigos de la EDT de la versión 1.0 y los vigentes.

---

## 1. Identidad del proyecto

| Campo | Valor |
|---|---|
| Título del proyecto | ComproYa en Línea — Canal de Venta Digital B2C |
| Empresa y patrocinador | Tiendas ComproYa (tienda de retail con una sola sucursal, un punto de venta —POS— y un ERP). Patrocina la Dirección de ComproYa (CEO, CFO y CTO). **El docente no es patrocinador** |
| Asignatura | Ingeniería de Software II · Universidad Central |
| Docente | Julio César Sierra González. Revisa los entregables académicos; no es patrocinador, ni interesado, ni autoridad de aprobación del proyecto |
| Integrantes | Nicolás Santiago Cancimance Pabón · Duván Camilo Serrano Rojas |
| Roles de Scrum (propuesta, ver D-03) | Product Owner: Nicolás Santiago Cancimance Pabón · Scrum Master: Duván Camilo Serrano Rojas · Equipo de desarrollo: ambos |

## 2. Qué es el producto

Un canal de comercio electrónico **B2C propio** que reemplaza la plataforma contratada a un proveedor externo. Cubre, en el alcance vigente: catálogo digital, disponibilidad de una sola cifra por producto, cuenta del cliente, carrito, confirmación de pedido con reserva de unidades, pago con tarjeta, comprobante, consulta y cancelación de pedidos, y consulta de ventas para el Coordinador de Canal Digital. Se vende con envío a domicilio; el despacho físico lo hace la tienda fuera del sistema.

**El problema en una frase:** el canal digital vende inventario que no puede verificar y registra clientes que no puede identificar, porque opera desacoplado del ERP de la tienda.

**El problema en el alcance vigente.** ComproYa tiene una sola sucursal, un POS que alimenta a su ERP y existencias unificadas en ese ERP. El canal se conecta solo al ERP, por una interfaz que en este proyecto es simulada: no hay un ERP real conectado. El problema se reduce a cuatro procesos transaccionales: publicar productos con el precio bajo control, identificar a quien compra, cerrar la venta reservando las unidades antes de cobrar, y cobrar sin guardar datos de tarjeta, dejando cada venta consultable.

## 3. Frontera del sistema

**Dentro:** publicación de catálogo con existencias, cálculo de unidades disponibles, carrito, confirmación de pedido con reserva y liberación de unidades en el ERP simulado, orquestación del pago con tarjeta, comprobante, consulta y cancelación de pedidos, lista de ventas del Coordinador de Canal Digital, cuenta del cliente, consentimiento y supresión de datos, y cuenta interna del Coordinador (se entra por la dirección `/admin`, sin botón en la tienda).

**Fuera pero condicionante (el canal los consume, no los gobierna):**

| Sistema | Qué aporta al canal | Cómo se trata en este proyecto |
|---|---|---|
| ERP | Existencias por producto (una sola sucursal), maestro de códigos homologados, y recibe la reserva y la liberación de unidades | **Interfaz simulada** (`PuertoErp` con `AdaptadorErpSimulado`): no hay ERP real; el adaptador lee y escribe las existencias en la base propia. Reemplazarlo por uno real no cambia las reglas de negocio |
| POS (punto de venta) | Registra las ventas del local y alimenta al ERP | **No se conecta al canal.** El canal solo habla con el ERP |
| Pasarela de pagos | Token emitido por la pasarela, resultado de autorización y notificación del pago | Stripe en modo de prueba. No hay cobros con dinero real |
| Plataforma contratada actual | Es el sistema a reemplazar | No aplica |

**Fuera del alcance:**

- *Heredado de la versión 1.0:* logística propia, campañas de mercadeo, tableros analíticos, catálogo de terceros, recomendación automática, devoluciones, facturación fiscal, y la aplicación de sala para asesores en tienda.
- *Agregado en la versión 2.0:* varias sucursales y ciudades; conexión directa con el POS; programa de lealtad (solo se aplica un código de descuento ya existente); estrategias de mercadeo y de venta (productos complementarios, recomendaciones); registro del comportamiento del cliente; pago con débito bancario; despacho y retiro en la sucursal (alistamiento, entrega con código de retiro, pedidos en riesgo); rastreo del pedido en tiempo real y operador logístico; notificaciones por cambio de estado; cobros con dinero real y reembolsos; historial de precios de 5 años y conciliación diaria; aplicación móvil nativa; reseñas, calificaciones, lista de deseos y comparador; chat de atención en vivo; otras monedas e idiomas; billeteras digitales y pagos a cuotas; compras a proveedores y conteo físico del inventario; y administración de cuentas internas desde la interfaz, recuperación de contraseña, bloqueo por intentos fallidos y segundo factor.

## 4. Actores canónicos

Usar estos nombres exactos. No inventar variantes ni sinónimos.

| Actor | Tipo | Qué hace en el canal | Alcance |
|---|---|---|---|
| Cliente digital | Externo | Busca, arma su carrito, confirma pedido, paga, consulta sus pedidos y puede cancelar antes de pagar | En alcance |
| Coordinador de Canal Digital | Interno (rol nuevo, aún sin asignar) | Publica productos con sus existencias, fija el precio digital y consulta las ventas. Entra con una cuenta interna por la dirección `/admin` | En alcance |
| Dirección de ComproYa (CEO, CFO, CTO) | Patrocinador | Aprueba la línea base del alcance y sus cambios | En alcance |
| Oficial de Protección de Datos | Cumplimiento | Responde por el tratamiento de datos personales (consentimiento y supresión) | En alcance |
| Administrador del ERP | Interno (interesado) | Sostendría la integración con el ERP; hoy la interfaz es simulada | En alcance (interesado) |
| Gerente de Tienda | Interno (interesado) | Recibe los pedidos pagados con su dirección de envío y los despacha fuera del sistema; no tiene pantalla propia | En alcance (interesado) |
| Analista de Marketing | Interno | Cura productos complementarios y mide su aporte | **Fuera de alcance** (CU-08) |
| Responsable de Lealtad | Interno | Vincula la cuenta digital al registro de lealtad | **Fuera de alcance** (CU-06) |
| Analista de Datos | Interno | Recibe el comportamiento del canal | **Fuera de alcance** (CU-06) |

Actores externos no humanos: **Pasarela de pagos** y **ERP** (simulado). Quedan fuera: **Operador logístico externo**, **Programa de lealtad** y **POS** (alimenta al ERP; no se conecta al canal).

## 5. Reglas de negocio

| ID | Regla | Estado en el alcance vigente |
|---|---|---|
| RN-01 | Un producto solo puede venderse en línea si su código está homologado en el maestro y ha sido publicado explícitamente en el canal | Vigente. El maestro se valida por el formato del código (interfaz del ERP simulada) |
| RN-02 | El precio digital puede diferir del precio de sala, pero nunca puede ser inferior al costo registrado en el ERP sin aprobación de gerencia comercial | Vigente |
| RN-03 | Las unidades que el canal ofrece equivalen a las existencias que reporta el ERP menos un umbral de seguridad y menos las unidades ya reservadas por otros pedidos | **Adaptada:** una sola sucursal (ya no «por sucursal»); el ERP es simulado; el umbral por defecto es de 5 unidades |
| RN-04 | Una sucursal que lleve más de 15 minutos sin sincronizar con el ERP no puede ofrecer retiro | **Fuera de alcance** (no hay retiro ni varias sucursales) |
| RN-05 | Ningún pedido se cobra sin que las unidades hayan quedado reservadas en el ERP | Vigente (reserva y liberación por la interfaz simulada) |
| RN-06 | ComproYa no almacena ni procesa datos de tarjeta: la captura ocurre en la pasarela y el canal solo recibe un token emitido por la pasarela | Vigente |
| RN-07 | Un cupón del programa de lealtad se redime una sola vez por pedido, incluso si el cliente reintenta la confirmación | Vigente, reducida a **aplicar un código de descuento ya existente** (sin programa de lealtad) |
| RN-08 | El código de retiro es de un solo uso y vence a los 5 días calendario | **Fuera de alcance** (no hay retiro en sucursal en la interfaz) |
| RN-09 | Un pedido solo puede cancelarse mientras no haya iniciado su alistamiento en sucursal | **Adaptada:** la interfaz ofrece cancelar solo antes de pagar, porque el reembolso no está definido |
| RN-10 | Sin consentimiento activo del cliente, su comportamiento se registra de forma anónima, sin identificador de cliente | **Fuera de alcance** (no hay registro de comportamiento, CU-06) |
| RN-11 | Una solicitud de supresión de datos personales debe ejecutarse dentro de las 72 horas siguientes | Vigente |

## 6. Sub-problemas

| ID | Proceso | Disfunción (resumen) | Alcance |
|---|---|---|---|
| SP-01 | Gobierno del catálogo digital | Publicar no es un acto controlado ni auditable, y depende de un rol técnico | Vigente |
| SP-02 | Determinación de la disponibilidad | La cifra publicada viene del proceso nocturno y no descuenta umbral ni reservas | Vigente (una sola cifra, ERP simulado) |
| SP-03 | Sostenimiento de la intención de compra | El carrito no sobrevive al cambio de dispositivo ni al paso de invitado a registrado | Vigente |
| SP-04 | Cierre de la transacción de venta | El pedido se confirma sin bloquear unidades | Vigente |
| SP-05 | Cobro y conciliación | Pago y pedido sin identificador común ni control de reintentos | Vigente (solo tarjeta) |
| SP-06 | Ejecución y seguimiento del pedido | La sucursal no recibe trabajo priorizado; el cliente no tiene estado consultable | **Reducida:** consulta y cancelación; sin alistamiento ni pedidos en riesgo |
| SP-07 | Identidad del comprador digital | El documento se captura sin normalizar ni resolver contra lealtad | **Reducida:** identidad del cliente y del Coordinador; sin lealtad |
| SP-08 | Consentimiento y registro del comportamiento | Formato cambiante, sin identificador de sesión ni verificación de consentimiento | **Reducida:** consentimiento y supresión; sin registro de comportamiento |

## 7. Características del producto

Las características C-17, C-18 y C-19 son **nuevas en la versión 2.0** (cambios CHG-004, CHG-002 y CHG-006).

| ID | Característica | Resuelve | Alcance |
|---|---|---|---|
| C-01 | Publicación de catálogo con control de precio | SP-01 | Vigente (incluye las existencias iniciales) |
| C-02 | Búsqueda y filtrado del catálogo | SP-01 | Vigente |
| C-03 | Disponibilidad calculada con umbral | SP-02 | Adaptada (una sola cifra; sin degradación por sucursal) |
| C-04 | Carrito persistente y fusionable | SP-03 | Vigente |
| C-05 | Sugerencia de productos complementarios | SP-03 | **Fuera de alcance** |
| C-06 | Confirmación de pedido con reserva de unidades | SP-04 | Vigente |
| C-07 | Redención de cupón de lealtad | SP-04 | Vigente, reducida a aplicar un código existente |
| C-08 | Cobro tokenizado con control de reintentos | SP-05 | Vigente (solo tarjeta) |
| C-09 | Comprobante y registro de venta | SP-05 | Adaptada (sin código de retiro) |
| C-10 | Consulta del estado del pedido | SP-06 | Vigente (sin notificaciones) |
| C-11 | Alistamiento y entrega en sucursal | SP-06 | **Fuera de alcance** |
| C-12 | Cancelación previa al pago | SP-06 | Adaptada |
| C-13 | Control de pedidos con hora de compromiso | SP-06 | **Fuera de alcance** |
| C-14 | Cuenta del cliente | SP-07 | Adaptada (sin vínculo con lealtad) |
| C-15 | Consentimiento revocable y supresión | SP-08 | Vigente |
| C-16 | Registro de comportamiento con formato estable | SP-08 | **Fuera de alcance** |
| C-17 | Cuenta interna del Coordinador con control de acceso | SP-07 | **Nueva** |
| C-18 | Consulta de ventas del Coordinador | SP-06 | **Nueva** |
| C-19 | Interfaz con el ERP (simulada) | SP-02, SP-04 | **Nueva** |

## 8. Casos de uso y EDT

### 8.1 Reglas de la EDT

La EDT de ComproYa en Línea tiene **como máximo 5 entregables**, se dibuja **en vertical** (el proyecto arriba, los entregables en una fila y sus hojas apiladas debajo de cada uno) y **no lleva un nivel de sprint**: el sprint es una etiqueta (S1 a S6) de cada hoja. Estructura: proyecto → entregable → hoja, donde la hoja es un caso de uso o un paquete de trabajo. **La hoja no lleva descripción en el diagrama**; su detalle vive en el diccionario de la EDT. El diagrama editable está en `docs/alcance/EDT_ComproYa.drawio`.

### 8.2 EDT vigente

Los códigos de hoja son nuevos (1.1.1, 1.1.2…). La última columna conserva el código que la hoja tenía en la versión 1.0 del canon.

| Código EDT | Hoja | Actor principal | Sprint | C | Código en la versión 1.0 |
|---|---|---|---|---|---|
| 1.1 | **Entregable: Catálogo digital** | — | — | — | 1.1 |
| 1.1.1 | CU-01 Publicación de producto en el catálogo | Coordinador de Canal Digital | S1 | C-01 | 1.1.1.1 |
| 1.1.2 | CU-02 Búsqueda de productos | Cliente digital | S1 | C-02 | 1.1.1.2 |
| 1.1.3 | CU-03 Consulta de disponibilidad | Cliente digital | S1 | C-03 | 1.1.1.3 |
| 1.1.4 | Paquete: Existencias del ERP (simulado) | Equipo de desarrollo | S1 | C-19 | Nuevo |
| 1.2 | **Entregable: Cuenta digital** | — | — | — | 1.2 |
| 1.2.1 | CU-04 Registro de cuenta | Cliente digital | S2 | C-14 | 1.2.1.1 |
| 1.2.2 | CU-05 Administración del consentimiento | Cliente digital · Oficial de Protección de Datos | S2 | C-15 | 1.2.1.2 |
| 1.2.3 | Paquete: Ingreso de la cuenta interna | Coordinador de Canal Digital | S6 | C-17 | Nuevo |
| 1.3 | **Entregable: Carrito y pedido** (une 1.3 Carrito y 1.4 Pedido de la versión 1.0) | — | — | — | 1.3 y 1.4 |
| 1.3.1 | CU-07 Administración del carrito | Cliente digital | S3 | C-04 | 1.3.1.1 |
| 1.3.2 | CU-09 Confirmación del pedido | Cliente digital | S4 | C-06 | 1.4.1.1 |
| 1.3.3 | CU-10 Aplicación de cupón de lealtad (reducida a un código existente) | Cliente digital | S4 | C-07 | 1.4.1.2 |
| 1.3.4 | Paquete: Reserva y liberación en el ERP (simulado) | Equipo de desarrollo | S4 | C-19 | Nuevo |
| 1.3.5 | CU-11 Consulta de pedidos y ventas (ampliado con la lista de ventas) | Cliente digital · Coordinador de Canal Digital | S6 | C-10, C-18 | 1.4.2.1 |
| 1.3.6 | CU-13 Cancelación del pedido (antes de pagar) | Cliente digital | S6 | C-12 | 1.4.2.3 |
| 1.4 | **Entregable: Pago** | — | — | — | 1.5 |
| 1.4.1 | CU-15 Pago con tarjeta | Cliente digital | S5 | C-08 | 1.5.1.1 |
| 1.4.2 | CU-17 Emisión del comprobante | Cliente digital | S5 | C-09 | 1.5.1.3 |
| 1.5 | **Entregable: Gerencia del proyecto** (transversal) | — | — | — | 1.6 |
| 1.5.1 | Paquete: Acta de constitución | Equipo de desarrollo | Transversal | — | 1.6.1 |
| 1.5.2 | Paquete: Plan de trabajo y backlog priorizado | Equipo de desarrollo | Transversal | — | 1.6.2 |
| 1.5.3 | Paquete: Seguimiento y control de sprints | Equipo de desarrollo | Transversal | — | 1.6.3 |
| 1.5.4 | Paquete: Cierre del proyecto | Equipo de desarrollo | Transversal | — | 1.6.4 |

**Casos de uso fuera de alcance** (no aparecen en la EDT): CU-06 Registro del comportamiento del cliente (v1.0: 1.2.1.3), CU-08 Consulta de productos complementarios (1.3.1.2), CU-12 Alistamiento y entrega en sucursal (1.4.2.2), CU-14 Supervisión de pedidos en riesgo (1.4.2.4) y CU-16 Pago con débito bancario (1.5.1.2). De los 17 casos de uso de la versión 1.0 quedan **12**: CU-01 a CU-05, CU-07, CU-09, CU-10, CU-11, CU-13, CU-15 y CU-17.

### 8.3 Trazabilidad cerrada

Todo sub-problema vigente tiene al menos una característica, toda característica vigente tiene al menos una hoja de la EDT, y toda hoja aparece abajo.

| Sub-problema | Características | Hojas de la EDT |
|---|---|---|
| SP-01 | C-01, C-02 | 1.1.1, 1.1.2 |
| SP-02 | C-03, C-19 | 1.1.3, 1.1.4 |
| SP-03 | C-04 | 1.3.1 |
| SP-04 | C-06, C-07, C-19 | 1.3.2, 1.3.3, 1.3.4 |
| SP-05 | C-08, C-09 | 1.4.1, 1.4.2 |
| SP-06 | C-10, C-12, C-18 | 1.3.5, 1.3.6 |
| SP-07 | C-14, C-17 | 1.2.1, 1.2.3 |
| SP-08 | C-15 | 1.2.2 |

La gerencia del proyecto (1.5.1 a 1.5.4) es transversal y no resuelve un sub-problema.

## 9. Calendario de sprints

| Sprint | Semanas | Hojas de la EDT | Casos de uso y paquetes |
|---|---|---|---|
| 1 | 1–2 | 1.1.1, 1.1.2, 1.1.3, 1.1.4 | CU-01, CU-02, CU-03 y existencias del ERP (simulado) |
| 2 | 3–4 | 1.2.1, 1.2.2 | CU-04, CU-05 |
| 3 | 5–6 | 1.3.1 | CU-07 |
| 4 | 7–8 | 1.3.2, 1.3.3, 1.3.4 | CU-09, CU-10 y reserva en el ERP (simulado) |
| 5 | 9–10 | 1.4.1, 1.4.2 | CU-15, CU-17 |
| 6 | 11–12 | 1.3.5, 1.3.6, 1.2.3 | CU-11 (ampliado), CU-13 e ingreso de la cuenta interna |

Seis sprints de dos semanas. La gerencia del proyecto es transversal. La versión 1.0 asignaba al sprint 6 la operación de sucursal (CU-11 a CU-14); en la versión 2.0 el sprint 6 trae la consulta de ventas, la cancelación y el ingreso interno.

## 10. Valores oficiales

Usar estas cifras exactas. No redondear, no inventar nuevas. La columna «Aplica» dice si la cifra rige en el alcance vigente.

**Del diagnóstico (versión 1.0, referencia histórica)**

| Valor | Cifra | Aplica |
|---|---|---|
| Sucursales con ERP centralizado (piloto) | 8 | No: el alcance vigente tiene **1** sucursal |
| Retraso de la disponibilidad publicada hoy | 12 a 24 horas | Referencia histórica |
| Sincronización actual con el ERP | Proceso por lotes, una vez cada noche | Referencia histórica |
| Registros sin correspondencia entre lealtad y canal | 8 % a 12 % | No (lealtad fuera de alcance) |
| Eventos de comportamiento diarios | 15.000 a 25.000 | No (registro de comportamiento fuera de alcance) |
| Meta de sobreventa | ≤ 0,5 % de los pedidos del mes | Sí; línea base sin medir |

**De los requisitos (versión 1.0)**

| Ámbito | Umbral | Aplica |
|---|---|---|
| Búsqueda del catálogo | P95 ≤ 1,5 s con hasta 40.000 productos publicados; desde 3 caracteres | Sí; sin medir |
| Disponibilidad publicada | Retraso ≤ 5 minutos frente al ERP | Sí; con el ERP simulado se calcula en cada consulta |
| Sucursal desincronizada | Más de 15 minutos sin sincronizar deshabilita el retiro | No (RN-04) |
| Publicación de un producto | Visible en el catálogo en ≤ 5 minutos | Sí |
| Registro de cambio de precio | Consultable durante 5 años | No (fuera de alcance) |
| Carrito entre dispositivos | Diferencia ≤ 30 segundos | Sí; sin medir |
| Productos complementarios | Hasta 4 | No (CU-08) |
| Confirmación del pedido | P95 ≤ 3 s; picos de 900 pedidos por hora; errores de servidor ≤ 0,5 % | Sí; sin medir |
| Descuento de cupón | Reflejado en ≤ 2 segundos | Sí; sin medir |
| Pago con tarjeta | Confirmación en ≤ 60 s; si falla, reserva liberada ≤ 15 minutos | Sí; el plazo de liberación no se ha medido |
| Pago con débito bancario | Sin confirmación en 30 minutos, el pedido se cancela | No (CU-16) |
| Comprobante | Código de retiro válido 5 días calendario; comprobante consultable 5 años | Código de retiro: No. Comprobante: Sí; sin medir |
| Conciliación pedido–pago–inventario | Diferencia diaria ≤ 0,1 % | No (fuera de alcance) |
| Notificación de cambio de estado | ≤ 5 minutos | No (fuera de alcance) |
| Descuento de inventario tras alistar | ≤ 5 minutos | No (CU-12) |
| Cancelación | Reserva liberada ≤ 5 minutos; reversión del cobro ≤ 24 horas | Reserva: Sí; sin medir. Reversión: No (sin reembolso) |
| Pedido en riesgo | 4 horas hábiles sin avanzar | No (CU-14) |
| Registro de comportamiento | Publicación ≤ 2 s por evento; pérdida ≤ 0,1 % | No (CU-06) |
| Consentimiento | Activar o revocar en ≤ 2 interacciones | Sí; sin medir |
| Privacidad | Anonimización ≤ 1 hora; supresión ≤ 72 horas | Supresión: Sí. Anonimización: No (sin registro de comportamiento) |

**Del alcance vigente (versión 2.0)**

| Valor | Cifra | Fuente |
|---|---|---|
| Sucursales | 1 | Alcance reducido (CHG-001) |
| Umbral de seguridad por producto | 5 unidades por defecto | Esquema de datos (RN-03) |
| Máximo de unidades de un producto por pedido | 10 unidades | Límite del servidor |
| Mínimo de caracteres de la búsqueda | 3 caracteres | Servidor (CU-02) |
| Duración de la sesión interna | 12 horas | Servidor (cuenta interna) |
| Ventas por página en la lista de ventas | 20 ventas | Servidor (CU-11 ampliado) |
| Ventas que cuentan | Pedidos pagados y vigentes (Pagado, En alistamiento, Listo para retiro, Entregado); no cuentan los cancelados | Servidor (C-18) |
| Días de la lista de ventas | Días de Colombia (UTC−5) | Servidor (C-18) |
| Usabilidad: un caso se cumple si | ≥ 80 % de los participantes lo cumple | Evaluación de usabilidad |
| Usabilidad: tiempo objetivo | 3 veces el tiempo medido por el equipo | Evaluación de usabilidad |
| Usabilidad: escala de dificultad | 1 a 7 | Evaluación de usabilidad |

## 11. Vocabulario

**Usar:** producto homologado · publicación de catálogo · precio digital · umbral de seguridad · unidades disponibles · existencias · reserva de unidades · identificador de correlación · pago con tarjeta · interfaz con el ERP (simulada) · cuenta interna · panel de administración (`/admin`) · paquete de trabajo · punto de venta (POS, la primera vez con la sigla explicada).

**Evitar (y su reemplazo):**

| No usar | Usar |
|---|---|
| SKU | producto / código homologado |
| PSE | pago con débito bancario (fuera de alcance) |
| API | interfaz |
| SaaS | plataforma contratada |
| token de tarjeta sin explicar | token emitido por la pasarela |
| checkout | confirmación del pedido |
| cross-sell | producto complementario / sugerencia (fuera de alcance) |
| stock | existencias / unidades |
| dummy, de mentira | simulada, ficticia |
| amigable, intuitivo, robusto, escalable, rápido | el umbral numérico correspondiente |

Los términos de la versión 1.0 *código de retiro*, *hora de compromiso*, *identificador de lealtad* y *formato de eventos* siguen siendo válidos, pero designan elementos que hoy están fuera de alcance.

## 12. Identificadores retirados y propios de los documentos de alcance

**Retirados.** Estos códigos vienen de semestres anteriores y **no deben aparecer nunca** fuera de la excepción de abajo: HU-01…HU-17, CA-XX.N, RNF-01…RNF-10, EP-01…EP-05, OBJ-01…OBJ-05, RD-01…RD-07, P-01…P-06 (con cero a la izquierda), F-01…F-06, S-01…S-12, story points. El identificador `P-n` sin cero (P-1 … P-17) identifica los mockups vigentes.

**Excepción de la versión 2.0 (decisión D-04).** Las plantillas 4 (Plan de gestión del alcance) y 5 (Declaración de alcance) del docente exigen una familia de identificadores. Se usan **solo dentro de esos dos documentos**, con las formas que la plantilla prescribe, y significan lo que esos documentos definen — no lo que significaban en semestres anteriores:

| Familia | Forma | Uso |
|---|---|---|
| Objetivos del alcance | OBJ-nn | Los cuatro objetivos específicos |
| Requisitos | REQ-nnn | REQ-001 a REQ-027 |
| Requisitos no funcionales | RNF-nnn | RNF-001 a RNF-007 |
| Backlog | PB-nnn | PB-001 a PB-018 |
| Criterios de aceptación | CA-nn | Por historia |
| Cambios de alcance | CHG-nnn | CHG-001 a CHG-006 |
| Entregables | E-nn | E-01 a E-05 |

Fuera de esos dos documentos, estas familias no se usan. Nota: OBJ-01…OBJ-04 coinciden en forma con identificadores retirados; si el docente prefiere evitar la coincidencia, se renombran (por ejemplo, OA-nn) sin otro cambio.

## 13. Historial de entregas

| Entrega | Estado | Nota |
|---|---|---|
| Planificación del proyecto — Parte 1 | Calificada 2.0 | Rechazada por: sin título, descripción sin contexto operativo, función problema incoherente, tablas sin introducción, ámbito no derivado del problema, EDT sin sprints ni casos de uso, hojas con descripción, sin diccionario, carrito/pago/pedido fragmentados |
| Planificación del proyecto — Entrega 2 | Corregida y entregada | Atiende los diez puntos del feedback. Es la base de la versión 1.0 de este canon |
| Modelo de requisitos — 1er Sprint (2 casos de uso) | Con problema abierto | Ver decisión D-01 |
| Plan de pruebas y resultados (28 casos: 10 de ruta, 10 de estado, 5 de integración, 3 de sistema) | Ejecutados el 2026-09-17 y el 2026-09-22 | Los tres casos de sistema (CU-04-01, CU-09-01, CU-09-02) quedaron desfasados frente a la interfaz actual |
| Evaluación de usabilidad del CU-02 (versión corta, 8 casos) | En curso | 2 sesiones realizadas; informe pendiente |
| Plan de gestión del alcance y Declaración de alcance (plantillas 4 y 5) | Versión 1.0, en revisión (2026-10-19) | Reflejan este canon en la versión 2.0; EDT en vertical con 5 entregables |

## 14. Decisiones abiertas

**D-01 — Los casos de uso entregados no corresponden al canon.** El documento de requisitos del primer sprint describe un inicio de sesión corporativo y una tarjeta de producto operada por un Asesor en tienda, que arma una cotización. Eso pertenece a la aplicación de sala, declarada fuera del alcance, y ninguno de los dos casos de uso existe en la EDT. Además, el enunciado excluía la autenticación, y el primer sprint del canon contiene CU-01, CU-02 y CU-03. Los mockups ya funcionan y el docente los revisa de forma aislada, de modo que no se rehace lo entregado. **Para todo lo que venga:** los casos de uso se toman del canon, con sus actores y su sprint. Si un mockup existente muestra la app de sala, se reinterpreta hacia el actor y la pantalla canónicos, o se produce uno nuevo.

**D-02 — Equipo de dos personas.** El canon no usa puntos de historia ni velocidad. Si el docente los pide, primero definir historias de usuario y agregarlas aquí. (Los documentos de alcance ya traen historias de usuario en el Product Backlog, sin puntos.)

**D-03 — Roles de Scrum.** Product Owner (Nicolás Santiago Cancimance Pabón) y Scrum Master (Duván Camilo Serrano Rojas) son una propuesta del equipo, no una asignación confirmada. Confirmar.

**D-04 — Identificadores de las plantillas frente a los retirados.** Ver la sección 12. Pendiente la confirmación del docente.

**D-05 — Base de datos desplegada.** La base desplegada conserva 9 sucursales y no tiene la cuenta interna ni su migración. Consolidarla en 1 sucursal y sembrar la cuenta interna exige confirmación explícita antes de tocarla.

**D-06 — Pruebas de sistema desfasadas.** CU-04-01, CU-09-01 y CU-09-02 verifican el flujo anterior (retiro con código). Hay que actualizarlas al flujo de venta con envío (PB-017).

**D-07 — Mediciones de rendimiento pendientes.** La búsqueda (P95 ≤ 1,5 s) y la confirmación del pedido (P95 ≤ 3 s) tienen umbral pero no medición (PB-016).

## 15. Cambios de la versión 2.0 frente a la 1.0

| Cambio | Qué cambia en el canon |
|---|---|
| CHG-001 Reducir el problema | Una sola sucursal con existencias unificadas; el ERP pasa a ser una interfaz simulada; salen mercadeo, estrategias de venta, tableros, logística, notificaciones y débito bancario (CU-06, CU-08, CU-12, CU-14, CU-16). De 17 casos de uso quedan 12 |
| CHG-002 Consulta de ventas | CU-11 se amplía con la lista de ventas del Coordinador (C-18); el sprint 6 deja la operación de sucursal |
| CHG-003 Venta digital con envío | La interfaz ofrece solo envío a domicilio y pago con tarjeta (ver `docs/modo-venta-digital.md`) |
| CHG-004 Ingreso de la cuenta interna | El Coordinador entra por `/admin` con cuenta propia (C-17); las funciones internas exigen su sesión; el alta de producto incluye las existencias |
| CHG-005 Ampliar las exclusiones | Despacho y retiro en sucursal, rastreo en tiempo real, conexión con el POS y otras 7 funciones |
| CHG-006 Rehacer la EDT | EDT en vertical con 5 entregables, sin nivel de sprint; la interfaz simulada del ERP entra como paquetes (C-19); el patrocinador es solo la Dirección de ComproYa |
