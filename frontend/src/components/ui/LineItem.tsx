"use client";

import { Icon } from "./Icon";
import { ProductImage } from "./ProductImage";
import { QuantityStepper } from "./QuantityStepper";
import { Tooltip } from "./Tooltip";
import { cx, formatCOP, unidades } from "./formato";
import type { LineItemProps } from "./tipos";

// Fila de producto: foto, nombre, precio unitario ("cada uno"), cantidad, total de la línea y "Quitar"
// (ícono de papelera, texto visible y tooltip). `lineTotal` viene del servidor; si no llega, precio × cantidad.
// A 390 px la cantidad y el total pasan bajo el nombre (en CSS). `readOnly` en Pago y Pedido confirmado.
export function LineItem({ name, image, unitPrice, quantity, max, lineTotal, readOnly, compact, onQuantity, onRemove, tipOpen, className }: LineItemProps) {
  return (
    <div className={cx("cy-li", compact && "cy-li-compact", className)}>
      <ProductImage src={image} alt={name} size="thumb" />
      <div className="cy-li-info">
        <p className="cy-li-name">{name}</p>
        <p className="cy-li-unit">{formatCOP(unitPrice)} cada uno</p>
        {readOnly ? <p className="cy-li-unit">{unidades(quantity, "unidad", "unidades")}</p> : null}
      </div>
      {readOnly ? null : (
        <QuantityStepper value={quantity} max={max} onChange={onQuantity} label={`Cantidad de ${name}`} className="cy-li-stepper" tipOpen={tipOpen === "minus" || tipOpen === "plus" ? tipOpen : undefined} />
      )}
      <div className="cy-li-end">
        <p className="cy-li-total">{formatCOP(lineTotal != null ? lineTotal : unitPrice * quantity)}</p>
        {readOnly ? null : (
          <Tooltip label={`Quitar ${name} del carrito`} open={tipOpen === "remove"} placement="bottom" align="end">
            <button type="button" className="cy-li-remove" onClick={onRemove}>
              <Icon name="trash" size={18} />
              Quitar
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
