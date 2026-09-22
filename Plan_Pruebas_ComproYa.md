# Plan de Pruebas — ComproYa en Línea (Caso de Uso 1 y Caso de Uso 2)

> **Nota:** al igual que con los resultados, la versión que sigue al pie de la letra el formato de caso de prueba funcional del docente (Anexo 1 de "6. PRUEBAS DE SOFTWARE.pdf") es **`Plan_Pruebas_ComproYa.docx`**, en la raíz del repo. Este `.md` queda como referencia rápida en texto plano y para el historial de git.

Este documento define, **antes de su ejecución**, los 28 casos de prueba de los dos casos de uso ya llevados a diseño detallado en "Diseño UML ComproYa": el Caso de Uso 1 (Registro de cuenta con aprobación de la política de datos personales, CU-04 + CU-05) y el Caso de Uso 2 (Compra completa en el canal digital, CU-07/CU-09/CU-15/CU-16/CU-17). Aplica la metodología del material "Aseguramiento de calidad — Pruebas de software" del docente: pruebas de unidad de ruta (derivadas del diagrama de actividad) y basadas en estado (derivadas del diagrama de estados), pruebas de integración ascendente (bottom-up, derivadas del diagrama de clases) y pruebas del sistema de caja negra (derivadas del caso de uso).

**Distribución pedida por el docente (aclarada en clase, Sep-22):** 10 pruebas de Ruta, 10 basadas en Estado, mínimo 3 de Integración, 3 de Sistema. Este plan cubre 10 / 10 / 5 / 3 = 28 (Integración por encima del mínimo, cobertura ya cerrada en la primera ronda de implementación).

Cada caso lleva un ID (`PR-xx` ruta, `PE-xx` estado, `PI-xx` integración, `CU-xx-nn` sistema), el módulo de la EDT del canon al que pertenece, sus precondiciones, los pasos con los datos de entrada a usar, y el resultado esperado de la aplicación — sin veredicto ni fecha de ejecución, que se documentan aparte en `Resultados_Pruebas_ComproYa.md`/`.docx` una vez corridos de verdad.

---

## 1. Pruebas de unidad — prueba de ruta

Derivadas del diagrama de actividad de cada caso de uso (Figura 5 para el Caso de Uso 1, Figura 12 para el Caso de Uso 2, en "Diseño UML ComproYa"): una ruta por cada camino independiente del algoritmo, sobre transacciones sencilla de la entidad dominante del caso de uso (`Consentimiento` en el Caso de Uso 1, `Pago`/`Pedido` en el Caso de Uso 2).

| ID | Módulo | Precondiciones | Pasos de la prueba | Resultado esperado |
|---|---|---|---|---|
| PR-01 | 1.2 Cuenta Digital | Existe un `Cliente` con documento `CC2001` ya registrado. | `GestorDeRegistro.validarDuplicado("CC2001")`; luego `GestorDeRegistro.registrarCliente()` con el mismo documento. | `validarDuplicado()` devuelve `true`; `registrarCliente()` lanza el error E-1 ("Ya existe una cuenta registrada con ese documento"); no se crea ninguna fila nueva de `Cliente`/`Cuenta`. |
| PR-02 | 1.2 Cuenta Digital | Documento nuevo, sin cuenta previa. | `GestorDeRegistro.registrarCliente()` con documento nuevo; el cliente rechaza la política llamando `GestorDeConsentimiento.revocarConsentimiento()`; se registra un evento de comportamiento. | `Cuenta.estado = activa`; `Consentimiento.status = REVOCADO`; el evento posterior se guarda sin `id_cliente` (RN-10). |
| PR-03 | 1.2 Cuenta Digital | Documento nuevo; identificador de lealtad válido y existente (`LEALTAD-123456`). | `GestorDeConsentimiento.otorgarConsentimiento(customerId, "LEALTAD-123456")`. | `Consentimiento.status = ACTIVO`; se crea el `IdentificadorLealtad` y `Customer.loyaltyId` queda vinculado. |
| PR-04 | 1.2 Cuenta Digital | Documento nuevo, acepta la política, sin identificador de lealtad. | `GestorDeConsentimiento.otorgarConsentimiento(customerId)` sin `loyaltyId`. | `Consentimiento.status = ACTIVO`; `Customer.loyaltyId` permanece `null`, no se crea `IdentificadorLealtad`. |
| PR-05 | 1.4 Pedido | Dos sucursales con disponibilidad del mismo producto: una sincronizada hace 20 minutos, otra recién sincronizada. | `VerificadorDeDisponibilidad.validarSincronizacion()` sobre cada sucursal. | `false` para la sucursal desincronizada (RN-04); `true` para la otra — el resto del flujo sigue disponible. |
| PR-06 | 1.4 Pedido | Disponibilidad real de 15 unidades (RN-03: 20 ERP − 5 umbral). | `ReservaUnidades.reservar(productId, branchId, 999)`. | Devuelve `false` (sin lanzar excepción); no queda ninguna unidad reservada; el llamador puede notificar E-1 sin bloquear el cobro. |
| PR-07 | 1.5 Pago | Pedido confirmado con reserva de unidades exitosa (RN-05). | `OrquestadorDePago.procesarPago(customerId, orderId, "tarjeta", eventoSimulado)` con `payment_intent.payment_failed`. | `Pago.status = FAILED`; la reserva se libera; no se genera `Comprobante`. |
| PR-08 | 1.5 Pago | Pedido confirmado con reserva de unidades exitosa. | `OrquestadorDePago.procesarPago(customerId, orderId, "tarjeta", eventoSimulado)` con `checkout.session.completed`; `GeneradorDeComprobante.generar()`. | Se crea `Comprobante` con código de retiro vigente 5 días calendario (RN-08); `Pago.status = CONFIRMED`; `Pedido.status = PAID`. |
| PR-09 | 1.5 Pago | Pedido confirmado; pago con débito bancario iniciado, sin confirmación. | Se adelanta `Payment.createdAt` 31 minutos; `PagoConDebitoBancario.esperarConfirmacion()`. | Devuelve `false`; `Pago.status = FAILED`; `Pedido.status = CANCELLED`; la reserva se libera. |
| PR-10 | 1.5 Pago | Pedido confirmado con reserva de unidades exitosa; intento de pago con débito bancario ya iniciado, dentro del plazo de 30 minutos. | `PagoService.notificarDebito(orderId, true)` — equivalente a la notificación real de confirmación de la pasarela de débito bancario simulada (CU-16, paso 2). | `Pago.status = CONFIRMED`; `Pedido.status = PAID`; el comprobante queda disponible para emitirse (CU-17) — cierra la única ruta independiente del diagrama de actividad del Caso de Uso 2 que no tenía ficha propia. |

