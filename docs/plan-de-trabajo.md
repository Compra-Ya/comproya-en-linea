# Plan de trabajo de ejecución — ComproYa en Línea

Este plan traduce el calendario de sprints del canon (sección 9) en tareas de ingeniería concretas. No sustituye el "Plan de trabajo y backlog priorizado" que pide la EDT del canon como entregable 1.6.2 de gerencia del proyecto — es el plan de ejecución técnica que Claude Code sigue para construir el sistema, sprint por sprint, en el mismo orden que ya está aprobado en el canon.

El orden que se sigue aquí es el que pidió el usuario: primero una fase de diseño con todos los mockups, después bootstrap de infraestructura, y solo entonces la implementación sprint por sprint con despliegue continuo.

## Fase 0 — Diseño y bootstrap (antes del sprint 1)

Esta fase tiene dos frentes que no dependen uno del otro y se pueden trabajar en paralelo.

**Frente A — Mockups de los 17 casos de uso.** Se hacen todos antes de tocar código de producto, usando `/design` de Claude Code y siguiendo exactamente la lista de `docs/mockups-plan.md` (actor, sprint y tipo de caso de uso ya asignados ahí, tomados del canon). Esto tiene una ventaja adicional fuera de la ingeniería: el mismo mockup, con su código `P-n`, es el que exige el formato de casos de uso de la asignatura (Marco de la asignatura, sección 4) — un solo trabajo sirve para el entregable académico y para la construcción real.

**Frente B — Bootstrap de infraestructura.** Se deja GCP y el pipeline de despliegue funcionando antes del primer sprint de producto, para que cada sprint termine con algo desplegado y no con código que solo corre en local. Los pasos concretos están en `docs/despliegue-gcp.md`; en resumen: proyecto de GCP, Cloud SQL, Artifact Registry, y el flujo de GitHub Actions hacia Cloud Run.

## Fase 1 — Sprint 1 · Catálogo digital (semanas 1-2)

Construye el módulo `catalogo` (sub-problemas SP-01 y SP-02) y no requiere autenticación — el canon excluye login en este sprint (decisión D-01).

| Caso de uso | Actor | Tareas de backend | Tareas de frontend |
|---|---|---|---|
| CU-01 Publicación de producto en el catálogo | Coordinador de Canal Digital | Endpoint de alta/edición de producto; valida RN-01 (código homologado + publicación explícita) y RN-02 (precio digital ≥ costo) | Pantalla de publicación (mockup P-1) |
| CU-02 Búsqueda de productos | Cliente digital | Endpoint de búsqueda con índice `pg_trgm`; cumplir P95 ≤ 1,5 s desde 3 caracteres | Pantalla de catálogo con buscador (mockup P-2) |
| CU-03 Consulta de disponibilidad por sucursal | Cliente digital | Endpoint que aplica RN-03 (existencias ERP − umbral − reservas) y RN-04 (sucursal desincronizada > 15 min no ofrece retiro) | Selector de sucursal en la ficha de producto (mockup P-3) |

Al cerrar el sprint, correr `backend/prisma/seed.ts` (ya construido) contra la base de datos de la nube para tener catálogo real de partida, y desplegar.

## Fase 2 — Sprint 2 · Cuenta digital (semanas 3-4)

Construye el módulo `cuenta` (sub-problemas SP-07 y SP-08). Aquí sí entra autenticación — es su primer punto de aparición en el canon.

| Caso de uso | Actor | Tareas de backend | Tareas de frontend |
|---|---|---|---|
| CU-04 Registro de cuenta | Cliente digital | Registro con JWT propio; vincula la cuenta al identificador de lealtad (C-14) contra `AdaptadorLealtadSimulado` | Pantalla de registro/login (mockup P-4) |
| CU-05 Administración del consentimiento | Cliente digital · Oficial de Protección de Datos | Activar/revocar consentimiento en ≤ 2 interacciones; endpoint de solicitud de supresión (RN-11, ≤ 72 h) | Pantalla de privacidad (mockup P-5) |
| CU-06 Registro del comportamiento del cliente | Responsable de Lealtad · Analista de Datos | Cola de eventos (sección 8 de `arquitectura.md`); si no hay consentimiento, se registra anónimo sin identificador de cliente (RN-10) | No tiene pantalla propia — instrumentación en el resto del frontend |

## Fase 3 — Sprint 3 · Carrito (semanas 5-6)

Construye el módulo `carrito` (sub-problema SP-03).

