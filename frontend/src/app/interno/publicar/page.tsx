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
  const [publicado, setPublicado] = useState<Producto | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPublicado(null);
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
      setPublicado(producto);
    } catch (e) {
      // RN-01 (código no homologado) o RN-02 (precio < costo sin aprobación).
      setError(e instanceof ApiError ? e.message : "No se pudo publicar el producto");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="tarjeta" style={{ maxWidth: 480 }}>
      <h1>Publicar producto</h1>
      <p className="muted">Coordinador de Canal Digital — CU-01</p>
      {error && <div className="alerta-error">{error}</div>}
      {publicado && <div className="alerta-exito">Publicado: {publicado.name} ({publicado.homologatedCode})</div>}

      <form onSubmit={enviar}>
        <div className="campo">
          <label>Código homologado (formato AAAA-999999)</label>
          <input required value={form.homologatedCode} onChange={(e) => setForm({ ...form, homologatedCode: e.target.value.toUpperCase() })} />
        </div>
        <div className="campo">
          <label>Nombre</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="campo">
          <label>Categoría</label>
          <input required value={form.categoryName} onChange={(e) => setForm({ ...form, categoryName: e.target.value })} />
        </div>
        <div className="campo">
          <label>Marca (opcional)</label>
          <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
        </div>
        <div className="campo">
          <label>Costo (ERP)</label>
          <input required type="number" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
        </div>
        <div className="campo">
          <label>Precio digital</label>
          <input required type="number" min="0" value={form.digitalPrice} onChange={(e) => setForm({ ...form, digitalPrice: e.target.value })} />
        </div>
        <div className="campo" style={{ flexDirection: "row", alignItems: "center" }}>
          <input
            type="checkbox"
            style={{ width: "auto" }}
            checked={form.aprobacionGerencialComercial}
            onChange={(e) => setForm({ ...form, aprobacionGerencialComercial: e.target.checked })}
          />
          <label>Precio digital inferior al costo, aprobado por gerencia comercial (RN-02)</label>
        </div>
        <button type="submit" disabled={enviando}>Publicar</button>
      </form>
    </div>
  );
}
