# CANON — ComproYa en Línea · Canal de Venta Digital B2C

**Fuente única de verdad del proyecto.** Cualquier entregable debe ser consistente con este archivo. Si un documento futuro necesita algo que no está aquí, primero se agrega aquí.

**Versión:** 1.0 · **Última entrega reflejada:** Planificación del proyecto — Entrega 2 (aprobada)

**Copia de trabajo.** Este archivo es una copia local, para que Claude Code lo tenga disponible sin depender de Claude Projects. El canon real y editable vive en Claude Projects — si algo cambia allá, actualizar esta copia en el mismo commit.

---

## 1. Identidad del proyecto

| Campo | Valor |
|---|---|
| Título del proyecto | ComproYa en Línea — Canal de Venta Digital B2C |
| Empresa | Tiendas ComproYa (cadena de retail) |
| Asignatura | Ingeniería de Software II · Universidad Central |
| Docente | Julio César Sierra González |
| Integrantes | Nicolás Santiago Cancimance Pabón · Duván Camilo Serrano Rojas |

## 2. Qué es el producto

Un canal de comercio electrónico **B2C propio** que reemplaza la plataforma contratada a un proveedor externo. Cubre: catálogo digital, disponibilidad por sucursal, cuenta del cliente, carrito, confirmación de pedido, pago, y ejecución y seguimiento del pedido hasta la entrega.

**El problema en una frase:** el canal digital vende inventario que no puede verificar y registra clientes que no puede identificar, porque opera desacoplado del ERP, del maestro de códigos homologados y del programa de lealtad.

## 3. Frontera del sistema

**Dentro:** publicación de catálogo, cálculo de disponibilidad, carrito, confirmación de pedido con reserva de unidades, orquestación de pago, gestión de pedidos, cuenta del cliente, consentimiento y registro de comportamiento.

**Fuera pero condicionante (el canal los consume, no los gobierna):**

| Sistema | Qué aporta al canal |
|---|---|
| ERP centralizado | Existencias por producto y sucursal, precio base, marca de sincronización. Recibe reserva de unidades, descuento de inventario y registro de venta |
| Maestro de códigos homologados | Código unificado, categoría y costo del producto |
| Programa de lealtad | Identificador de lealtad y cupones vigentes. Recibe la redención |
| Pasarela de pagos | Token de tarjeta, resultado de autorización, notificación de débito bancario |
| Operador logístico externo | Número de guía y estado de entrega |
| Plataforma contratada actual | Es el sistema a reemplazar |

**Fuera del alcance:** logística propia, campañas de mercadeo, tableros analíticos, catálogo de terceros, recomendación automática, devoluciones, facturación fiscal, y **la aplicación de sala para asesores en tienda**.

## 4. Actores canónicos

Usar estos nombres exactos. No inventar variantes ni sinónimos.

| Actor | Tipo | Qué hace en el canal |
|---|---|---|
| Cliente digital | Externo | Busca, arma su carrito, confirma pedido, paga, hace seguimiento y retira o recibe |
| Gerente de Tienda | Interno | Alista el pedido en su sucursal y lo entrega contra el código de retiro |
| Coordinador de Canal Digital | Interno (rol nuevo, aún sin asignar) | Publica productos, fija precio digital y supervisa los pedidos en riesgo |
| Analista de Marketing | Interno | Cura los productos complementarios y mide su aporte |
| Responsable de Lealtad | Interno | Garantiza que la cuenta digital quede vinculada al registro de lealtad correcto |
| Analista de Datos | Interno | Recibe el comportamiento del canal para construir el perfil del cliente |
| Oficial de Protección de Datos | Cumplimiento | Responde por el tratamiento de datos personales |
| Administrador del ERP | Interno | Sostiene la integración entre el canal y el ERP |
| Dirección (CEO, CFO, CTO) | Patrocinadores | Conversión, retorno y arquitectura |

Actores externos no humanos: **Pasarela de pagos**, **Operador logístico externo**, **ERP centralizado**, **Programa de lealtad**.

## 5. Reglas de negocio

