"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import PanelInterno from "@/components/PanelInterno";
import { Badge } from "@/components/ui";
import type { Producto } from "@/lib/types";

// P-1 Publicación de producto en el catálogo (CU-01). Actor: Coordinador de
// Canal Digital. Exige la sesión de la cuenta interna (REQ-017): PanelInterno
// lleva a /admin/ingresar si no hay una vigente, y el servidor la vuelve a validar.
export default function PublicarProductoPage() {
  const [form, setForm] = useState({
    homologatedCode: "",
    name: "",
    categoryName: "",
    brand: "",
    cost: "",
    digitalPrice: "",
    existencias: "",
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
        interno: true,
        body: {
          homologatedCode: form.homologatedCode,
          name: form.name,
          categoryName: form.categoryName,
          brand: form.brand || undefined,
          cost: Number(form.cost),
          digitalPrice: Number(form.digitalPrice),
          existencias: form.existencias === "" ? undefined : Number(form.existencias),
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
    <PanelInterno titulo="Panel del Coordinador de Canal Digital" activa="publicar">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22 }}>Publicar producto en el catálogo</h2>
          <p className="muted" style={{ marginTop: 4 }}>El producto solo queda visible en el canal si su código está homologado y se publica explícitamente aquí.</p>
        </div>
      </div>

      {error && <div className="notice notice-danger" style={{ marginBottom: 16 }}>{error}</div>}

      <form onSubmit={enviar}>
        <div className="card card-pad" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, marginBottom: 16 }}>Código homologado y categoría</h3>
          <div className="grid2">
            <div className="field">
              <label htmlFor="pub-codigo">Código homologado (formato AAAA-999999)</label><input id="pub-codigo" required value={form.homologatedCode} onChange={(e) => setForm({ ...form, homologatedCode: e.target.value.toUpperCase() })} />
            </div>
            <div className="field">
              <label htmlFor="pub-categoria">Categoría</label><input id="pub-categoria" required value={form.categoryName} onChange={(e) => setForm({ ...form, categoryName: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="pub-nombre">Nombre del producto</label><input id="pub-nombre" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="pub-marca">Marca (opcional)</label><input id="pub-marca" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="card card-pad" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, marginBottom: 16 }}>Precio digital y existencias</h3>
          <div className="grid2">
            <div className="field">
              <label htmlFor="pub-costo">Costo registrado</label><input id="pub-costo" required type="number" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="pub-precio">Precio digital</label><input id="pub-precio" required type="number" min="0" value={form.digitalPrice} onChange={(e) => setForm({ ...form, digitalPrice: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="pub-existencias">Existencias iniciales (las que reportaría el ERP)</label>
              <input id="pub-existencias" type="number" min="0" max="100000" step="1" value={form.existencias} onChange={(e) => setForm({ ...form, existencias: e.target.value })} aria-describedby="pub-existencias-ayuda" />
              <p id="pub-existencias-ayuda" className="faint" style={{ marginTop: 4 }}>
                {form.existencias === ""
                  ? "Si lo dejas vacío, el producto se publica sin unidades y no se podrá comprar."
                  : `Se podrán vender ${Math.max(0, Number(form.existencias) - 5)} unidades: se guardan 5 de seguridad (RN-03).`}
              </p>
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
              El precio digital queda por debajo del costo registrado — requiere aprobación de gerencia comercial (RN-02).
            </div>
          ) : (
            <div className="notice notice-ok" style={{ marginTop: 16 }}>
              El precio digital cumple RN-02 (no está por debajo del costo registrado).
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
                <tr><th>Código homologado</th><th>Producto</th><th>Precio digital</th><th>Disponibles</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {publicados.map((p) => (
                  <tr key={p.id}>
                    <td>{p.homologatedCode}</td>
                    <td>{p.name}</td>
                    <td>$ {Number(p.digitalPrice).toLocaleString("es-CO")}</td>
                <td>{p.unidadesDisponibles ?? 0}</td>
                    <td><Badge tone="ok">Publicado</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </PanelInterno>
  );
}
