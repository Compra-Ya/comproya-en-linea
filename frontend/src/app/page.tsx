"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, ApiError, setCartToken } from "@/lib/api";
import { infoCategoria } from "@/lib/categorias";
import { MODO_ENVIO, TEXTOS } from "@/lib/modo";
import type { Categoria, Producto } from "@/lib/types";
import ShopHeaderConectado from "@/components/ShopHeaderConectado";
import TarjetaProducto from "@/components/TarjetaProducto";
import CarruselCategorias from "@/components/CarruselCategorias";
import { Button, Icon, Notice } from "@/components/ui";

// P-2 Búsqueda de productos (CU-02) + catálogo. Los productos van primero: el titular es corto, las
// categorías son un carrusel de una sola fila (cada una tiene su página) y los beneficios y el
// banner de lealtad quedan después del listado. Textos de design/06-copy.md. Se dejaron fuera a
// propósito las secciones de "ofertas" y calificaciones: el modelo de datos no tiene un campo real
// de "destacado" ni de reseñas (están fuera del alcance).
type EstadoTarjeta = "reposo" | "agregando" | "agregado" | "error";

function Catalogo() {
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") ?? "";
  const [productos, setProductos] = useState<Producto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [estados, setEstados] = useState<Record<number, EstadoTarjeta>>({});

  useEffect(() => {
    api<Categoria[]>("/catalogo/categorias", { auth: false, cartToken: false }).then(setCategorias).catch(() => undefined);
  }, []);

  useEffect(() => {
    setPage(1);
    buscar(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qParam]);

  async function buscar(pageToLoad: number, reemplazar: boolean) {
    setError(null);
    setCargando(true);
    try {
      if (qParam && qParam.length < 3) {
        setError("Escribe al menos 3 letras para buscar.");
        setProductos([]);
        return;
      }
      const params = new URLSearchParams();
      if (qParam) params.set("q", qParam);
      params.set("page", String(pageToLoad));
      const respuesta = await api<{ items: Producto[]; total: number }>(
        `/catalogo/productos?${params.toString()}`,
        { auth: false, cartToken: false },
      );
      setTotal(respuesta.total);
      setProductos((prev) => (reemplazar ? respuesta.items : [...prev, ...respuesta.items]));
    } catch (e) {
      void (e instanceof ApiError);
      setError("No pudimos cargar los productos. Revisa tu conexión e inténtalo de nuevo.");
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
    setEstados((e) => ({ ...e, [productId]: "agregando" }));
    try {
      const carrito = await api<{ guestToken: string | null }>("/carrito/items", {
        method: "POST",
        body: { productId, quantity: 1 },
      });
      if (carrito.guestToken) setCartToken(carrito.guestToken);
      setEstados((e) => ({ ...e, [productId]: "agregado" }));
    } catch {
      setEstados((e) => ({ ...e, [productId]: "error" }));
    }
  }

  return (
    <div>
      <ShopHeaderConectado active="catalogo" />

      <div className="container" style={{ maxWidth: 1300, paddingBottom: 0 }}>
        <div className="hero hero-compacto">
          <div className="hero-copy">
            <h1>{qParam ? `Resultados para "${qParam}"` : TEXTOS.heroTitulo}</h1>
            <p>{TEXTOS.heroSubtitulo}</p>
          </div>
          <div className="hero-pasos" aria-label="Cómo funciona">
            <span><Icon name="search" size={18} /> {TEXTOS.pasosHero[0]}</span>
            <span><Icon name="card" size={18} /> {TEXTOS.pasosHero[1]}</span>
            <span><Icon name={MODO_ENVIO ? "package" : "store"} size={18} /> {TEXTOS.pasosHero[2]}</span>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 1300, paddingTop: 12, paddingBottom: 0 }}>
        <CarruselCategorias categorias={categorias} />
      </div>

      <div className="container" id="catalogo" style={{ maxWidth: 1300 }}>
        <div className="section-head"><h2>Productos</h2></div>
        <p className="muted" style={{ marginBottom: 16 }}>{total.toLocaleString("es-CO")} productos</p>

        {error && (
          <div style={{ marginBottom: 16 }}>
            <Notice tone="danger" title="No pudimos mostrar los productos" action={<Button variant="secondary" onClick={() => buscar(1, true)}>Reintentar</Button>}>
              {error}
            </Notice>
          </div>
        )}

        <div className="grid5">
          {productos.map((p) => (
            <TarjetaProducto key={p.id} producto={p} estado={estados[p.id] ?? "reposo"} onAgregar={() => agregarAlCarrito(p.id)} />
          ))}
        </div>

        {cargando && productos.length === 0 && !error && <Notice tone="progress">Cargando productos…</Notice>}
        {!cargando && productos.length === 0 && !error && (
          <Notice tone="info" title={`No encontramos productos para "${qParam}"`} action={<Button variant="secondary" href="/">Ver todos los productos</Button>}>
            Revisa la ortografía o prueba con otra palabra.
          </Notice>
        )}

        {productos.length < total && (
          <div style={{ textAlign: "center", margin: "24px 0" }}>
            <Button variant="secondary" loading={cargando} onClick={cargarMas}>
              {`Ver más productos (${productos.length} de ${total})`}
            </Button>
          </div>
        )}
      </div>

      <div className="container" style={{ maxWidth: 1300, paddingTop: 0 }}>
        <div className="badges-grid">
          <div className="badge-card">
            <div className="badge-ic"><Icon name={MODO_ENVIO ? "package" : "store"} size={20} /></div>
            <div>{MODO_ENVIO ? <><p>Envío a tu dirección</p><span>Escribe dónde quieres recibir tu pedido</span></> : <><p>Retiro en sucursal</p><span>Elige dónde retirar al confirmar el pedido</span></>}</div>
          </div>
          <div className="badge-card">
            <div className="badge-ic"><Icon name="package" size={20} /></div>
            <div>{MODO_ENVIO ? <><p>Pago seguro</p><span>Pagas en la pasarela: ComproYa nunca ve tu tarjeta</span></> : <><p>Unidades reservadas</p><span>Al confirmar el pedido reservamos tus unidades</span></>}</div>
          </div>
          <div className="badge-card">
            <div className="badge-ic"><Icon name="card" size={20} /></div>
            <div>{MODO_ENVIO ? <><p>Paga con tarjeta</p><span>Débito o crédito, en la pasarela segura</span></> : <><p>Dos formas de pago</p><span>Tarjeta o pago con débito bancario</span></>}</div>
          </div>
          <div className="badge-card">
            <div className="badge-ic"><Icon name="receipt" size={20} /></div>
            <div><p>Sigue tu pedido</p><span>Consulta su estado en Mis pedidos</span></div>
          </div>
        </div>

        <div className="wide-banner">
          <div>
            <h2>Cupones de lealtad</h2>
            <p>Vincula tu cuenta al programa de lealtad y aplica tus cupones al confirmar el pedido.</p>
          </div>
          <Link href="/privacidad"><button className="btn-white">Vincular mi cuenta</button></Link>
        </div>
      </div>

      <div className="footer">
        <div className="container footer-cols" style={{ maxWidth: 1300 }}>
          <div>
            <h4>Categorías</h4>
            <ul style={{ padding: 0, margin: 0 }}>
              {categorias.slice(0, 5).map((c) => (
                <li key={c.id}><Link className="footer-link" href={`/categoria/${c.id}`}>{infoCategoria(c.name).nombre}</Link></li>
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
    <Suspense fallback={<Notice tone="progress">Cargando…</Notice>}>
      <Catalogo />
    </Suspense>
  );
}
