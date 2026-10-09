"use client";

import { useId } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { InfoTip } from "./InfoTip";
import { cx } from "./formato";
import type { CouponFieldProps } from "./tipos";

// Cupón de lealtad opcional en "Datos y envío" (la función avanzada de la prueba, UT-12). Un solo mensaje a
// la vez; "aplicado" solo después de validar en el servidor, con el descuento real.
export function CouponField({ value, onChange, onApply, onRemove, status = "idle", appliedText, errorText, tipOpen, id: idProp, className }: CouponFieldProps) {
  const generado = useId();
  const id = idProp ?? generado;
  const idMensaje = `${id}-msg`;
  let mensaje;
  if (status === "applied") {
    mensaje = (
      <p id={idMensaje} className="cy-coupon-ok" role="status">
        <Icon name="check-circle" size={16} />
        {appliedText || "Cupón aplicado."}
      </p>
    );
  } else if (status === "invalid") {
    mensaje = (
      <p id={idMensaje} className="cy-error" role="alert">
        <Icon name="alert" size={16} />
        {errorText || "Ese cupón no existe o ya venció. Revisa el código o continúa sin cupón."}
      </p>
    );
  } else {
    mensaje = (
      <p id={idMensaje} className="cy-hint">
        Cada cupón se usa una sola vez por pedido.
      </p>
    );
  }
  return (
    <div className={cx("cy-coupon", className)}>
      <div className="cy-label-row">
        <label htmlFor={id} className="cy-label">
          <Icon name="ticket" size={16} /> Cupón de lealtad<span className="cy-optional"> (opcional)</span>
        </label>
        <InfoTip term="un cupón de lealtad" tip="Código de descuento del programa de lealtad de ComproYa. Se usa una vez por pedido." open={tipOpen} />
      </div>
      <div className="cy-coupon-row">
        <input
          id={id}
          className="cy-input"
          placeholder="Escribe tu código"
          value={value}
          autoComplete="off"
          aria-invalid={status === "invalid" ? true : undefined}
          aria-describedby={idMensaje}
          readOnly={status === "applied"}
          onChange={(e) => onChange?.(e.target.value)}
        />
        {status === "applied" ? (
          <Button variant="secondary" onClick={onRemove} tooltip="Quitar el cupón de este pedido">
            Quitar
          </Button>
        ) : (
          <Button variant="secondary" loading={status === "checking"} onClick={onApply}>
            {status === "checking" ? "Validando…" : "Aplicar"}
          </Button>
        )}
      </div>
      {mensaje}
    </div>
  );
}
