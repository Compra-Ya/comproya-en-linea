"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import { Enlace } from "./Enlace";
import { Icon } from "./Icon";
import { Tooltip } from "./Tooltip";
import { cx, formatCOP, unidades } from "./formato";
import type { IconName, ShopHeaderProps } from "./tipos";

// La misma cabecera en todas las pantallas: logo, buscador siempre visible, cuenta y carrito, y la
// navegación Catálogo · Carrito · Mis pedidos · Mi cuenta. `compact` (del paso 2 en adelante) quita la
// barra superior y el buscador. Extensión de la referencia: `onLogout` para cerrar sesión sin recargar.
const NAVEGACION: Array<{ id: NonNullable<ShopHeaderProps["active"]>; etiqueta: string; href: string; icono: IconName }> = [
  { id: "catalogo", etiqueta: "Catálogo", href: "/", icono: "grid" },
  { id: "carrito", etiqueta: "Carrito", href: "/carrito", icono: "cart" },
  { id: "pedidos", etiqueta: "Mis pedidos", href: "/pedidos", icono: "receipt" },
  { id: "cuenta", etiqueta: "Mi cuenta", href: "/cuenta", icono: "user" },
];

// Menú "Categorías" de la barra de navegación: botón que abre un panel con las categorías (patrón de
// divulgación, no de menú de aplicación: son enlaces). Se cierra con Escape (y devuelve el foco al botón),
// al hacer clic fuera, al salir con el teclado del panel o al elegir una categoría.
function MenuCategorias({ categorias }: { categorias: NonNullable<ShopHeaderProps["categories"]> }) {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const hayActiva = categorias.some((c) => c.active);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent | TouchEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("touchstart", fuera);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("touchstart", fuera);
    };
  }, [abierto]);

  return (
    <div
      ref={raiz}
      className="cy-catmenu-wrap"
      onKeyDown={(e) => {
        if (e.key === "Escape" && abierto) {
          setAbierto(false);
          boton.current?.focus();
        }
      }}
      onBlur={(e) => {
        if (abierto && !e.currentTarget.contains(e.relatedTarget as Node | null)) setAbierto(false);
      }}
    >
      <button
        ref={boton}
        type="button"
        className={cx("cy-nav-link", "cy-nav-btn", (abierto || hayActiva) && "cy-nav-active")}
        aria-expanded={abierto}
        aria-controls="cy-catmenu"
        onClick={() => setAbierto((v) => !v)}
      >
        <span className="cy-nav-icon">
          <Icon name="grid" size={18} />
        </span>
        <span>Categorías</span>
        <Icon name="chevron-down" size={16} className={cx("cy-nav-chev", abierto && "cy-nav-chev-open")} />
      </button>
      <div id="cy-catmenu" className="cy-catmenu" hidden={!abierto}>
        <p className="cy-catmenu-title">Compra por categoría</p>
        <ul className="cy-catmenu-list">
          {categorias.map((c) => (
            <li key={c.href}>
              <Enlace href={c.href} className={cx("cy-catmenu-link", c.active && "cy-catmenu-active")} aria-current={c.active ? "page" : undefined} onClick={() => setAbierto(false)}>
                <span>{c.name}</span>
                {c.count !== undefined ? <span className="cy-catmenu-count">{c.count.toLocaleString("es-CO")}</span> : null}
              </Enlace>
            </li>
          ))}
        </ul>
        <Enlace href="/" className="cy-catmenu-all" onClick={() => setAbierto(false)}>
          Ver todo el catálogo
          <Icon name="arrow-right" size={16} />
        </Enlace>
      </div>
    </div>
  );
}

