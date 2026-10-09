"use client";

import { AddedToCart } from "./AddedToCart";
import { Button } from "./Button";
import { Enlace } from "./Enlace";
import { Icon } from "./Icon";
import { ProductImage } from "./ProductImage";
import { cx, formatCOP, unidades } from "./formato";
import type { ProductCardProps } from "./tipos";

// Tarjeta del catálogo: foto grande, categoría, nombre, precio grande, unidades disponibles y "Agregar al
// carrito" con su confirmación en el mismo lugar (AddedToCart compacto). Agotado: botón deshabilitado con
// su motivo. Sin corazón, estrellas ni reseñas.
// Extensión: `onContinue` devuelve la tarjeta a su estado normal cuando la persona pulsa "Seguir comprando".
export function ProductCard({ name, category, price, units, image, href, onAdd, onContinue, state = "idle", addedQuantity, tooltipOpen, className }: ProductCardProps & { onContinue?: () => void }) {
  const agotado = units === 0;
  let accion;
  if (agotado) {
    accion = (
      <Button variant="primary" full disabled icon="cart-plus" disabledReason="Producto agotado: por ahora no hay unidades.">
        Agotado
      </Button>
    );
  } else if (state === "added") {
    accion = <AddedToCart quantity={addedQuantity || 1} compact onContinue={onContinue} />;
  } else {
    accion = (
      <Button
        variant="primary"
        full
        icon="cart-plus"
        loading={state === "adding"}
        onClick={onAdd}
        aria-label={state === "adding" ? undefined : `Agregar ${name} al carrito`}
        tooltip={`Agregar ${name} al carrito`}
        tooltipOpen={tooltipOpen}
      >
        {state === "adding" ? (
          "Agregando…"
        ) : (
          <>
            Agregar<span className="cy-pcard-long"> al carrito</span>
          </>
        )}
      </Button>
    );
  }
  return (
    <article className={cx("cy-pcard", agotado && "cy-pcard-soldout", className)}>
      <Enlace href={href || "#"} className="cy-pcard-link">
        <ProductImage src={image} alt={name} category={category} />
        {category ? <span className="cy-pcard-cat">{category}</span> : null}
        <h3 className="cy-pcard-name">{name}</h3>
      </Enlace>
      <p className="cy-pcard-price">{formatCOP(price)}</p>
      {units != null ? (
        <p className={cx("cy-pcard-units", agotado && "cy-pcard-units-out")}>
          {agotado ? "Sin unidades por ahora" : unidades(units, "unidad disponible", "unidades disponibles")}
        </p>
      ) : null}
      {state === "error" ? (
        <p className="cy-error" role="alert">
          <Icon name="alert" size={16} />
          No pudimos agregarlo. Inténtalo de nuevo.
        </p>
      ) : null}
      {accion}
    </article>
  );
}
