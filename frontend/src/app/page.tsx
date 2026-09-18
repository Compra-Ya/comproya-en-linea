"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, ApiError, setCartToken, urlImagenProducto } from "@/lib/api";
import type { Categoria, Producto } from "@/lib/types";
import ShopHeader from "@/components/ShopHeader";

// P-2 Búsqueda de productos (CU-02) + landing del catálogo, replicando el
// mockup "Landing" del canvas (docs/mockups-plan.md) sección por sección:
// hero, franja de beneficios, categorías, catálogo y footer. Dos secciones
// del mockup se dejaron fuera a propósito — "Ofertas del día" / "Más
// vendidos" y las estrellas de calificación — porque el modelo de datos no
// tiene un campo real de "destacado" ni de reseñas; duplicar la misma
// grilla bajo esas etiquetas habría sido presentar como curado algo que no
// lo es. Si el equipo quiere esas secciones, hace falta agregar ese campo
// primero (ver resumen de la sesión).
function Catalogo() {
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") ?? "";
  const [productos, setProductos] = useState<Producto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [agregando, setAgregando] = useState<number | null>(null);

  useEffect(() => {
    api<Categoria[]>("/catalogo/categorias", { auth: false, cartToken: false }).then(setCategorias).catch(() => undefined);
  }, []);

  useEffect(() => {
    setPage(1);
    buscar(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qParam, categoriaActiva]);

  async function buscar(pageToLoad: number, reemplazar: boolean) {
    setError(null);
    setCargando(true);
    try {
      if (qParam && qParam.length < 3) {
        setError("La búsqueda requiere al menos 3 caracteres");
        setProductos([]);
        return;
      }
      const params = new URLSearchParams();
      if (qParam) params.set("q", qParam);
      if (categoriaActiva) params.set("categoryId", String(categoriaActiva));
      params.set("page", String(pageToLoad));
      const respuesta = await api<{ items: Producto[]; total: number }>(
        `/catalogo/productos?${params.toString()}`,
        { auth: false, cartToken: false },
      );
      setTotal(respuesta.total);
      setProductos((prev) => (reemplazar ? respuesta.items : [...prev, ...respuesta.items]));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo cargar el catálogo");
    } finally {
      setCargando(false);
    }
  }

  async function cargarMas() {
    const siguiente = page + 1;
    setPage(siguiente);
    await buscar(siguiente, false);
  }

  async function agregarAlCarrito(productId: number) {
    setMensaje(null);
    setError(null);
    setAgregando(productId);
    try {
      const carrito = await api<{ guestToken: string | null }>("/carrito/items", {
        method: "POST",
        body: { productId, quantity: 1 },
      });
      if (carrito.guestToken) setCartToken(carrito.guestToken);
      setMensaje("Producto agregado al carrito. Elige la sucursal de retiro al confirmar el pedido.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo agregar el producto");
    } finally {
      setAgregando(null);
    }
  }

  return (
    <div>
      <ShopHeader activeLink="catalogo" />

      {/* ---- Hero (Landing.dc.html: .hero) ---- */}
      <div className="container" style={{ maxWidth: 1300, paddingBottom: 0 }}>
        <div className="hero">
          <div className="hero-copy">
            <span className="hero-eyebrow">Catálogo homologado y verificado</span>
            <h1>
              {qParam ? `Resultados para "${qParam}"` : "Todo lo que buscas, con disponibilidad real en tu sucursal"}
            </h1>
            <p>
              Miles de productos publicados con precio digital vigente y unidades disponibles calculadas en tiempo
              real. Sin sorpresas al retirar.
            </p>
            <div className="hero-ctas">
              <a href="#catalogo"><button className="btn-primary-lg">Explorar el catálogo</button></a>
              <Link href="/interno/publicar"><button className="btn-outline-lg">Publicar producto</button></Link>
            </div>
            <div className="hero-stats">
              <div className="stat"><b>8</b><span>Sucursales con retiro</span></div>
              <div className="hero-divider" />
              <div className="stat"><b>≤5 min</b><span>Disponibilidad actualizada</span></div>
              <div className="hero-divider" />
              <div className="stat"><b>{total.toLocaleString("es-CO")}</b><span>Productos publicados</span></div>
            </div>
          </div>
          <div className="hero-visual">
            <svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="#3a5a86" strokeWidth="0.9"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></svg>
          </div>
        </div>
      </div>

      {/* ---- Franja de beneficios (Landing.dc.html: .badges-grid) ---- */}
      <div className="container" style={{ maxWidth: 1300 }}>
        <div className="badges-grid">
          <div className="badge-card">
            <div className="badge-ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="7" width="13" height="10" /><path d="M14 10h4l3 3v4h-7z" /><circle cx="6" cy="19" r="1.6" /><circle cx="17.5" cy="19" r="1.6" /></svg></div>
            <div><p>Retiro el mismo día</p><span>En las 8 sucursales sincronizadas</span></div>
          </div>
          <div className="badge-card">
            <div className="badge-ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z" /></svg></div>
            <div><p>Compra protegida</p><span>Reserva de unidades antes del cobro</span></div>
          </div>
          <div className="badge-card">
            <div className="badge-ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg></div>
            <div><p>Paga como quieras</p><span>Tarjeta o débito bancario</span></div>
          </div>
          <div className="badge-card">
            <div className="badge-ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 12a8 8 0 0 1 16 0M4 12v5a2 2 0 0 0 2 2h1v-7H4Zm16 0v5a2 2 0 0 1-2 2h-1v-7h3Z" /></svg></div>
            <div><p>Soporte 24/7</p><span>Consulta el estado de tu pedido</span></div>
          </div>
        </div>
      </div>

      {/* ---- Categorías (Landing.dc.html: .cat-grid, con conteo real) ---- */}
      {categorias.length > 0 && (
        <div className="container" style={{ maxWidth: 1300, paddingTop: 0 }}>
          <div className="section-head"><h2>Explora por categoría</h2></div>
          <div className="cat-grid">
            <button className="cat-item" onClick={() => setCategoriaActiva(null)} style={{ borderColor: categoriaActiva === null ? "var(--navy)" : undefined }}>
              <div className="cat-circle"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="12" cy="12" r="9" /></svg></div>
              <p>Todas</p><span>{total.toLocaleString("es-CO")} productos</span>
            </button>
            {categorias.map((c) => (
              <button key={c.id} className="cat-item" onClick={() => setCategoriaActiva(c.id)} style={{ borderColor: categoriaActiva === c.id ? "var(--navy)" : undefined }}>
                <div className="cat-circle"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="5" y="2" width="14" height="20" rx="1.5" /><path d="M5 11h14" /></svg></div>
                <p>{c.name}</p><span>{c.productCount} productos</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---- Banner de cupones de lealtad (Landing.dc.html: .wide-banner) — CU-10 real ---- */}
      <div className="container" style={{ maxWidth: 1300 }}>
        <div className="wide-banner">
          <div>
            <h2>Cupones de lealtad esperándote</h2>
            <p>Vincula tu identificador de lealtad y aplica tus cupones al confirmar el pedido.</p>
          </div>
          <Link href="/privacidad"><button className="btn-white">Vincular mi lealtad</button></Link>
        </div>
      </div>

      {/* ---- Catálogo completo (P-2, búsqueda real) ---- */}
      <div className="container" id="catalogo" style={{ maxWidth: 1300 }}>
        {error && <div className="notice notice-danger" style={{ marginBottom: 16 }}>{error}</div>}
        {mensaje && <div className="notice notice-ok" style={{ marginBottom: 16 }}>{mensaje}</div>}

        <div className="section-head"><h2>Catálogo</h2></div>
        <p className="muted" style={{ marginBottom: 16 }}>{total.toLocaleString("es-CO")} productos publicados encontrados</p>

        <div className="grid5">
          {productos.map((p) => (
            <div key={p.id} className="product-card">
              <Link href={`/producto/${p.id}`} style={{ color: "inherit" }}>
                <span className="tag-orange" style={{ position: "static", display: "inline-block", margin: "12px 0 0 12px" }}>
                  {p.category?.name}
                </span>
                <div className="wishlist-btn" title="Decorativo — sin lista de deseos implementada">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-4.35-9.5-8.8C.6 8.7 2 5 5.6 4.2 8 3.6 10 5 12 7.3 14 5 16 3.6 18.4 4.2 22 5 23.4 8.7 21.5 12.2 19 16.65 12 21 12 21Z" /></svg>
                </div>
                <div className="product-thumb">
                  {urlImagenProducto(p.imageUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={urlImagenProducto(p.imageUrl)!} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="5" y="2" width="14" height="20" rx="1.5" /><path d="M5 11h14" /></svg>
                  )}
                </div>
                <div className="product-info" style={{ paddingBottom: 0 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>{p.name}</span>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>$ {Number(p.digitalPrice).toLocaleString("es-CO")}</span>
                </div>
              </Link>
              <div style={{ padding: "0 12px 12px" }}>
                <button
                  className="btn btn-primary btn-full"
                  style={{ height: 34, fontSize: 12 }}
                  disabled={agregando === p.id}
                  onClick={() => agregarAlCarrito(p.id)}
                >
                  {agregando === p.id ? "Agregando…" : "Agregar al carrito"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {!cargando && productos.length === 0 && !error && <p className="muted">No hay productos publicados que coincidan.</p>}

        {productos.length < total && (
          <div style={{ textAlign: "center", margin: "24px 0" }}>
            <button className="btn" onClick={cargarMas} disabled={cargando}>
              {cargando ? "Cargando…" : `Cargar más (${productos.length} de ${total})`}
            </button>
          </div>
        )}
      </div>

      {/* ---- Footer (Landing.dc.html: .footer) ---- */}
      <div className="footer">
        <div className="container footer-cols" style={{ maxWidth: 1300 }}>
          <div>
            <h4>Categorías</h4>
            <ul style={{ padding: 0, margin: 0 }}>
              {categorias.slice(0, 5).map((c) => (
                <li key={c.id}><button className="footer-link" onClick={() => setCategoriaActiva(c.id)}>{c.name}</button></li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Ayuda</h4>
            <ul style={{ padding: 0, margin: 0 }}>
              <li><Link href="/pedidos" className="footer-link">Mis pedidos</Link></li>
              <li><Link href="/privacidad" className="footer-link">Privacidad y consentimiento</Link></li>
            </ul>
          </div>
          <div>
            <h4>Compañía</h4>
            <ul style={{ padding: 0, margin: 0 }}>
              <li>Tiendas ComproYa</li>
              <li>Canal digital B2C</li>
            </ul>
          </div>
          <div>
            <h4>Cuenta</h4>
            <ul style={{ padding: 0, margin: 0 }}>
              <li><Link href="/registro" className="footer-link">Crear cuenta</Link></li>
              <li><Link href="/ingresar" className="footer-link">Iniciar sesión</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">© 2026 ComproYa. Todos los derechos reservados.</div>
      </div>
    </div>
  );
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={<p className="muted">Cargando…</p>}>
      <Catalogo />
    </Suspense>
  );
}
