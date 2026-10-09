"use client";

import { Button } from "./Button";
import { Icon } from "./Icon";
import { cx, unidades } from "./formato";
import type { AddedToCartProps } from "./tipos";

// Confirmación amable que reemplaza al botón "Agregar al carrito" justo donde se pulsó:
// "Agregamos 2 unidades a tu carrito", con "Ver carrito" y "Seguir comprando".
export function AddedToCart({ quantity, cartHref = "/carrito", continueHref, onContinue, compact, className }: AddedToCartProps) {
  const q = quantity || 1;
  return (
    <div className={cx("cy-added", compact && "cy-added-compact", className)} role="status">
      <p className="cy-added-title">
        <Icon name="check-circle" size={18} />
        <span>Agregamos {unidades(q, "unidad", "unidades")} a tu carrito</span>
      </p>
      <div className="cy-added-actions">
        <Button variant="secondary" size="sm" href={cartHref} icon="cart">
          Ver carrito
        </Button>
        <Button variant="ghost" size="sm" onClick={onContinue} href={continueHref}>
          Seguir comprando
        </Button>
      </div>
    </div>
  );
}
