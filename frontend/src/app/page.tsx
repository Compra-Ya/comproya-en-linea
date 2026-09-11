"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Producto } from "@/lib/types";
import ShopHeader from "@/components/ShopHeader";

// P-2 Búsqueda de productos (CU-02). Sprint 1 — sin autenticación (decisión
// D-01 del canon); ShopHeader ya maneja sesión/carrito para cuando sí exista.
function Catalogo() {
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") ?? "";
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qParam]);

  async function buscar() {
    setError(null);
    setCargando(true);
    try {
      if (qParam && qParam.length < 3) {
        setError("La búsqueda requiere al menos 3 caracteres");
        setProductos([]);
        return;
      }
      const path = qParam ? `/catalogo/productos?q=${encodeURIComponent(qParam)}` : "/catalogo/productos";
      const respuesta = await api<{ items: Producto[]; total: number }>(path, { auth: false, cartToken: false });
      setProductos(respuesta.items);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo cargar el catálogo");
    } finally {
      setCargando(false);
    }
  }

  const categorias = Array.from(new Set(productos.map((p) => p.category?.name).filter(Boolean))) as string[];
  const visibles = categoriaActiva ? productos.filter((p) => p.category?.name === categoriaActiva) : productos;

  return (
    <div>
      <ShopHeader activeLink="catalogo" />

      <div style={{ margin: "24px 24px 0" }}>
        <div className="card" style={{ background: "linear-gradient(120deg,var(--navy),#1d4f8f)", border: "none", borderRadius: 18, padding: "32px 40px", color: "#fff" }}>
          <h2 style={{ color: "#fff", fontSize: 24, maxWidth: 520 }}>
            {qParam ? `Resultados para "${qParam}"` : "Catálogo homologado, publicado y con precio digital verificado"}
          </h2>
          <p style={{ color: "#cfe0f2", fontSize: 13, marginTop: 6 }}>Los resultados aparecen desde que escribes 3 caracteres.</p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 1300 }}>
        {error && <div className="notice notice-danger" style={{ marginBottom: 16 }}>{error}</div>}

        {categorias.length > 0 && (
          <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
            <button className={`tabs button${categoriaActiva === null ? " active" : ""}`} style={tabChip(categoriaActiva === null)} onClick={() => setCategoriaActiva(null)}>Todas</button>
            {categorias.map((c) => (
              <button key={c} style={tabChip(categoriaActiva === c)} onClick={() => setCategoriaActiva(c)}>{c}</button>
            ))}
          </div>
        )}

        {!cargando && <p className="muted" style={{ marginBottom: 16 }}>{visibles.length} productos publicados encontrados</p>}

        <div className="grid-productos">
          {visibles.map((p) => (
            <Link key={p.id} href={`/producto/${p.id}`} className="product-card" style={{ color: "inherit" }}>
              <div className="product-thumb">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="5" y="2" width="14" height="20" rx="1.5" /><path d="M5 11h14" /></svg>
              </div>
              <div className="product-info">
                <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>$ {Number(p.digitalPrice).toLocaleString("es-CO")}</span>
                  <span className="badge badge-orange">Publicado</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {visibles.length === 0 && !cargando && !error && <p className="muted">No hay productos publicados que coincidan.</p>}
      </div>
    </div>
  );
}

function tabChip(active: boolean): React.CSSProperties {
  return {
    padding: "8px 16px",
    borderRadius: 999,
    border: `1px solid ${active ? "var(--navy)" : "var(--line)"}`,
    background: active ? "var(--navy)" : "#fff",
    color: active ? "#fff" : "var(--ink-soft)",
    fontSize: 12.5,
    fontWeight: 600,
  };
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={<p className="muted">Cargando…</p>}>
      <Catalogo />
    </Suspense>
  );
}
