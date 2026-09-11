"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, cerrarSesion, getStoredCustomer, type CustomerResumen } from "@/lib/api";
import type { Carrito } from "@/lib/types";

// Cromo de tienda compartido por catálogo, ficha de producto, carrito y
// cuenta (utility bar + header + nav de categorías) — mismo layout que usan
// los mockups Landing/P-2/P-3/P-5/P-7 (docs/mockups-plan.md).
export default function ShopHeader({ activeLink = "catalogo" }: { activeLink?: "catalogo" | "carrito" | "cuenta" }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [customer, setCustomer] = useState<CustomerResumen | null>(null);
  const [cart, setCart] = useState<Carrito | null>(null);

  useEffect(() => {
    setCustomer(getStoredCustomer());
    api<Carrito>("/carrito").then(setCart).catch(() => undefined);
  }, []);

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : "/");
  }

  const subtotal = cart?.items.reduce((acc, i) => acc + Number(i.product.digitalPrice) * i.quantity, 0) ?? 0;
  const cantidad = cart?.items.reduce((acc, i) => acc + i.quantity, 0) ?? 0;

  return (
    <>
      <div className="utility-bar">
        <span>Retira en sucursal en el día · Cobertura en 8 sucursales</span>
        <div className="links">
          <Link href="/pedidos" style={{ color: "#fff" }}>Mis pedidos</Link>
        </div>
      </div>
      <div className="header-main">
        <Link href="/" className="brand"><span className="brand-mark">CY</span>ComproYa</Link>
        <form className="searchbar" onSubmit={buscar}>
          <select disabled><option>Todas</option></select>
          <input placeholder="Buscar productos, marcas y categorías…" value={q} onChange={(e) => setQ(e.target.value)} />
          <button type="submit">Buscar</button>
        </form>
        {customer ? (
          <div className="hdr-item">
            <div className="hdr-avatar">{customer.name.slice(0, 2).toUpperCase()}</div>
            <div>
              <span className="faint" style={{ display: "block" }}>Hola,</span>
              <span style={{ fontWeight: 700 }}>{customer.name.split(" ")[0]}</span>
            </div>
            <button
              className="btn"
              style={{ height: 32, padding: "0 10px", fontSize: 11 }}
              onClick={() => {
                cerrarSesion();
                router.push("/");
                router.refresh();
              }}
            >
              Salir
            </button>
          </div>
        ) : (
          <Link href="/ingresar"><button className="btn-login">Iniciar sesión</button></Link>
        )}
        <Link href="/carrito" className="cart-btn">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="9" cy="20" r="1.3" /><circle cx="18" cy="20" r="1.3" />
            <path d="M2.5 3h2l2.2 11.4a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H5.3" />
          </svg>
          {cantidad > 0 ? `$ ${subtotal.toLocaleString("es-CO")}` : "Carrito"}
        </Link>
      </div>
      <div className="category-nav">
        <Link href="/" className={activeLink === "catalogo" ? "active" : undefined}>Todas las categorías</Link>
        <Link href="/carrito" className={activeLink === "carrito" ? "active" : undefined}>Carrito{cantidad > 0 ? ` (${cantidad})` : ""}</Link>
        <Link href="/privacidad" className={activeLink === "cuenta" ? "active" : undefined}>Mi cuenta</Link>
        <div className="verified"><span className="dot" />8 sucursales sincronizadas</div>
      </div>
    </>
  );
}
