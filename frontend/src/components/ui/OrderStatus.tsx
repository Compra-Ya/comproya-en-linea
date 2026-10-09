import { Badge } from "./Badge";
import type { BadgeProps, IconName, OrderStatusKey, OrderStatusProps } from "./tipos";

// Estado del pedido en palabras, con ícono y tono fijos. Un pedido se cancela solo antes de empezar el
// alistamiento. Si el servidor agrega un estado de envío ("En camino"), se agrega aquí con su palabra exacta.
export const ORDER_STATUS: Record<OrderStatusKey, { label: string; tone: BadgeProps["tone"]; icon: IconName; explain: string }> = {
  creado: { label: "Pendiente de pago", tone: "warn", icon: "clock", explain: "Creaste el pedido y falta pagarlo con tarjeta." },
  pagado: { label: "Pagado", tone: "info", icon: "check", explain: "Recibimos tu pago. Pronto empezamos a alistar tu pedido." },
  "en-alistamiento": { label: "En alistamiento", tone: "info", icon: "package", explain: "Estamos preparando tu pedido para enviarlo." },
  entregado: { label: "Entregado", tone: "ok", icon: "check-circle", explain: "Tu pedido llegó a la dirección de envío." },
  cancelado: { label: "Cancelado", tone: "neutral", icon: "x", explain: "Este pedido se canceló y no se cobró." },
  "pago-fallido": { label: "Pago fallido", tone: "danger", icon: "alert", explain: "El pago con tarjeta no se completó." },
};

export function OrderStatus({ status, className }: OrderStatusProps) {
  const s = ORDER_STATUS[status] ?? ORDER_STATUS.creado;
  return (
    <Badge tone={s.tone} icon={s.icon} className={className}>
      {s.label}
    </Badge>
  );
}
