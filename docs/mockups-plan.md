# Plan de mockups — ComproYa en Línea

Este documento define, para cada uno de los 17 casos de uso del canon, la pantalla que le corresponde antes de que se produzca ningún mockup. La idea es correr `/design` de Claude Code contra esta lista completa, en el orden de sprint del canon, en vez de improvisar pantallas caso por caso — así el mockup nace ya con su código `P-n`, su actor y su sprint correctos, sin tener que reinterpretarlo después (que es justo lo que ya pasó una vez, según la decisión D-01 del canon: un mockup entregado no correspondía a los actores ni a los casos de uso del canon).

La numeración `P-n` sigue el formato de casos de uso que enseña la asignatura (Marco de la asignatura, sección 4: "mockup de pantalla, arriba de la tabla, identificada como P-1, P-2, P-3…"). No todos los casos de uso tienen pantalla propia — CU-06 es registro de comportamiento, instrumentación transversal sin una pantalla que el usuario opere directamente — así que la numeración salta ese caso y sigue siendo consistente con `docs/plan-de-trabajo.md`.

Cada fila indica también el tipo de caso de uso (Básico, Inclusión o Extensión), siguiendo la clasificación que pide la asignatura. La mayoría son Básicos porque cada uno entrega un resultado completo por sí mismo; se marcan como Inclusión o Extensión solo los que de verdad dependen de otro caso de uso, para no forzar relaciones que el canon no describe.

| P-n | Caso de uso | Actor | Sprint | Tipo |
|---|---|---|---|---|
| P-1 | CU-01 Publicación de producto en el catálogo | Coordinador de Canal Digital | 1 | Básico |
| P-2 | CU-02 Búsqueda de productos | Cliente digital | 1 | Básico |
| P-3 | CU-03 Consulta de disponibilidad por sucursal | Cliente digital | 1 | Básico |
| P-4 | CU-04 Registro de cuenta | Cliente digital | 2 | Básico |
| P-5 | CU-05 Administración del consentimiento | Cliente digital · Oficial de Protección de Datos | 2 | Básico |
| — | CU-06 Registro del comportamiento del cliente | Responsable de Lealtad · Analista de Datos | 2 | Básico (sin pantalla propia) |
| P-7 | CU-07 Administración del carrito | Cliente digital | 3 | Básico |
| P-8 | CU-08 Consulta de productos complementarios | Cliente digital · Analista de Marketing | 3 | Extensión de CU-07 |
| P-9 | CU-09 Confirmación del pedido | Cliente digital | 4 | Básico |
| P-10 | CU-10 Aplicación de cupón de lealtad | Cliente digital | 4 | Extensión de CU-09 |
| P-11 | CU-11 Consulta del estado del pedido | Cliente digital | 6 | Básico |
| P-12 | CU-12 Alistamiento y entrega en sucursal | Gerente de Tienda | 6 | Básico |
| P-13 | CU-13 Cancelación del pedido | Cliente digital | 6 | Extensión de CU-11 |
| P-14 | CU-14 Supervisión de pedidos en riesgo | Coordinador de Canal Digital | 6 | Básico |
| P-15 | CU-15 Pago con tarjeta | Cliente digital | 5 | Básico |
| P-16 | CU-16 Pago con débito bancario | Cliente digital | 5 | Básico |
| P-17 | CU-17 Emisión del comprobante | Cliente digital · Gerente de Tienda | 5 | Inclusión (requiere CU-15 o CU-16 completado) |

Sobre CU-15 y CU-16: el Marco de la asignatura (sección 4) da como ejemplo propio que un caso de pago se generalice en variantes concretas ("Pagar Reservación" en "Pagar con Tarjeta" y "Pagar con Transferencia"). Vale la pena modelar CU-15 y CU-16 con esa misma relación de generalización a partir de un caso abstracto "Pagar pedido" — sin que eso invente un caso de uso nuevo fuera de los 17 del canon, porque "Pagar pedido" no se documenta como entregable propio, solo como recurso de modelado para explicar por qué CU-15 y CU-16 comparten flujo.

## Orden sugerido para correr `/design`

1. Sprint 1 completo (P-1, P-2, P-3) — es el más simple porque no depende de sesión de usuario.
2. Sprint 2 (P-4, P-5) — depende de que exista el concepto de cuenta para poder dibujar los estados de sesión iniciada en las pantallas siguientes.
3. Sprint 3 a 6 en el orden del canon (P-7, P-8, P-9, P-10, P-15, P-16, P-17, P-11, P-12, P-13, P-14).

Cada mockup, al terminarlo, debería quedar acompañado de su análisis de usabilidad según las sub-características de ISO/IEC 9126 que usa la asignatura (comprensibilidad, facilidad de aprendizaje, operabilidad, atractividad, conformidad — Marco de la asignatura, sección 9), aunque ese análisis en sí es un paso posterior a este plan, no algo que se resuelva en la fase de diseño técnica.
