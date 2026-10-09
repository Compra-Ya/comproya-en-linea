"use client";

import { Icon } from "./Icon";
import { Tooltip } from "./Tooltip";
import { cx } from "./formato";
import type { IconButtonProps } from "./tipos";

// Botón de solo ícono (flechas, cantidad, pausa, cerrar): 44 × 44 px, siempre con nombre accesible
// (label, un verbo) y tooltip. Si hay espacio para texto visible, usa Button con ícono.
export function IconButton({ icon, label, tooltip, tooltipOpen, placement, align, variant = "secondary", className, ...resto }: IconButtonProps) {
  const boton = (
    <button type="button" className={cx("cy-iconbtn", `cy-iconbtn-${variant}`, className)} aria-label={label} {...resto}>
      <Icon name={icon} />
    </button>
  );
  return (
    <Tooltip label={tooltip || label} open={tooltipOpen} placement={placement} align={align} describe={false}>
      {boton}
    </Tooltip>
  );
}
