"use client";

import { Button } from "./Button";
import { Icon } from "./Icon";
import { ORDER_STATUS, OrderStatus } from "./OrderStatus";
import { ProductImage } from "./ProductImage";
import { cx, formatCOP } from "./formato";
import type { OrderRowProps } from "./tipos";

// Tarjeta de un pedido en "Mis pedidos": número, fecha, estado en palabras, cantidad de productos, total,
// ciudad de envío, explicación del estado y la siguiente acción. "Cancelar pedido" solo se muestra si quien
// lo usa pasa `onCancel` (cancelar solo antes del alistamiento).
export function OrderRow({ number, date, status, itemsCount, total, city, images, reason, note, payHref, viewHref, onCancel, className }: OrderRowProps) {
  const info = ORDER_STATUS[status] ?? ORDER_STATUS.creado;
  const acciones = [];
  if (status === "creado" || status === "pago-fallido") {
    acciones.push(
      <Button key="pagar" variant="primary" href={payHref || "#"} icon="card">
        Pagar
      </Button>,
    );
  }
  if (status === "pagado" || status === "en-alistamiento" || status === "entregado") {
    acciones.push(
      <Button key="ver" variant="secondary" href={viewHref || "#"} icon="receipt">
        Ver pedido confirmado
      </Button>,
    );
  }
  if (onCancel && (status === "creado" || status === "pagado")) {
    acciones.push(
      <Button key="cancelar" variant="ghost-danger" onClick={onCancel}>
        Cancelar pedido
      </Button>,
    );
  }
  const nota = note ?? (status === "en-alistamiento" ? "Ya empezamos a alistarlo, así que no se puede cancelar." : undefined);
  return (
    <article className={cx("cy-order", className)}>
      <div className="cy-order-head">
        <div>
          <h3 className="cy-order-num">Pedido #{number}</h3>
          <p className="cy-order-date">{date}</p>
        </div>
        <OrderStatus status={status} />
      </div>
      {images ? (
        <div className="cy-order-thumbs">
          {images.slice(0, 4).map((src, i) => (
            <ProductImage key={i} src={src} alt="" size="mini" />
          ))}
        </div>
      ) : null}
      <dl className="cy-order-meta">
        <div>
          <dt>Productos</dt>
          <dd>{String(itemsCount)}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>{formatCOP(total)}</dd>
        </div>
        <div>
          <dt>Envío a</dt>
          <dd>{city}</dd>
        </div>
      </dl>
      <p className={cx("cy-order-explain", (status === "cancelado" || status === "pago-fallido") && "cy-order-explain-alert")}>
        <Icon name={status === "pago-fallido" ? "alert" : "info"} size={16} />
        {reason || info.explain}
      </p>
      {nota ? <p className="cy-order-note">{nota}</p> : null}
      {acciones.length ? <div className="cy-order-actions">{acciones}</div> : null}
    </article>
  );
}
