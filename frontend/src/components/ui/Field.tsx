"use client";

import { useId, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Icon } from "./Icon";
import { InfoTip } from "./InfoTip";
import { cx } from "./formato";
import type { FieldProps } from "./tipos";

// Campo de formulario con etiqueta visible asociada (htmlFor), ayuda en línea y error en el propio campo.
// El error conserva lo escrito, va debajo del campo con ícono y se enlaza con aria-describedby. El
// placeholder es un ejemplo, nunca la etiqueta. Usa autoComplete real para que el navegador ayude.
export function Field({
  id: idProp,
  label,
  hint,
  error,
  valid,
  icon,
  optional,
  labelTip,
  tipOpen,
  as = "input",
  options,
  className,
  ...resto
}: FieldProps & { rows?: number; tipOpen?: boolean }) {
  const generado = useId();
  const id = idProp ?? generado;
  const idAyuda = `${id}-hint`;
  const idError = `${id}-err`;
  const descrito = cx(hint && idAyuda, error && idError) || undefined;
  const comun = { id, "aria-invalid": error ? true : undefined, "aria-describedby": descrito, className: "cy-input" };

  let control;
  if (as === "select") {
    control = (
      <select {...(resto as unknown as SelectHTMLAttributes<HTMLSelectElement>)} {...comun}>
        {(options ?? []).map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    );
  } else if (as === "textarea") {
    control = <textarea rows={3} {...(resto as unknown as TextareaHTMLAttributes<HTMLTextAreaElement>)} {...comun} className="cy-input cy-textarea" />;
  } else {
    control = <input type="text" {...(resto as InputHTMLAttributes<HTMLInputElement>)} {...comun} />;
  }

  return (
    <div className={cx("cy-field", error && "cy-field-error", className)}>
      <div className="cy-label-row">
        <label htmlFor={id} className="cy-label">
          {label}
          {optional ? <span className="cy-optional"> (opcional)</span> : null}
        </label>
        {labelTip ? <InfoTip term={label} tip={labelTip} open={tipOpen} /> : null}
      </div>
      <div className={cx("cy-control", icon && "cy-control-icon")}>
        {icon ? <Icon name={icon} size={18} /> : null}
        {control}
        {valid ? (
          <span className="cy-valid" aria-hidden="true">
            <Icon name="check" size={18} />
          </span>
        ) : null}
      </div>
      {error ? (
        <p id={idError} className="cy-error">
          <Icon name="alert" size={16} />
          {error}
        </p>
      ) : null}
      {hint ? (
        <p id={idAyuda} className="cy-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
