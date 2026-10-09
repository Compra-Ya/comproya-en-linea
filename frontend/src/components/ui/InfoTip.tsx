"use client";

import { Icon } from "./Icon";
import { Tooltip } from "./Tooltip";
import { cx } from "./formato";
import type { InfoTipProps } from "./tipos";

// Botón "?" junto a un término dudoso, con su explicación en una línea. Solo en "unidades disponibles",
// "cupón de lealtad", "pasarela de pagos" y términos que una persona sin contexto podría no entender.
export function InfoTip({ term, tip, children, open, placement, className }: InfoTipProps) {
  return (
    <span className={cx("cy-infotip", className)}>
      {children ? <span>{children}</span> : null}
      <Tooltip label={tip} open={open} placement={placement}>
        <button type="button" className="cy-infotip-btn" aria-label={`¿Qué es ${term || "esto"}?`}>
          <Icon name="help" size={16} />
        </button>
      </Tooltip>
    </span>
  );
}