| ID | Regla |
|---|---|
| RN-01 | Un producto solo puede venderse en línea si su código está homologado en el maestro y ha sido publicado explícitamente en el canal |
| RN-02 | El precio digital puede diferir del precio de sala, pero nunca puede ser inferior al costo registrado en el ERP sin aprobación de gerencia comercial |
| RN-03 | Las unidades que el canal ofrece equivalen al stock del ERP menos un umbral de seguridad por sucursal y menos las unidades ya reservadas por otros pedidos |
| RN-04 | Una sucursal que lleve más de 15 minutos sin sincronizar con el ERP no puede ofrecer retiro |
| RN-05 | Ningún pedido se cobra sin que las unidades hayan quedado reservadas en el ERP |
| RN-06 | ComproYa no almacena ni procesa datos de tarjeta: la captura ocurre en la pasarela y el canal solo recibe un token |
| RN-07 | Un cupón del programa de lealtad se redime una sola vez por pedido, incluso si el cliente reintenta la confirmación |
| RN-08 | El código de retiro es de un solo uso y vence a los 5 días calendario |
| RN-09 | Un pedido solo puede cancelarse mientras no haya iniciado su alistamiento en sucursal |
| RN-10 | Sin consentimiento activo del cliente, su comportamiento se registra de forma anónima, sin identificador de cliente |
| RN-11 | Una solicitud de supresión de datos personales debe ejecutarse dentro de las 72 horas siguientes |

## 6. Sub-problemas

| ID | Proceso | Disfunción (resumen) |
|---|---|---|
| SP-01 | Gobierno del catálogo digital | Publicar no es un acto controlado ni auditable, y depende de un rol técnico |
| SP-02 | Determinación de la disponibilidad | La cifra publicada viene del proceso nocturno y no descuenta umbral ni reservas |
| SP-03 | Sostenimiento de la intención de compra | El carrito no sobrevive al cambio de dispositivo ni al paso de invitado a registrado |
| SP-04 | Cierre de la transacción de venta | El pedido se confirma sin bloquear unidades |
| SP-05 | Cobro y conciliación | Pago y pedido sin identificador común ni control de reintentos |
| SP-06 | Ejecución y seguimiento del pedido | La sucursal no recibe trabajo priorizado; el cliente no tiene estado consultable |
| SP-07 | Identidad del comprador digital | El documento se captura sin normalizar ni resolver contra lealtad |
| SP-08 | Consentimiento y registro del comportamiento | Formato cambiante, sin identificador de sesión ni verificación de consentimiento |

## 7. Características del producto

| ID | Característica | Resuelve |
|---|---|---|
| C-01 | Publicación de catálogo con control de precio | SP-01 |
| C-02 | Búsqueda y filtrado del catálogo | SP-01 |
| C-03 | Disponibilidad calculada con umbral y degradación | SP-02 |
| C-04 | Carrito persistente y fusionable | SP-03 |
| C-05 | Sugerencia de productos complementarios | SP-03 |
| C-06 | Confirmación de pedido con reserva de unidades | SP-04 |
| C-07 | Redención de cupón de lealtad | SP-04 |
| C-08 | Cobro tokenizado con control de reintentos | SP-05 |
| C-09 | Comprobante, código de retiro y registro de venta | SP-05 |
| C-10 | Consulta del estado del pedido | SP-06 |
| C-11 | Alistamiento y entrega en sucursal | SP-06 |
| C-12 | Cancelación previa al alistamiento | SP-06 |
| C-13 | Control de pedidos con hora de compromiso | SP-06 |
| C-14 | Cuenta vinculada al programa de lealtad | SP-07 |
| C-15 | Consentimiento revocable y supresión | SP-08 |
| C-16 | Registro de comportamiento con formato estable | SP-08 |

## 8. Casos de uso y EDT

