"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Producto } from "@/lib/types";

// P-1 Publicación de producto en el catálogo (CU-01). Actor: Coordinador de
// Canal Digital. Sprint 1 — sin autenticación (decisión D-01 del canon); el
// control de rol interno queda pendiente de que el módulo cuenta lo agregue.
export default function PublicarProductoPage() {
  const [form, setForm] = useState({
    homologatedCode: "",
    name: "",
    categoryName: "",
    brand: "",
    cost: "",
    digitalPrice: "",
    aprobacionGerencialComercial: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [publicados, setPublicados] = useState<Producto[]>([]);
  const [enviando, setEnviando] = useState(false);

  const necesitaAprobacion =
    form.cost !== "" && form.digitalPrice !== "" && Number(form.digitalPrice) < Number(form.cost);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const producto = await api<Producto>("/catalogo/productos", {
        method: "POST",
        auth: false,
        cartToken: false,
        body: {
          homologatedCode: form.homologatedCode,
          name: form.name,
          categoryName: form.categoryName,
          brand: form.brand || undefined,
          cost: Number(form.cost),
          digitalPrice: Number(form.digitalPrice),
          aprobacionGerencialComercial: form.aprobacionGerencialComercial,
        },
      });
      setPublicados((prev) => [producto, ...prev]);
    } catch (e) {
      // RN-01 (código no homologado) o RN-02 (precio < costo sin aprobación).
      setError(e instanceof ApiError ? e.message : "No se pudo publicar el producto");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="panel-shell">
      <div className="panel-sidebar">
        <div className="brand-row"><span className="brand-mark" style={{ width: 28, height: 28, fontSize: 12 }}>CY</span>ComproYa</div>
        <nav>
          <a href="#" className="active">Publicación de catálogo</a>
          <a href="#" style={{ opacity: .5, cursor: "not-allowed" }}>Pedidos en riesgo</a>
        </nav>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div className="panel-topbar">
          <h1 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-soft)" }}>Panel del Coordinador de Canal Digital</h1>
        </div>
        <div className="panel-main">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 22 }}>Publicar producto en el catálogo</h2>
              <p className="muted" style={{ marginTop: 4 }}>El producto solo queda visible en el canal si su código está homologado y se publica explícitamente aquí.</p>
            </div>
          </div>

          {error && <div className="notice notice-danger" style={{ marginBottom: 16 }}>{error}</div>}

          <form onSubmit={enviar}>
            <div className="card card-pad" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, marginBottom: 16 }}>Código homologado y categoría (maestro del ERP)</h3>
              <div className="grid2">
                <div className="field">
                  <label>Código homologado (formato AAAA-999999)</label>
                  <input required value={form.homologatedCode} onChange={(e) => setForm({ ...form, homologatedCode: e.target.value.toUpperCase() })} />
                </div>
                <div className="field">
                  <label>Categoría</label>
                  <input required value={form.categoryName} onChange={(e) => setForm({ ...form, categoryName: e.target.value })} />
                </div>
                <div className="field">
                  <label>Nombre del producto</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="field">
                  <label>Marca (opcional)</label>
                  <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="card card-pad" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, marginBottom: 16 }}>Precio digital y estado de publicación</h3>
              <div className="grid2">
                <div className="field">
                  <label>Costo registrado en el ERP</label>
                  <input required type="number" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
                </div>
                <div className="field">
                  <label>Precio digital</label>
                  <input required type="number" min="0" value={form.digitalPrice} onChange={(e) => setForm({ ...form, digitalPrice: e.target.value })} />
                </div>
              </div>
              {necesitaAprobacion ? (
                <div className="notice notice-warn" style={{ marginTop: 16, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    style={{ width: "auto" }}
                    checked={form.aprobacionGerencialComercial}
                    onChange={(e) => setForm({ ...form, aprobacionGerencialComercial: e.target.checked })}
                  />
                  El precio digital queda por debajo del costo del ERP — requiere aprobación de gerencia comercial (RN-02).
                </div>
              ) : (
                <div className="notice notice-ok" style={{ marginTop: 16 }}>
                  El precio digital cumple RN-02 (no está por debajo del costo del ERP).
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" disabled={enviando}>Publicar en el canal</button>
          </form>

          {publicados.length > 0 && (
            <>
              <h3 style={{ fontSize: 14, margin: "24px 0 12px" }}>Publicados recientemente</h3>
              <div className="card" style={{ overflow: "hidden" }}>
                <table>
                  <thead>
                    <tr><th>Código homologado</th><th>Producto</th><th>Precio digital</th><th>Estado</th></tr>
                  </thead>
                  <tbody>
                    {publicados.map((p) => (
                      <tr key={p.id}>
                        <td>{p.homologatedCode}</td>
                        <td>{p.name}</td>
                        <td>$ {Number(p.digitalPrice).toLocaleString("es-CO")}</td>
                        <td><span className="badge badge-ok">Publicado</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
