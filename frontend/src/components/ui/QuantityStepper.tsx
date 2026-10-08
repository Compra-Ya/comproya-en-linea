import { Icon } from "./Icon";

// Cantidad con botones que se anuncian y muestran su ayuda (design/design-system/components/
// QuantityStepper/README.md). En el mínimo "Disminuir" se deshabilita; para quitar el producto se usa "Quitar".
export interface QuantityStepperProps {
  value: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  className?: string;
}

export function QuantityStepper({ value, onChange, min = 1, max, label, className }: QuantityStepperProps) {
  const set = (v: number) => onChange?.(v);
  return (
    <div className={["cy-stepper", className].filter(Boolean).join(" ")} role="group" aria-label={label ?? "Cantidad"}>
      <button type="button" aria-label="Disminuir cantidad" title="Disminuir cantidad" disabled={value <= min} onClick={() => set(value - 1)}>
        <Icon name="minus" size={16} />
      </button>
      <span aria-live="polite">{value}</span>
      <button type="button" aria-label="Aumentar cantidad" title={max != null && value >= max ? `Máximo ${max} unidades` : "Aumentar cantidad"} disabled={max != null && value >= max} onClick={() => set(value + 1)}>
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}
