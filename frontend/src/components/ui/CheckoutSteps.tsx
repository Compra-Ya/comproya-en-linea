import { Enlace } from "./Enlace";
import { Icon } from "./Icon";
import { cx } from "./formato";
import type { CheckoutStepsProps } from "./tipos";

// Los 4 pasos de la compra con "Volver" explícito. Los nombres son los títulos de pantalla.
// A 390 px se resume en "Paso 2 de 4 · Datos y envío" sobre los círculos (en CSS).
const PASOS = ["Carrito", "Datos y envío", "Pago", "Pedido confirmado"];

export function CheckoutSteps({ current, back, className }: CheckoutStepsProps) {
  return (
    <div className={cx("cy-steps-wrap", className)}>
      {back ? (
        <Enlace className="cy-back" href={back.href}>
          <Icon name="arrow-left" size={18} />
          {back.label}
        </Enlace>
      ) : (
        <span />
      )}
      <p className="cy-steps-mobile">
        Paso {current} de 4 · <strong>{PASOS[current - 1]}</strong>
      </p>
      <ol className="cy-steps" aria-label="Progreso de la compra">
        {PASOS.map((nombre, i) => {
          const n = i + 1;
          const estado = n < current ? "done" : n === current ? "current" : "todo";
          return (
            <li key={nombre} className={`cy-step cy-step-${estado}`} aria-current={estado === "current" ? "step" : undefined}>
              <span className="cy-step-num" aria-hidden="true">
                {estado === "done" ? <Icon name="check" size={14} /> : n}
              </span>
              <span className="cy-step-label">
                {nombre}
                {estado === "done" ? <span className="cy-sr"> (completado)</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
