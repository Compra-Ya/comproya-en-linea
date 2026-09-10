"use client";

import { useEffect, useState } from "react";
import { api, ApiError, setCartToken } from "@/lib/api";
import type { Carrito, Disponibilidad, Producto, Sucursal } from "@/lib/types";

// P-2 Búsqueda de productos (CU-02) + P-3 Consulta de disponibilidad por
// sucursal (CU-03). Sprint 1 — sin autenticación (decisión D-01 del canon).
export default function CatalogoPage() {
  const [query, setQuery] = useState("");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState<number | null>(null);
  const [disponibilidad, setDisponibilidad] = useState<Record<number, Disponibilidad>>({});
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api<Sucursal[]>("/catalogo/sucursales", { auth: false, cartToken: false }).then((lista) => {
      setSucursales(lista);
      if (lista[0]) setSucursalSeleccionada(lista[0].id);
    });
  }, []);

  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function buscar() {
    setError(null);
    setCargando(true);
    try {
      if (query.trim().length > 0 && query.trim().length < 3) {
        setError("La búsqueda requiere al menos 3 caracteres");
        setCargando(false);
        return;
      }
      const path = query.trim() ? `/catalogo/productos?q=${encodeURIComponent(query.trim())}` : "/catalogo/productos";
      const respuesta = await api<{ items: Producto[] }>(path, { auth: false, cartToken: false });
      setProductos(respuesta.items);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo cargar el catálogo");
    } finally {
      setCargando(false);
    }
  }

  async function verDisponibilidad(productId: number) {
    if (!sucursalSeleccionada) return;
    try {
      const d = await api<Disponibilidad>(
        `/catalogo/productos/${productId}/disponibilidad?sucursalId=${sucursalSeleccionada}`,
        { auth: false, cartToken: false },
      );
      setDisponibilidad((prev) => ({ ...prev, [productId]: d }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo consultar la disponibilidad");
    }
  }

  async function agregarAlCarrito(productId: number) {
    setMensaje(null);
    setError(null);
    try {
      const carrito = await api<Carrito>("/carrito/items", { method: "POST", body: { productId, quantity: 1 } });
      if (carrito.guestToken) setCartToken(carrito.guestToken);
      setMensaje("Producto agregado al carrito");
    } catch (e) {
      // E-1 (sin disponibilidad) no se valida aquí — RN-03 se aplica al
      // confirmar el pedido, cuando ya hay una sucursal de retiro elegida.
      setError(e instanceof ApiError ? e.message : "No se pudo agregar el producto");
    }
  }

  return (
    <div>
      <h1>Catálogo</h1>
      {error && <div className="alerta-error">{error}</div>}
      {mensaje && <div className="alerta-exito">{mensaje}</div>}

      <div className="tarjeta">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            placeholder="Buscar (mínimo 3 caracteres)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && buscar()}
          />
          <select
            value={sucursalSeleccionada ?? ""}
            onChange={(e) => setSucursalSeleccionada(Number(e.target.value))}
          >
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>{s.name} — {s.city}</option>
            ))}
          </select>
          <button onClick={buscar} disabled={cargando}>Buscar</button>
        </div>
      </div>

      <div className="grid-productos">
        {productos.map((p) => (
          <div key={p.id} className="tarjeta">
            <span className="etiqueta">{p.category?.name}</span>
            <h2>{p.name}</h2>
            <p className="muted">{p.homologatedCode}</p>
            <p><strong>${Number(p.digitalPrice).toLocaleString("es-CO")}</strong></p>

            {disponibilidad[p.id] ? (
              <p className="muted">
                {disponibilidad[p.id].unidadesDisponibles} unidades disponibles en esta sucursal
                {!disponibilidad[p.id].puedeRetirar && (
                  <> — <span style={{ color: "var(--danger)" }}>sin retiro (sucursal desincronizada, RN-04)</span></>
                )}
              </p>
            ) : (
              <button className="secundario" onClick={() => verDisponibilidad(p.id)}>Ver disponibilidad</button>
            )}

            <button onClick={() => agregarAlCarrito(p.id)}>Agregar al carrito</button>
          </div>
        ))}
        {productos.length === 0 && !cargando && <p className="muted">No hay productos publicados que coincidan.</p>}
      </div>
    </div>
  );
}
