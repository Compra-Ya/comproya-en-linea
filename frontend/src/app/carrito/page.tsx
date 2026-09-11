"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, setCartToken } from "@/lib/api";
import type { Carrito, Producto } from "@/lib/types";
import ShopHeader from "@/components/ShopHeader";

// P-7 Administración del carrito (CU-07) + P-8 Productos complementarios
// (CU-08, hasta 4 — tope del canon, C-05; extensión de P-7, no una pantalla
// aparte, tal como lo marca el mockup).
export default function CarritoPage() {
  const router = useRouter();
  const [carrito, setCarrito] = useState<Carrito | null>(null);
  const [complementarios, setComplementarios] = useState<Producto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    setCargando(true);
    try {
      const actual = await api<Carrito>("/carrito");
      if (actual.guestToken) setCartToken(actual.guestToken);
      setCarrito(actual);
      if (actual.items[0]) {
        const sugeridos = await api<{ suggestedProduct: Producto }[]>(
          `/carrito/complementarios/${actual.items[0].productId}`,
          { auth: false, cartToken: false },
        );
        setComplementarios(sugeridos.map((s) => s.suggestedProduct));
      } else {
        setComplementarios([]);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo cargar el carrito");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function actualizarCantidad(productId: number, quantity: number) {
    if (!carrito) return;
    setError(null);
    try {
      const actualizado = await api<Carrito>(`/carrito/${carrito.id}/items/${productId}`, {
        method: "PATCH",
        body: { quantity },
      });
      setCarrito(actualizado);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo actualizar el carrito");
    }
  }

  async function agregarComplementario(productId: number) {
    try {
      const actualizado = await api<Carrito>("/carrito/items", { method: "POST", body: { productId, quantity: 1 } });
      if (actualizado.guestToken) setCartToken(actualizado.guestToken);
      setCarrito(actualizado);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo agregar el producto");
    }
  }

  if (cargando) return <p className="muted" style={{ padding: 24 }}>Cargando…</p>;

  const total = carrito?.items.reduce((acc, i) => acc + Number(i.product.digitalPrice) * i.quantity, 0) ?? 0;
  const cantidadProductos = carrito?.items.length ?? 0;

  return (
    <div>
      <ShopHeader activeLink="carrito" />
      <div className="container" style={{ maxWidth: 1100, display: "grid", gridTemplateColumns: "1fr 320px", gap: 32, alignItems: "start" }}>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>Tu carrito</h2>
          <p className="faint" style={{ marginBottom: 8 }}>Se mantiene guardado aunque cambies de dispositivo.</p>

          {error && <div className="notice notice-danger" style={{ margin: "12px 0" }}>{error}</div>}

          {(!carrito || carrito.items.length === 0) && <p className="muted">El carrito está vacío.</p>}

          {carrito?.items.map((item) => (
            <div className="line-item" key={item.id}>
              <div className="thumb">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="5" y="2" width="14" height="20" rx="1.5" /><path d="M5 11h14" /></svg>
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{item.product.name}</span>
                <p className="faint" style={{ marginTop: 2 }}>$ {Number(item.product.digitalPrice).toLocaleString("es-CO")} c/u</p>
              </div>
              <div className="stepper">
                <button onClick={() => actualizarCantidad(item.productId, Math.max(0, item.quantity - 1))}>–</button>
                <span>{item.quantity}</span>
                <button onClick={() => actualizarCantidad(item.productId, item.quantity + 1)}>+</button>
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, width: 110, textAlign: "right" }}>
                $ {(Number(item.product.digitalPrice) * item.quantity).toLocaleString("es-CO")}
              </span>
              <a href="#" onClick={(e) => { e.preventDefault(); actualizarCantidad(item.productId, 0); }} className="faint">Quitar</a>
            </div>
          ))}

          {complementarios.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <h3 style={{ fontSize: 14, marginBottom: 4 }}>También podría interesarte</h3>
              <p className="faint" style={{ marginBottom: 14 }}>Hasta 4 productos complementarios, curados por el Analista de Marketing.</p>
              <div className="card" style={{ overflow: "hidden" }}>
                {complementarios.map((p) => (
                  <div className="line-item" key={p.id} style={{ padding: "14px 16px" }}>
                    <div className="thumb" style={{ width: 46, height: 46 }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600 }}>{p.name}</span>
                      <p className="faint">$ {Number(p.digitalPrice).toLocaleString("es-CO")}</p>
                    </div>
                    <button
                      className="btn"
                      style={{ height: 30, padding: "0 14px", borderRadius: 999, borderColor: "var(--orange)", color: "var(--orange)", background: "var(--orange-soft)", fontSize: 11 }}
                      onClick={() => agregarComplementario(p.id)}
                    >
                      Agregar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card card-pad">
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>Resumen</h3>
          <div className="totalsrow"><span>Subtotal</span><span>$ {total.toLocaleString("es-CO")}</span></div>
          <div className="totalsrow"><span>Productos</span><span>{cantidadProductos}</span></div>
          <div className="totalsrow grand"><span>Total</span><span>$ {total.toLocaleString("es-CO")}</span></div>
          <button
            className="btn btn-primary btn-full"
            style={{ marginTop: 14 }}
            disabled={!carrito?.items.length}
            onClick={() => router.push("/pedido/confirmar")}
          >
            Continuar a la confirmación
          </button>
        </div>
      </div>
    </div>
  );
}