| Código EDT | Caso de uso | Actor principal | Entregable | Sprint | C |
|---|---|---|---|---|---|
| 1.1.1.1 | CU-01 Publicación de producto en el catálogo | Coordinador de Canal Digital | 1.1 Catálogo digital | 1 | C-01 |
| 1.1.1.2 | CU-02 Búsqueda de productos | Cliente digital | 1.1 Catálogo digital | 1 | C-02 |
| 1.1.1.3 | CU-03 Consulta de disponibilidad por sucursal | Cliente digital | 1.1 Catálogo digital | 1 | C-03 |
| 1.2.1.1 | CU-04 Registro de cuenta | Cliente digital | 1.2 Cuenta digital | 2 | C-14 |
| 1.2.1.2 | CU-05 Administración del consentimiento | Cliente digital · Oficial de Protección de Datos | 1.2 Cuenta digital | 2 | C-15 |
| 1.2.1.3 | CU-06 Registro del comportamiento del cliente | Responsable de Lealtad · Analista de Datos | 1.2 Cuenta digital | 2 | C-16 |
| 1.3.1.1 | CU-07 Administración del carrito | Cliente digital | 1.3 Carrito | 3 | C-04 |
| 1.3.1.2 | CU-08 Consulta de productos complementarios | Cliente digital · Analista de Marketing | 1.3 Carrito | 3 | C-05 |
| 1.4.1.1 | CU-09 Confirmación del pedido | Cliente digital | 1.4 Pedido | 4 | C-06 |
| 1.4.1.2 | CU-10 Aplicación de cupón de lealtad | Cliente digital | 1.4 Pedido | 4 | C-07 |
| 1.4.2.1 | CU-11 Consulta del estado del pedido | Cliente digital | 1.4 Pedido | 6 | C-10 |
| 1.4.2.2 | CU-12 Alistamiento y entrega en sucursal | Gerente de Tienda | 1.4 Pedido | 6 | C-11 |
| 1.4.2.3 | CU-13 Cancelación del pedido | Cliente digital | 1.4 Pedido | 6 | C-12 |
| 1.4.2.4 | CU-14 Supervisión de pedidos en riesgo | Coordinador de Canal Digital | 1.4 Pedido | 6 | C-13 |
| 1.5.1.1 | CU-15 Pago con tarjeta | Cliente digital | 1.5 Pago | 5 | C-08 |
| 1.5.1.2 | CU-16 Pago con débito bancario | Cliente digital | 1.5 Pago | 5 | C-08 |
| 1.5.1.3 | CU-17 Emisión del comprobante | Cliente digital · Gerente de Tienda | 1.5 Pago | 5 | C-09 |

**Entregable transversal 1.6 Gerencia del proyecto:** 1.6.1 Acta de constitución · 1.6.2 Plan de trabajo y backlog priorizado · 1.6.3 Seguimiento y control de sprints · 1.6.4 Cierre del proyecto.

**Estructura de la EDT:** proyecto → entregable → sprint → caso de uso. El caso de uso es el nodo hoja y **no lleva descripción** en el diagrama; su detalle vive en el diccionario.

## 9. Calendario de sprints

| Sprint | Semanas | Entregable | Casos de uso |
|---|---|---|---|
| 1 | 1–2 | 1.1 Catálogo digital | CU-01, CU-02, CU-03 |
| 2 | 3–4 | 1.2 Cuenta digital | CU-04, CU-05, CU-06 |
| 3 | 5–6 | 1.3 Carrito | CU-07, CU-08 |
| 4 | 7–8 | 1.4 Pedido (confirmación) | CU-09, CU-10 |
| 5 | 9–10 | 1.5 Pago | CU-15, CU-16, CU-17 |
| 6 | 11–12 | 1.4 Pedido (operación) | CU-11, CU-12, CU-13, CU-14 |

Seis sprints de dos semanas. La gerencia del proyecto es transversal.

## 10. Valores oficiales

Usar estas cifras exactas. No redondear, no inventar nuevas.

**Del diagnóstico**

| Valor | Cifra |
|---|---|
| Sucursales con ERP centralizado (piloto) | 8 |
| Retraso de la disponibilidad publicada hoy | 12 a 24 horas |
| Sincronización actual con el ERP | Proceso por lotes, una vez cada noche |
| Registros sin correspondencia entre lealtad y canal | 8 % a 12 % |
| Eventos de comportamiento diarios | 15.000 a 25.000 |
| Meta de sobreventa | ≤ 0,5 % de los pedidos del mes |

**De los requisitos**