| Caso de uso | Actor | Tareas de backend | Tareas de frontend |
|---|---|---|---|
| CU-07 Administración del carrito | Cliente digital | Carrito persistente en base de datos, fusionable al iniciar sesión; sincronización entre dispositivos con diferencia ≤ 30 s | Pantalla de carrito (mockup P-7) |
| CU-08 Consulta de productos complementarios | Cliente digital · Analista de Marketing | Endpoint de sugerencias, máximo 4 productos (tope del canon) | Módulo de sugerencias dentro del carrito (mockup P-8) |

## Fase 4 — Sprint 4 · Pedido, confirmación (semanas 7-8)

Construye el módulo `pedido` (sub-problema SP-04).

| Caso de uso | Actor | Tareas de backend | Tareas de frontend |
|---|---|---|---|
| CU-09 Confirmación del pedido | Cliente digital | Reserva de unidades atómica contra `AdaptadorErpSimulado` (RN-05); P95 ≤ 3 s, errores de servidor ≤ 0,5 % | Pantalla de confirmación (mockup P-9) |
| CU-10 Aplicación de cupón de lealtad | Cliente digital | Redención de cupón única por pedido incluso con reintentos (RN-07); reflejado en ≤ 2 s | Campo de cupón en la confirmación (mockup P-10) |

## Fase 5 — Sprint 5 · Pago (semanas 9-10)

Construye el módulo `pago` (sub-problema SP-05). El Marco de la asignatura (sección 4) sugiere modelar CU-15 y CU-16 como especialización de un caso abstracto "Pagar pedido" — se sigue esa idea a nivel de mockup y de diseño de la interfaz `PuertoPasarelaDePagos`, sin que eso invente un caso de uso nuevo fuera del canon.

| Caso de uso | Actor | Tareas de backend | Tareas de frontend |
|---|---|---|---|
| CU-15 Pago con tarjeta | Cliente digital | Integración Stripe (sandbox), token únicamente (RN-06); confirmación ≤ 60 s, si falla libera reserva ≤ 15 min | Pantalla de pago con tarjeta (mockup P-15) |
| CU-16 Pago con débito bancario | Cliente digital | Simulación de notificación de débito; sin confirmación en 30 min cancela el pedido | Pantalla de pago con débito bancario (mockup P-16) |
| CU-17 Emisión del comprobante | Cliente digital · Gerente de Tienda | Genera código de retiro (un solo uso, vence a 5 días — RN-08) y comprobante consultable 5 años | Pantalla de comprobante (mockup P-17) |

## Fase 6 — Sprint 6 · Pedido, operación (semanas 11-12)

Cierra el módulo `pedido` con el sub-problema SP-06.

| Caso de uso | Actor | Tareas de backend | Tareas de frontend |
|---|---|---|---|
| CU-11 Consulta del estado del pedido | Cliente digital | Endpoint de estado contra `AdaptadorLogisticaSimulado`; notificación de cambio ≤ 5 min | Pantalla de seguimiento (mockup P-11) |
| CU-12 Alistamiento y entrega en sucursal | Gerente de Tienda | Validación del código de retiro; descuento de inventario tras alistar ≤ 5 min | Panel de alistamiento (mockup P-12) |
| CU-13 Cancelación del pedido | Cliente digital | Solo permitida antes de iniciar alistamiento (RN-09); libera reserva ≤ 5 min, reversión del cobro ≤ 24 h | Botón de cancelación en seguimiento (mockup P-13) |
| CU-14 Supervisión de pedidos en riesgo | Coordinador de Canal Digital | Job que marca "en riesgo" a las 4 horas hábiles sin avanzar (C-13) | Panel de pedidos en riesgo (mockup P-14) |

## Transversal — Gerencia del proyecto (1.6 del canon)

No es una fase con fecha propia: corre en paralelo a los seis sprints, igual que lo describe la EDT del canon. Aquí solo se anota su relación con este repositorio: el historial de commits y los tableros de sprint (issues de GitHub, uno por CU) son el soporte de 1.6.3 Seguimiento y control de sprints, y este mismo repositorio, con su historial de versiones, es insumo directo para "Gestión de la configuración" del corte III de la asignatura.

## Qué queda fuera de este plan

Todo lo que el canon marca como fuera de alcance sigue fuera: logística propia, campañas de mercadeo, tableros analíticos, catálogo de terceros, recomendación automática, devoluciones, facturación fiscal y la aplicación de sala para asesores en tienda. Si en algún sprint aparece la tentación de construir alguna de estas — típicamente disfrazada de "mientras tanto hagamos también..." — es una señal de desviación del canon, no una mejora.