---

## 2. Pruebas de unidad — prueba basada en estado

Derivadas del diagrama de estados de cada entidad dominante (Figura 6, `Consentimiento`, para el Caso de Uso 1; Figura 13, `Pedido`, para el Caso de Uso 2): una prueba por cada transición declarada, más los intentos de transición no declarada desde un estado terminal.

| ID | Objeto | Precondiciones (estado inicial) | Pasos de la prueba | Resultado esperado (estado final) |
|---|---|---|---|---|
| PE-01 | Consentimiento | Pendiente (recién registrado el cliente). | `GestorDeConsentimiento.otorgarConsentimiento(customerId)`. | `Consentimiento.status = ACTIVO`. |
| PE-02 | Consentimiento | Activo. | `GestorDeConsentimiento.revocarConsentimiento(customerId)`. | `Consentimiento.status = REVOCADO`. |
| PE-03 | Consentimiento | Revocado. | `GestorDeConsentimiento.solicitarSupresion(customerId)`; `ejecutarSupresionesPendientes()` dentro de las 72 horas (RN-11). | `Consentimiento.status = SUPRIMIDO`. |
| PE-04 | Consentimiento | Activo. | Solicitud directa de supresión (sin pasar por Revocado) dentro de las 72 horas. | `Consentimiento.status = SUPRIMIDO`. |
| PE-05 | Consentimiento | Suprimido (terminal). | `GestorDeConsentimiento.otorgarConsentimiento(customerId)` — transición no declarada. | El sistema rechaza la operación (`ConflictException`); el estado permanece `SUPRIMIDO`. |
| PE-06 | Pedido | Creado, con sesión de tarjeta ya iniciada. | Webhook `checkout.session.completed` llega a `PagoService.manejarEventoStripe()`. | `Pedido.status = PAID`. |
| PE-07 | Pedido | Creado, alistamiento no iniciado. | `PedidoService.cancelar(orderId)` (RN-09). | `Pedido.status = CANCELLED`; la reserva de unidades se libera. |
| PE-08 | Pedido | Creado, con sesión de tarjeta iniciada. | Evento `payment_intent.payment_failed` llega a `PagoService.manejarEventoStripe()`. | `Pedido.status = PAYMENT_FAILED`. |
| PE-09 | Pedido | En alistamiento (`PREPARING`). | `PedidoService.marcarListoParaRetiro(orderId)`. | `Pedido.status = READY_FOR_PICKUP`. |
| PE-10 | Pedido | Listo para retiro, con código de retiro vigente. | (i) `PedidoService.retirarConCodigo(orderId, pickupCode, ahora)` dentro de los 5 días; (ii) caso de frontera: un día después del vencimiento (RN-08). | (i) `Pedido.status = DELIVERED`; (ii) se rechaza con error, el pedido permanece `READY_FOR_PICKUP`. |

---

## 3. Pruebas de integración

Estrategia ascendente (bottom-up), derivada del diagrama de clases detallado (Figura 4 para el Caso de Uso 1, Figura 11 para el Caso de Uso 2): se prueba primero el módulo atómico, luego sus combinaciones, hasta el grupo final.

