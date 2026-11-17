# Pruebas de sistema del sprint 2 (HU-113, HU-114, HU-115)

Generada por `e2e/capturas/verificar-sprint2.mjs` el 2026-11-17. Capturas en `design/verificacion-sprint2/`.

| Id | Comprobación | Resultado | Detalle |
|---|---|---|---|
| PS-01-pre | se crearon 3 pedidos y se reservaron 6 unidades por la interfaz con el ERP | OK | reservadas: 6 |
| PS-01a | Mis pedidos muestra los 2 pedidos del cliente con su estado | OK |  |
| PS-01b | Mis pedidos no muestra el pedido de otro cliente | OK |  |
| PS-01c | solo el pedido sin pagar ofrece «Cancelar pedido» (1 botón de 2 pedidos) | OK | botones: 1 |
| PS-01d | el pedido pagado explica que ya no se puede cancelar desde la pantalla | OK |  |
| PS-01e | sin sesión la API de pedidos responde 401 | OK | HTTP 401 |
| PS-01f | con la sesión de otro cliente la API rechaza el pedido ajeno | OK | HTTP 403 |
| PS-02a | cancelar un pedido sin pagar lo deja Cancelado | OK | CANCELLED |
| PS-02b | al cancelar se liberan sus 2 unidades reservadas (quedan 4 reservadas) | OK | reservadas: 4 |
| PS-02c | la cancelación queda en la auditoría | OK |  |
| PS-02d | la API rechaza cancelar un pedido pagado (400) y no lo cambia | OK | HTTP 400, estado PAID |
| PS-02e | la API rechaza cancelar un pedido ajeno (403) y no lo cambia | OK | HTTP 403, estado CREATED |
| PS-02f | cancelar dos veces el mismo pedido se rechaza (400) | OK | HTTP 400 |
| PS-03a | la lista de ventas incluye el pedido pagado | OK | ventas: 56 |
| PS-03b | un pedido Cancelado no cuenta como venta por defecto | OK | pedido 122 fuera de la lista |
| PS-04 | sin errores de página en el recorrido | OK |  |
