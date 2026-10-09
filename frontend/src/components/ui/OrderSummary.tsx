import { Icon } from "./Icon";
import { ProductImage } from "./ProductImage";
import { cx, formatCOP, unidades } from "./formato";
import type { OrderSummaryProps } from "./tipos";

// Resumen del pedido con la acción principal del paso (children). Muestra los valores que devuelve el
// servidor, sin recalcular. A la derecha en escritorio (fijo al desplazar); debajo en celular.
export function OrderSummary({ itemsCount, subtotal, discount, discountLabel, shippingLabel, total, items, note, noteIcon, secure, title, totalLabel, children, className }: OrderSummaryProps) {
  return (
    <section className={cx("cy-summary", className)} aria-label={title || "Resumen del pedido"}>
      <h2 className="cy-summary-title">{title || "Resumen del pedido"}</h2>
      {items?.length ? (
        <ul className="cy-sum-items">
          {items.map((it, i) => (
            <li key={i}>
              <ProductImage src={it.image} alt={it.name} size="mini" />
              <span className="cy-sum-item-name">
                {it.name}
                <small>{unidades(it.quantity, "unidad", "unidades")}</small>
              </span>
              <span>{formatCOP(it.lineTotal)}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="cy-sum-row">
        <span>Productos</span>
        <span>{String(itemsCount || 0)}</span>
      </div>
      <div className="cy-sum-row">
        <span>Subtotal</span>
        <span>{formatCOP(subtotal)}</span>
      </div>
      {discount ? (
        <div className="cy-sum-row cy-sum-discount">
          <span>{discountLabel || "Descuento por cupón"}</span>
          <span>- {formatCOP(discount)}</span>
        </div>
      ) : null}
      {shippingLabel ? (
        <div className="cy-sum-row">
          <span>Envío</span>
          <span>{shippingLabel}</span>
        </div>
      ) : null}
      <div className="cy-sum-row cy-sum-total">
        <span>{totalLabel || "Total"}</span>
        <span>{formatCOP(total)}</span>
      </div>
      {note ? (
        <p className="cy-sum-note">
          <Icon name={noteIcon || "clock"} size={16} />
          {note}
        </p>
      ) : null}
      {children ? <div className="cy-summary-actions">{children}</div> : null}
      {secure ? (
        <p className="cy-sum-secure">
          <Icon name="lock" size={16} />
          Pagas con tarjeta en la pasarela segura. ComproYa nunca ve tu tarjeta.
        </p>
      ) : null}
    </section>
  );
}
