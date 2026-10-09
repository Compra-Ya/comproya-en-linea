import { Icon } from "./Icon";
import { cx } from "./formato";
import type { BadgeProps } from "./tipos";

// Etiqueta corta de estado: el texto siempre está visible y el color nunca es la única señal.
// Para estados de pedido usa OrderStatus.
export function Badge({ tone = "neutral", icon, children, className }: BadgeProps) {
  return (
    <span className={cx("cy-badge", `cy-badge-${tone}`, className)}>
      {icon ? <Icon name={icon} size={14} /> : <span className="cy-badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
