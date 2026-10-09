"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, ApiError, urlImagenProducto } from "@/lib/api";
import { infoCategoria } from "@/lib/categorias";
import { agregarAlCarrito } from "@/lib/useCarrito";
import type { Categoria, ListaDeProductos, Producto } from "@/lib/types";
import Pantalla from "@/components/Pantalla";
import { Badge, Breadcrumbs, Button, CategoryCarousel, EmptyState, Icon, Notice, ProductCard, Skeleton } from "@/components/ui";

// P-2 Búsqueda de productos (CU-02) y catálogo. Titular corto con los tres pasos, carrusel de categorías y los
// productos desde la primera pantalla; beneficios y cupón de lealtad después. Textos y estados de
// design/rediseno/pantallas/Catalogo.dc.html. Las unidades disponibles de cada producto las calcula el servidor.
type EstadoTarjeta = "idle" | "adding" | "added" | "error";

function Catalogo() {
  const q = useSearchParams().get("q")?.trim() ?? "";
  const esBusqueda = q.length > 0;
  const [categorias, setCategorias] = useState<Categoria[] | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [fallo, setFallo] = useState<"red" | "corta" | null>(null);
  const [estados, setEstados] = useState<Record<number, EstadoTarjeta>>({});
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    api<Categoria[]>("/catalogo/categorias", { auth: false, cartToken: false }).then(setCategorias).catch(() => setCategorias([]));
  }, []);

  const cargar = useCallback(
    async (numero: number, reemplazar: boolean) => {
      setCargando(true);
      setFallo(null);
      if (esBusqueda && q.length < 3) {
        setProductos([]);
        setTotal(0);
        setFallo("corta");
        setCargando(false);
        return;
      }
      try {
        const params = new URLSearchParams({ page: String(numero) });
        if (esBusqueda) params.set("q", q);
        const r = await api<ListaDeProductos>(`/catalogo/productos?${params}`, { auth: false, cartToken: false });
        setTotal(r.total);
        setPagina(numero);
        setProductos((prev) => (reemplazar ? r.items : [...prev, ...r.items]));
      } catch {
        setFallo("red");
      } finally {
        setCargando(false);
      }
    },
    [q, esBusqueda],
  );

  useEffect(() => {
    setProductos([]);
    setEstados({});
    setAviso(null);
    cargar(1, true);
  }, [cargar]);

  async function agregar(p: Producto) {
    setAviso(null);
    setEstados((e) => ({ ...e, [p.id]: "adding" }));
    try {
      await agregarAlCarrito(p.id, 1);
      setEstados((e) => ({ ...e, [p.id]: "added" }));
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) {
        setAviso(`${e.message}.`);
        setEstados((s) => ({ ...s, [p.id]: "idle" }));
      } else {
        setEstados((s) => ({ ...s, [p.id]: "error" }));
      }
    }
  }

  // Electrodomésticos primero (la línea principal de la tienda); el resto, por número de productos.
  const paraCarrusel = useMemo(
    () =>
      [...(categorias ?? [])]
        .sort((a, b) => (a.name === "Electrodomésticos" ? -1 : b.name === "Electrodomésticos" ? 1 : (b.productCount ?? 0) - (a.productCount ?? 0)))
        .map((c) => {
          const info = infoCategoria(c.name);
          return { name: info.nombre, image: info.imagen ?? undefined, href: `/categoria/${c.id}` };
        }),
    [categorias],
  );

  const sinResultados = esBusqueda && !cargando && !fallo && productos.length === 0;
  const cargandoLista = cargando && productos.length === 0;

  return (
    <Pantalla active="catalogo">
      {!esBusqueda && (
        <section className="wrap sec" aria-labelledby="titular">
          <div className="hero">
            <div className="hero-copy">
              <Badge tone="brand" icon="truck">
                Envío a la dirección que escribas
              </Badge>
              <h1 id="titular" className="h-display" style={{ maxWidth: 520 }}>
                Compra fácil y <span className="accent">recíbelo en casa</span>
              </h1>
              <p className="hero-sub">Electrodomésticos, tecnología y todo para tu hogar. Pagas con tarjeta en la pasarela segura y te lo enviamos.</p>
              <ol className="steps3" aria-label="Cómo comprar en tres pasos">
                <li>
                  <span className="step-ic">
                    <Icon name="cart-plus" size={22} />
                    <span className="step-n" aria-hidden="true">1</span>
                  </span>
                  <span>
                    <strong>Elige</strong>
                    <span className="small">Busca o explora por categoría</span>
                  </span>
                </li>
                <li>
                  <span className="step-ic">
                    <Icon name="card" size={22} />
                    <span className="step-n" aria-hidden="true">2</span>
                  </span>
                  <span>
                    <strong>Paga en línea</strong>
                    <span className="small">Con tarjeta, en la pasarela segura</span>
                  </span>
                </li>
                <li>
                  <span className="step-ic">
                    <Icon name="truck" size={22} />
                    <span className="step-n" aria-hidden="true">3</span>
                  </span>
                  <span>
                    <strong>Recíbelo en casa</strong>
                    <span className="small">En la dirección que escribas</span>
                  </span>
                </li>
              </ol>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="hero-block hero-block-orange" />
              <div className="hero-block hero-block-navy" />
              <div className="hero-photo hero-photo-main">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/productos/curados/televisor.webp" alt="" />
              </div>
              <div className="hero-photo hero-photo-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/productos/curados/licuadora.webp" alt="" />
              </div>
              <div className="hero-chip">
                <Icon name="lock" size={16} />
                Pago seguro con tarjeta
              </div>
            </div>
          </div>
        </section>
      )}

      {esBusqueda && (
        <section className="wrap sec">
          <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Búsqueda" }]} />
          <h1 className="h-title" style={{ marginTop: 8 }}>
            Resultados para «{q}»
          </h1>
          {!cargando && !fallo && <p className="muted" style={{ marginTop: 4 }}>{total.toLocaleString("es-CO")} {total === 1 ? "producto" : "productos"}</p>}
          {fallo === "corta" && (
            <div className="panel" style={{ marginTop: 16 }}>
              <EmptyState
                icon="search"
                title="Escribe al menos 3 letras para buscar"
                text="Con menos letras hay demasiados resultados. Prueba, por ejemplo, «licuadora» o «televisor»."
                action={<Button icon="grid" href="/">Ver todos los productos</Button>}
              />
            </div>
          )}
          {sinResultados && (
            <div className="panel" style={{ marginTop: 16 }}>
              <EmptyState
                icon="search"
                title={`No encontramos productos para «${q}»`}
                text="Revisa la ortografía o prueba con una palabra más general, por ejemplo «licuadora» o «televisor»."
                action={<Button icon="grid" href="/">Ver todos los productos</Button>}
              />
            </div>
          )}
        </section>
      )}

      <section className="wrap sec" aria-label="Categorías">
        {categorias === null ? (
          <>
            <h2 className="h-sec" style={{ marginBottom: 12 }}>Explora por categoría</h2>
            <Skeleton variant="category" count={8} label="Cargando categorías…" />
          </>
        ) : (
          <CategoryCarousel categories={paraCarrusel} title="Explora por categoría" />
        )}
      </section>

      {fallo !== "corta" && !sinResultados && (
        <section className="wrap sec" aria-labelledby="productos">
          <div className="between" style={{ marginBottom: 16 }}>
            <div>
              <h2 id="productos" className="h-sec">Productos</h2>
              <p className="muted small">{cargandoLista ? "Buscando productos…" : fallo ? "" : `${total.toLocaleString("es-CO")} productos`}</p>
            </div>
            <p className="small muted" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="info" size={16} />
              Precios en pesos colombianos.
            </p>
          </div>

          {aviso && (
            <div style={{ marginBottom: 16 }}>
              <Notice tone="warn" title="No pudimos agregar más unidades." action={<Button variant="secondary" size="sm" icon="cart" href="/carrito">Ver carrito</Button>}>
                <p>{aviso}</p>
              </Notice>
            </div>
          )}

          {cargandoLista && !fallo && <Skeleton variant="product-card" count={10} label="Cargando productos…" />}

          {fallo === "red" && (
            <Notice
              tone="danger"
              title="No pudimos cargar los productos."
              action={
                <>
                  <Button variant="secondary" size="sm" icon="refresh" onClick={() => cargar(1, true)}>Reintentar</Button>
                  <Button variant="ghost" size="sm" href="/carrito">Ver mi carrito</Button>
                </>
              }
            >
              <p>Revisa tu conexión a internet e inténtalo de nuevo. Tu carrito sigue guardado.</p>
            </Notice>
          )}

          {productos.length > 0 && (
            <>
              <div className="grid-products">
                {productos.map((p) => (
                  <ProductCard
                    key={p.id}
                    name={p.name}
                    category={infoCategoria(p.category?.name).nombre}
                    price={Number(p.digitalPrice)}
                    units={p.unidadesDisponibles}
                    image={urlImagenProducto(p.imageUrl)}
                    href={`/producto/${p.id}`}
                    state={estados[p.id] ?? "idle"}
                    addedQuantity={1}
                    onAdd={() => agregar(p)}
                    onContinue={() => setEstados((e) => ({ ...e, [p.id]: "idle" }))}
                  />
                ))}
              </div>
              {productos.length < total && (
                <div className="more">
                  <Button variant="secondary" iconRight="chevron-down" loading={cargando} onClick={() => cargar(pagina + 1, false)}>
                    {cargando ? "Cargando…" : "Ver más productos"}
                  </Button>
                  <p className="small muted">
                    Estás viendo {productos.length.toLocaleString("es-CO")} de {total.toLocaleString("es-CO")} productos
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      )}

      <section className="wrap sec-lg" aria-label="Por qué comprar en ComproYa">
        <div className="grid-benefits">
          <div className="benefit" id="pago">
            <span className="benefit-ic"><Icon name="lock" size={22} /></span>
            <span>
              <strong>Pago con tarjeta seguro</strong>
              <span className="small muted">Escribes tu tarjeta en la pasarela; ComproYa nunca la ve.</span>
            </span>
          </div>
          <div className="benefit" id="envio">
            <span className="benefit-ic"><Icon name="truck" size={22} /></span>
            <span>
              <strong>Envío a tu dirección</strong>
              <span className="small muted">Lo recibes donde nos digas al hacer el pedido.</span>
            </span>
          </div>
          <div className="benefit">
            <span className="benefit-ic"><Icon name="clock" size={22} /></span>
            <span>
              <strong>Unidades reservadas</strong>
              <span className="small muted">Las apartamos para ti mientras pagas.</span>
            </span>
          </div>
          <div className="benefit">
            <span className="benefit-ic"><Icon name="receipt" size={22} /></span>
            <span>
              <strong>Sigue tu pedido</strong>
              <span className="small muted">Su estado y lo que sigue, en Mis pedidos.</span>
            </span>
          </div>
        </div>
        <div className="loyalty" id="cupon" style={{ marginTop: 16 }}>
          <span className="loyalty-ic"><Icon name="ticket" size={26} /></span>
          <div style={{ flex: 1, minWidth: 220 }}>
            <strong style={{ fontSize: 16 }}>¿Tienes un cupón de lealtad?</strong>
            <p className="small">Escríbelo en el paso «Datos y envío» antes de pagar. Cada cupón se usa una sola vez por pedido.</p>
          </div>
          <Button variant="navy" size="sm" href="/pedido/confirmar" iconRight="arrow-right">Cómo usar mi cupón</Button>
        </div>
      </section>
    </Pantalla>
  );
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={<Pantalla active="catalogo"><section className="wrap sec"><Skeleton variant="product-card" count={10} label="Cargando…" /></section></Pantalla>}>
      <Catalogo />
    </Suspense>
  );
}
