import { Icon } from "./Icon";
import { cx } from "./formato";
import type { CardProps } from "./tipos";

// Contenedor de sección con borde `line`, radio `radius-lg` y título opcional con ícono. Separa con borde,
// no con sombra; sin borde lateral de color.
export function Card({ title, icon, aside, children, className }: CardProps) {
  return (
    <section className={cx("cy-card", className)}>
      {title ? (
        <div className="cy-card-head">
          <h2 className="cy-card-title">
            {icon ? <Icon name={icon} size={20} /> : null}
            {title}
          </h2>
          {aside || null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
