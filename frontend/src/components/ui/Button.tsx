"use client";

import type { AnchorHTMLAttributes } from "react";
import { Enlace } from "./Enlace";
import { Icon } from "./Icon";
import { Tooltip } from "./Tooltip";
import { cx } from "./formato";
import type { ButtonProps } from "./tipos";

// Botón único de todas las acciones: verbo + objeto, ícono de apoyo, tooltip que precisa sobre qué actúa.
// Un botón deshabilitado siempre dice por qué (disabledReason, debajo del botón). loading cambia el texto
// a gerundio y anuncia aria-busy. Con href se pinta un enlace con forma de botón.
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
  tooltip,
  tooltipOpen,
  disabledReason,
  disabled,
  ...resto
}: ButtonProps) {
  const clases = cx("cy-btn", `cy-btn-${variant}`, size === "lg" && "cy-btn-lg", size === "sm" && "cy-btn-sm", full && "cy-btn-full", className);
  const interior = (
    <>
      {loading ? <span className="cy-spinner cy-spinner-btn" aria-hidden="true" /> : icon ? <Icon name={icon} /> : null}
      <span>{children}</span>
      {iconRight ? <Icon name={iconRight} /> : null}
    </>
  );

  let elemento =
    href && !disabled ? (
      <Enlace href={href} className={clases} {...(resto as unknown as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {interior}
      </Enlace>
    ) : (
      <button type="button" className={clases} aria-busy={loading ? true : undefined} {...resto} disabled={disabled || loading}>
        {interior}
      </button>
    );

  if (tooltip) {
    elemento = (
      <Tooltip label={tooltip} open={tooltipOpen} block={full}>
        {elemento}
      </Tooltip>
    );
  }
  if (disabled && disabledReason) {
    return (
      <div className={cx("cy-btn-with-reason", full && "cy-btn-full")}>
        {elemento}
        <p className="cy-btn-reason">
          <Icon name="info" size={16} />
          {disabledReason}
        </p>
      </div>
    );
  }
  return elemento;
}
