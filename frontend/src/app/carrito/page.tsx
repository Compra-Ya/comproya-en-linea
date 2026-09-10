"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError, setCartToken } from "@/lib/api";
import type { Carrito, Producto } from "@/lib/types";

// P-7 Administración del carrito (CU-07) + P-8 Productos complementarios
// (CU-08, hasta 4 — tope del canon, C-05).
export default function CarritoPage() {
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

  if (cargando) return <p className="muted">Cargando…</p>;

  const total = carrito?.items.reduce((acc, i) => acc + Number(i.product.digitalPrice) * i.quantity, 0) ?? 0;

  return (
    <div>
      <h1>Carrito</h1>
      {error && <div className="alerta-error">{error}</div>}

      <div className="tarjeta">
        {(!carrito || carrito.items.length === 0) && <p className="muted">El carrito está vacío.</p>}
        {carrito?.items.map((item) => (
          <div className="fila" key={item.id}>
            <div>
              <strong>{item.product.name}</strong>
              <p className="muted">${Number(item.product.digitalPrice).toLocaleString("es-CO")} c/u</p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="number"
                min={0}
                style={{ width: 70 }}
                value={item.quantity}
                onChange={(e) => actualizarCantidad(item.productId, Number(e.target.value))}
              />
              <button className="secundario" onClick={() => actualizarCantidad(item.productId, 0)}>Quitar</button>
            </div>
          </div>
        ))}
        {carrito && carrito.items.length > 0 && (
          <div className="fila">
            <strong>Total</strong>
            <strong>${total.toLocaleString("es-CO")}</strong>
          </div>
        )}
      </div>

      {complementarios.length > 0 && (
        <div className="tarjeta" style={{ marginTop: 16 }}>
          <h2>También te puede interesar</h2>
          <div className="grid-productos">
            {complementarios.map((p) => (
              <div key={p.id} className="tarjeta">
                <strong>{p.name}</strong>
                <p className="muted">${Number(p.digitalPrice).toLocaleString("es-CO")}</p>
                <button className="secundario" onClick={() => agregarComplementario(p.id)}>Agregar</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {carrito && carrito.items.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Link href="/pedido/confirmar"><button>Continuar a confirmar el pedido</button></Link>
        </div>
      )}
    </div>
  );
}
