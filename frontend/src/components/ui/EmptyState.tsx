import { Icon } from "./Icon";
import { cx } from "./formato";
import type { EmptyStateProps } from "./tipos";

// Estado vacío: ilustración sencilla (ícono grande en un círculo naranja claro, o una foto redonda),
// título, una frase y la acción para salir de ahí. Nunca una pantalla vacía sin salida.
export function EmptyState({ icon = "cart", imageSrc, title, text, action, children, className }: EmptyStateProps & { children?: React.ReactNode }) {
  return (
    <div className={cx("cy-empty", className)}>
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="cy-empty-img" src={imageSrc} alt="" />
      ) : (
        <div className="cy-empty-art" aria-hidden="true">
          <Icon name={icon} size={44} />
        </div>
      )}
      <h2 className="cy-empty-title">{title}</h2>
      {text ? <p className="cy-empty-text">{text}</p> : null}
      {action || children ? (
        <div className="cy-empty-actions">
          {action}
          {children}
        </div>
      ) : null}
    </div>
  );
}
