import { Enlace } from "./Enlace";
import { Icon } from "./Icon";
import { cx } from "./formato";
import type { ShippingSummaryProps } from "./tipos";

// Dirección y teléfono de envío en Pago y en Pedido confirmado. "Cambiar" vuelve a Datos y envío.
export function ShippingSummary({ name, address, city, notes, phone, editHref, title, className }: ShippingSummaryProps) {
  return (
    <section className={cx("cy-ship", className)} aria-label="Dirección de envío">
      <div className="cy-ship-head">
        <h2>
          <Icon name="map-pin" size={18} />
          {title || "Enviamos a"}
        </h2>
        {editHref ? (
          <Enlace className="cy-link toque" href={editHref}>
            Cambiar
          </Enlace>
        ) : null}
      </div>
      <p className="cy-ship-name">{name}</p>
      <p>{`${address}, ${city}`}</p>
      {notes ? <p className="cy-ship-notes">{notes}</p> : null}
      {phone ? (
        <p className="cy-ship-phone">
          <Icon name="phone" size={16} />
          {phone}
        </p>
      ) : null}
    </section>
  );
}