export function ShopHeader({
  logoSrc = "/marca/logo-horizontal.svg",
  variant = "full",
  active,
  cartCount = 0,
  cartTotal,
  customerName,
  logoutHref,
  onLogout,
  query,
  onSearch,
  categories,
  className,
}: ShopHeaderProps & { onLogout?: () => void }) {
  const compacta = variant === "compact";
  return (
    <header className={cx("cy-header", compacta && "cy-header-compact", className)}>
      {compacta ? null : (
        <div className="cy-utility">
          <div className="cy-utility-inner">
            <span>
              <Icon name="truck" size={16} />
              Compra en línea y recíbelo en la dirección que escribas
            </span>
            <span className="cy-utility-sec">
              <Icon name="lock" size={16} />
              Pago con tarjeta en la pasarela segura
            </span>
          </div>
        </div>
      )}
      <div className="cy-header-main">
        <Enlace className="cy-brand" href="/" aria-label="ComproYa, ir al catálogo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="ComproYa" className="cy-brand-img" />
        </Enlace>
        {compacta ? (
          <p className="cy-secure">
            <Icon name="lock" size={18} />
            <span>Compra segura</span>
          </p>
        ) : (
          <form
            className="cy-search"
            role="search"
            key={query ?? ""}
            onSubmit={(e) => {
              e.preventDefault();
              onSearch?.((e.currentTarget.elements.namedItem("q") as HTMLInputElement).value);
            }}
          >
            <label htmlFor="cy-q" className="cy-sr">
              Buscar productos
            </label>
            <Icon name="search" size={18} className="cy-search-icon" />
            <input id="cy-q" name="q" type="search" placeholder={'Buscar productos, por ejemplo "licuadora"'} defaultValue={query} />
            <button type="submit">Buscar</button>
          </form>
        )}
        <div className="cy-header-actions">
          {customerName ? (
            <div className="cy-account">
              <span className="cy-account-hello">
                Hola, <strong>{customerName}</strong>
              </span>
              <Tooltip label="Cerrar sesión en este dispositivo" describe={false} placement="bottom">
                <a
                  href={logoutHref || "#"}
                  className="cy-link cy-account-out"
                  onClick={(e) => {
                    if (onLogout) {
                      e.preventDefault();
                      onLogout();
                    }
                  }}
                >
                  Cerrar sesión
                </a>
              </Tooltip>
            </div>
          ) : (
            <Button variant="secondary" href="/ingresar" icon="user" className="cy-login">
              Iniciar sesión
            </Button>
          )}
          <Tooltip
            label={cartCount > 0 ? `Ver tu carrito: ${unidades(cartCount, "producto", "productos")}` : "Ver tu carrito"}
            describe={false}
            placement="bottom"
            align="end"
          >
            <Enlace href="/carrito" className="cy-cart-btn">
              <span className="cy-nav-icon">
                <Icon name="cart" />
                {cartCount > 0 ? (
                  <span className="cy-count" aria-hidden="true">
                    {cartCount}
                  </span>
                ) : null}
              </span>
              <span className="cy-cart-text">
                <span>Carrito</span>
                {cartCount > 0 ? <strong>{formatCOP(cartTotal)}</strong> : null}
              </span>
            </Enlace>
          </Tooltip>
        </div>
      </div>
      <nav className="cy-nav" aria-label="Secciones de la tienda">
        <div className="cy-nav-inner">
          {NAVEGACION.map((n) => {
            const activo = active === n.id && !categories?.some((c) => c.active);
            return (
              <Fragment key={n.id}>
                <Enlace href={n.href} className={cx("cy-nav-link", activo && "cy-nav-active")} aria-current={activo ? "page" : undefined}>
                  <span className="cy-nav-icon">
                    <Icon name={n.icono} size={18} />
                    {n.id === "carrito" && cartCount > 0 ? (
                      <span className="cy-count" aria-hidden="true">
                        {cartCount}
                      </span>
                    ) : null}
                  </span>
                  <span>
                    {n.etiqueta}
                    {n.id === "carrito" && cartCount > 0 ? <span className="cy-sr">, {unidades(cartCount, "producto", "productos")}</span> : null}
                  </span>
                </Enlace>
                {n.id === "catalogo" && categories && categories.length > 0 ? <MenuCategorias categorias={categories} /> : null}
              </Fragment>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
