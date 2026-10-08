import Link from "next/link";
import { Icon } from "./Icon";
import type { CheckoutStepsProps } from "./tipos";

// Progreso de los cuatro pasos de la compra, con "Volver" explícito (A-05, UT-03).
// Los nombres de los pasos son los títulos de las pantallas.
const PASOS_CANON = ["Carrito", "Confirmar pedido", "Pago", "Comprobante"];

export function CheckoutSteps({ current, steps, back, className }: CheckoutStepsProps) {
  const PASOS = steps && steps.length === 4 ? steps : PASOS_CANON;
  return (
    <div className={["cy-steps-wrap", className].filter(Boolean).join(" ")}>
      {back ? (
        <Link className="cy-back" href={back.href}>
          <Icon name="chevron-left" size={16} />
          {back.label}
        </Link>
      ) : null}
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
