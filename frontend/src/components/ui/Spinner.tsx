import { cx } from "./formato";
import type { SpinnerProps } from "./tipos";

// Indicador de trabajo en curso, siempre con una frase que dice qué pasa ("Estamos confirmando tu pago…").
// Para esperas de página usa Skeleton; para esperas largas, Notice progress.
export function Spinner({ label, className }: SpinnerProps) {
  return (
    <span className={cx("cy-spinner-wrap", className)} role="status">
      <span className="cy-spinner" aria-hidden="true" />
      {label ? <span className="cy-spinner-label">{label}</span> : <span className="cy-sr">Cargando</span>}
    </span>
  );
}