| Ámbito | Umbral |
|---|---|
| Búsqueda del catálogo | P95 ≤ 1,5 s con hasta 40.000 productos publicados; desde 3 caracteres |
| Disponibilidad publicada | Retraso ≤ 5 minutos frente al ERP |
| Sucursal desincronizada | Más de 15 minutos sin sincronizar deshabilita el retiro |
| Publicación de un producto | Visible en el catálogo en ≤ 5 minutos |
| Registro de cambio de precio | Consultable durante 5 años |
| Carrito entre dispositivos | Diferencia ≤ 30 segundos |
| Productos complementarios | Hasta 4 |
| Confirmación del pedido | P95 ≤ 3 s; picos de 900 pedidos por hora; errores de servidor ≤ 0,5 % |
| Descuento de cupón | Reflejado en ≤ 2 segundos |
| Pago con tarjeta | Confirmación en ≤ 60 s; si falla, reserva liberada ≤ 15 minutos |
| Pago con débito bancario | Sin confirmación en 30 minutos, el pedido se cancela |
| Comprobante | Código de retiro válido 5 días calendario; comprobante consultable 5 años |
| Conciliación pedido–pago–inventario | Diferencia diaria ≤ 0,1 % |
| Notificación de cambio de estado | ≤ 5 minutos |
| Descuento de inventario tras alistar | ≤ 5 minutos |
| Cancelación | Reserva liberada ≤ 5 minutos; reversión del cobro ≤ 24 horas |
| Pedido en riesgo | 4 horas hábiles sin avanzar |
| Registro de comportamiento | Publicación ≤ 2 s por evento; pérdida ≤ 0,1 % |
| Consentimiento | Activar o revocar en ≤ 2 interacciones |
| Privacidad | Anonimización ≤ 1 hora; supresión ≤ 72 horas |

## 11. Vocabulario

**Usar:** producto homologado · publicación de catálogo · precio digital · umbral de seguridad · unidades disponibles publicadas · reserva de unidades · identificador de lealtad · código de retiro · hora de compromiso · identificador de correlación · plataforma contratada · pago con débito bancario · registro de comportamiento · formato de eventos.

**Evitar (y su reemplazo):**

| No usar | Usar |
|---|---|
| SKU | producto / código homologado |
| PSE | pago con débito bancario |
| API | interfaz |
| SaaS | plataforma contratada |
| token de tarjeta sin explicar | token emitido por la pasarela |
| checkout | confirmación del pedido |
| cross-sell | producto complementario / sugerencia |
| stock | existencias / unidades |
| amigable, intuitivo, robusto, escalable, rápido | el umbral numérico correspondiente |

## 12. Identificadores retirados

Estos códigos vienen de semestres anteriores y **no deben aparecer nunca**: HU-01…HU-17, CA-XX.N, RNF-01…RNF-10, EP-01…EP-05, OBJ-01…OBJ-05, RD-01…RD-07, P-01…P-06, F-01…F-06, S-01…S-12, story points.

## 13. Historial de entregas

| Entrega | Estado | Nota |
|---|---|---|
| Planificación del proyecto — Parte 1 | Calificada 2.0 | Rechazada por: sin título, descripción sin contexto operativo, función problema incoherente, tablas sin introducción, ámbito no derivado del problema, EDT sin sprints ni casos de uso, hojas con descripción, sin diccionario, carrito/pago/pedido fragmentados |
| Planificación del proyecto — Entrega 2 | Corregida y entregada | Atiende los diez puntos del feedback. Es la base de este canon |
| Modelo de requisitos — 1er Sprint (2 casos de uso) | Con problema abierto | Ver decisión D-01 |

## 14. Decisiones abiertas

**D-01 — Los casos de uso entregados no corresponden al canon.** El documento de requisitos del primer sprint describe un inicio de sesión corporativo y una tarjeta de producto operada por un Asesor en tienda, que arma una cotización. Eso pertenece a la aplicación de sala, declarada fuera del alcance, y ninguno de los dos casos de uso existe en la EDT. Además, el enunciado excluía la autenticación, y el primer sprint del canon contiene CU-01, CU-02 y CU-03.

Los mockups ya funcionan y el docente los revisa de forma aislada, de modo que no se rehace lo entregado. **Para todo lo que venga:** los casos de uso se toman del canon, con sus actores y su sprint. Si un mockup existente muestra la app de sala, se reinterpreta hacia el actor y la pantalla canónicos, o se produce uno nuevo.

**D-02 — Equipo de dos personas.** El canon no usa puntos de historia ni velocidad. Si el docente los pide, primero definir historias de usuario y agregarlas aquí.
