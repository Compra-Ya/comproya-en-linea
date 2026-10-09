"use client";

import { useState } from "react";
import { IconButton } from "./IconButton";
import { cx } from "./formato";
import type { QuantityStepperProps } from "./tipos";

// Selector de cantidad con botones de 44 px y tooltips con verbo. En el mínimo "Disminuir" se deshabilita
// (para sacar el producto se usa "Quitar"); en el máximo, "Aumentar" se deshabilita con su motivo.
// Controlado (value + onChange) o no controlado (defaultValue).
export function QuantityStepper({ value, defaultValue, onChange, min = 1, max, hint, label, tipOpen, className }: QuantityStepperProps) {
  const [interno, setInterno] = useState(defaultValue ?? value ?? 1);
  const actual = onChange ? (value ?? 1) : interno;
  const fijar = (v: number) => (onChange ? onChange(v) : setInterno(v));
  const enMinimo = actual <= min;
  const enMaximo = max != null && actual >= max;
  return (
    <div className={cx("cy-stepper-wrap", className)}>
      <div className="cy-stepper" role="group" aria-label={label || "Cantidad"}>
        <IconButton
          icon="minus"
          variant="plain"
          label="Disminuir cantidad"
          tooltip={enMinimo ? `Disminuir cantidad (mínimo ${min})` : "Disminuir cantidad"}
          disabled={enMinimo}
          tooltipOpen={tipOpen === "minus"}
          onClick={() => fijar(actual - 1)}
        />
        <output aria-live="polite" className="cy-stepper-value">
          {actual}
        </output>
        <IconButton
          icon="plus"
          variant="plain"
          label="Aumentar cantidad"
          tooltip={enMaximo ? "Llegaste al máximo por pedido" : "Aumentar cantidad"}
          disabled={enMaximo}
          tooltipOpen={tipOpen === "plus"}
          onClick={() => fijar(actual + 1)}
        />
      </div>
      {hint ? <p className="cy-hint">{hint}</p> : null}
    </div>
  );
}
