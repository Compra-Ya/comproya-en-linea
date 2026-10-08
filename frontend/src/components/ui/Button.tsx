import Link from "next/link";
import { Icon } from "./Icon";
import type { ButtonProps } from "./tipos";

// Botón único de todo el flujo (design/design-system/components/Button/README.md):
// reemplaza btn-primary, btn-primary-lg, btn-navy, btn-outline-red y btn-login.
// Una sola variante `primary` por pantalla; un botón deshabilitado no se explica solo,
// así que quien lo usa muestra el motivo al lado.
export function Button({
  variant = "primary",
  size = "md",
  full,
  loading,
  icon,
  iconRight,
  href,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const clases = ["cy-btn", `cy-btn-${variant}`, size === "lg" && "cy-btn-lg", full && "cy-btn-full", className]
    .filter(Boolean)
    .join(" ");
  const contenido = (
    <>
      {loading ? <span className="cy-spinner cy-spinner-btn" aria-hidden="true" /> : icon ? <Icon name={icon} /> : null}
      <span>{children}</span>
      {iconRight ? <Icon name={iconRight} /> : null}
    </>
  );

  if (href && !disabled) {
    return href.startsWith("/") ? (
      <Link className={clases} href={href}>
        {contenido}
      </Link>
    ) : (
      <a className={clases} href={href}>
        {contenido}
      </a>
    );
  }
  return (
    <button type="button" className={clases} aria-busy={loading ? true : undefined} {...rest} disabled={disabled || loading}>
      {contenido}
    </button>
  );
}
