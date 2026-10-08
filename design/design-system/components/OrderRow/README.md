# OrderRow

Un pedido en "Mis pedidos": número, fecha, sucursal, total, estado y la siguiente acción (A-19, UT-11).

## Qué aporta quien lo usa

`number`, `date`, `branch`, `total`, `status` (como en `OrderStatus`), `reason` (motivo de Cancelado o Pago fallido), `reservedUntil` (hora de vencimiento de la reserva), `payHref`, `receiptHref`, `onCancel`, `note` para reemplazar la nota por defecto.

## Acción por estado

| Estado | Acciones | Nota |
|---|---|---|
| Creado, pendiente de pago | Pagar · Cancelar pedido | Reserva hasta las HH:MM |
| Pagado | Ver comprobante y código de retiro · Cancelar pedido | — |
| En alistamiento | Ver comprobante y código de retiro | "Este pedido ya está en alistamiento y no se puede cancelar." |
| Listo para retiro | Ver comprobante y código de retiro (primary) | — |
| Entregado | — | — |
| Cancelado | — | El motivo en `reason` |
| Pago fallido | Pagar | El motivo en `reason` |

## Reglas

- "Cancelar pedido" solo antes del alistamiento (Creado y Pagado), como dice el brief.
- Sin sesión, la pantalla no lista nada: muestra un `Notice` "Inicia sesión para ver tus pedidos." con "Iniciar sesión".
