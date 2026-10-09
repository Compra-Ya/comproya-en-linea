"use client";

import { useId } from "react";
import { Icon } from "./Icon";
import { cx } from "./formato";
import type { CheckboxProps } from "./tipos";

// Casilla de 20 px con etiqueta clicable (consentimiento del registro). La etiqueta es una frase completa;
// si hay error, va debajo con ícono.
export function Checkbox({ id: idProp, label, error, className, ...resto }: CheckboxProps) {
  const generado = useId();
  const id = idProp ?? generado;
  return (
    <div className={cx("cy-check", className)}>
      <input type="checkbox" id={id} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-err` : undefined} {...resto} />
      <label htmlFor={id}>{label}</label>
      {error ? (
        <p id={`${id}-err`} className="cy-error">
          <Icon name="alert" size={16} />
          {error}
        </p>
      ) : null}
    </div>
  );
}
