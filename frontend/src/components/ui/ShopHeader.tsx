"use client";

import Link from "next/link";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { formatoCOP } from "./formato";
import type { IconName, ShopHeaderProps } from "./tipos";

// Cabecera de tienda: la misma en todas las pantallas (A-02, UT-06). `compact` (confirmar
// pedido, pago, comprobante) quita la barra superior y el buscador. Ninguna cifra escrita a
// mano: el número de sucursales con retiro solo se muestra si quien lo usa lo conoce (A-12).
const NAVEGACION: Array<{ id: NonNullable<ShopHeaderProps["active"]>; etiqueta: string; href: string; icono: IconName }> = [
  { id: "catalogo", etiqueta: "Catálogo", href: "/", icono: "search" },
  { id: "carrito", etiqueta: "Carrito", href: "/carrito", icono: "cart" },
  { id: "pedidos", etiqueta: "Mis pedidos", href: "/pedidos", icono: "receipt" },
  { id: "cuenta", etiqueta: "Mi cuenta", href: "/privacidad", icono: "user" },
];

export function ShopHeader({
  variant = "full",
  active,
  cartCount = 0,
  cartTotal,
  customerName,
  logoutHref,
  onLogout,
  branchesWithPickup,
  query,
  onSearch,
  className,
}: ShopHeaderProps) {
  const compacta = variant === "compact";
  return (
    <header className={["cy-header", compacta && "cy-header-compact", className].filter(Boolean).join(" ")}>
      {compacta ? null : (
        <div className="cy-utility">
          <span>Compra en línea y retira en sucursal</span>
          {branchesWithPickup != null ? (
            <span className="cy-utility-ok">
              <span className="cy-badge-dot" aria-hidden="true" />
              {branchesWithPickup} sucursales con retiro disponible
            </span>
          ) : null}
        </div>
      )}
      <div className="cy-header-main">
        <Link className="cy-brand" href="/" aria-label="ComproYa, ir al catálogo">
          <span className="cy-brand-mark" aria-hidden="true">CY</span>
          <span>ComproYa</span>
        </Link>
        {compacta ? null : (
          <form
            className="cy-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value;
              onSearch?.(q);
            }}
          >
            <label htmlFor="cy-q" className="cy-sr">Buscar productos</label>
            <input id="cy-q" name="q" placeholder="Buscar productos" defaultValue={query} />
            <button type="submit">
              <Icon name="search" size={16} />
              <span>Buscar</span>
            </button>
          </form>
        )}
        <div className="cy-header-actions">
          {customerName ? (
            <div className="cy-account">
              <span>Hola, <strong>{customerName}</strong></span>
              {onLogout ? (
                <button type="button" className="cy-link" onClick={onLogout}>Cerrar sesión</button>
              ) : (
                <a href={logoutHref ?? "#"} className="cy-link">Cerrar sesión</a>
              )}
            </div>
          ) : (
            <Button variant="secondary" href="/ingresar" icon="user">Iniciar sesión</Button>
          )}
          <Link href="/carrito" className="cy-cart-btn">
            <Icon name="cart" />
            <span>{cartCount > 0 ? `Carrito (${cartCount}) · ${formatoCOP(cartTotal)}` : "Carrito"}</span>
          </Link>
        </div>
      </div>
      <nav className="cy-nav" aria-label="Secciones de la tienda">
        {NAVEGACION.map((n) => (
          <Link
            key={n.id}
            href={n.href}
            className={["cy-nav-link", active === n.id && "cy-nav-active"].filter(Boolean).join(" ")}
            aria-current={active === n.id ? "page" : undefined}
          >
            <Icon name={n.icono} size={16} />
            {n.id === "carrito" && cartCount > 0 ? `${n.etiqueta} (${cartCount})` : n.etiqueta}
          </Link>
        ))}
      </nav>
    </header>
  );
}