| ID | Módulo | Grupo / clases integradas | Pasos de la prueba | Resultado esperado |
|---|---|---|---|---|
| PI-01 | 1.2 Cuenta Digital | Ninguna — módulo atómico de la primera capa. | `new Cuenta()` y `activar()`. | `Cuenta.estado` pasa de `"pendiente"` a `"activa"` sin necesitar ninguna otra clase. |
| PI-02 | 1.2 Cuenta Digital | Grupo 2 (Cliente + Cuenta). | `GestorDeRegistro.registrarCliente(dto)`. | Se crean un `Cliente` y una `Cuenta` relacionados 1:1 (mismo `id`). |
| PI-03 | 1.2 Cuenta Digital | Grupo 3 (Cliente + Consentimiento), con `PoliticaDatos` simulada. | `GestorDeConsentimiento.otorgarConsentimiento()`. | El `Consentimiento` creado referencia correctamente la versión de política simulada. |
| PI-04 | 1.4 Pedido | Grupo 4 (Pedido), con `CarritoService` y `CatalogoService` sustituidos por dobles de prueba. | `PedidoService.confirmar(customerId, dto)`. | Total calculado correctamente (`15000 × 2 = 30000`); se solicita la reserva con los parámetros correctos. |
| PI-05 | 1.5 Pago | Grupo 5 (final) — Pedido + Pago, con `Token` y la pasarela simulados. | `OrquestadorDePago.procesarPago()` con evento simulado `checkout.session.completed`. | Se crea un `Pago` (`CONFIRMED`) vinculado 1:1 con su `Token`; `Pedido.status = PAID`. |

---

## 4. Pruebas del sistema (caja negra, end-to-end)

Derivadas directamente del caso de uso, ejecutadas contra la aplicación real (frontend + backend + Postgres reales) con Playwright — sin mocks. Un camino de éxito por caso de uso como mínimo; el Caso de Uso 2 agrega además su camino de fallo por ser el que integra más reglas de negocio críticas y el que deja pasar dinero real.

| ID | Módulo | Caso de uso | Precondiciones | Pasos de la prueba | Resultado esperado |
|---|---|---|---|---|---|
| CU-04-01 | 1.2 Cuenta Digital | Caso de Uso 1 — CU-04 Registro de cuenta + CU-05 Administración del consentimiento | Ninguna — documento, correo y contraseña nuevos, sin cuenta previa. | 1. Registro en `/registro` (P-4) con datos nuevos, confirmar "Crear cuenta". 2. El sistema redirige a `/privacidad` (P-5), consentimiento Pendiente. 3. Activar el interruptor de consentimiento, sin identificador de lealtad. | Se crea Cliente/Cuenta y un Consentimiento Pendiente tras el registro; tras activar el interruptor, `GET /cuenta/consentimiento` responde `active: true`; insignia "Consentimiento activo" visible. |
| CU-09-01 | 1.4 Pedido / 1.5 Pago | Caso de Uso 2 — CU-09 + CU-15 + CU-17 (camino de éxito) | Cliente digital con sesión activa y consentimiento activo; carrito con un producto homologado y publicado; sucursal de retiro sincronizada hace menos de 15 minutos (RN-04). | 1. Confirmar el pedido desde `/pedido/confirmar` — reserva de unidades (RN-03) y bloqueo del cobro hasta reserva confirmada (RN-05). 2. Pagar con tarjeta de aprobación de Stripe (`4242...`) en Stripe Checkout real (sandbox). 3. La pasarela aprueba (webhook real `checkout.session.completed`). | El pedido queda Pagado; se genera el Comprobante con código de retiro válido 5 días calendario (RN-08), consultable en `/comprobante/:orderId`; las unidades reservadas permanecen descontadas en el ERP. |
| CU-09-02 | 1.4 Pedido / 1.5 Pago | Caso de Uso 2 — CU-09 + CU-15 + CU-17 (camino de fallo) | Cliente digital con un carrito confirmado y una reserva de unidades ya creada en el ERP. | 1. Pagar con la tarjeta de rechazo de Stripe (`4000000000000002`). 2. La pasarela rechaza la autorización, visible en Stripe Checkout. 3. Se expira la misma Checkout Session con la API real de Stripe (`sessions.expire`), disparando el webhook real `checkout.session.expired`. | El pedido no queda pagado (`PAYMENT_FAILED`); no se emite comprobante; las unidades reservadas vuelven a estar disponibles. |

---

## Resumen de la distribución

| Categoría | Cantidad | Mínimo pedido por el docente |
|---|---|---|
| 1. Ruta | 10 (PR-01 a PR-10) | 10 |
| 2. Estado | 10 (PE-01 a PE-10) | 10 |
| 3. Integración | 5 (PI-01 a PI-05) | 3 |
| 4. Sistema | 3 (CU-04-01, CU-09-01, CU-09-02) | 3 |
| **Total** | **28** | **26** |

Los resultados de la ejecución real de estos 28 casos, con veredicto, evidencia y fecha, están en `Resultados_Pruebas_ComproYa.md`/`.docx`. La versión narrada, organizada por caso de uso y con las capturas embebidas, está en `Informe_Pruebas_ComproYa.docx`.
