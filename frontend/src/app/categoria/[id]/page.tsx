"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError, urlImagenProducto } from "@/lib/api";
import { infoCategoria } from "@/lib/categorias";
import { agregarAlCarrito } from "@/lib/useCarrito";
import type { Categoria, ListaDeProductos, Producto } from "@/lib/types";
import Pantalla from "@/components/Pantalla";
import { Breadcrumbs, Button, CategoryCarousel, EmptyState, Icon, Notice, ProductCard, Skeleton } from "@/components/ui";

// Página de una categoría: portada con su foto, nombre, descripción y cantidad; el mismo carrusel marcando la
// categoría actual; y sus productos. Estados de design/rediseno/pantallas/Categoria.dc.html: éxito, cargando y
// categoría con pocos productos (se ven todos y se ofrece volver al catálogo).
type EstadoTarjeta = "idle" | "adding" | "added" | "error";

export default function CategoriaPage() {
  const categoryId = Number(useParams<{ id: string }>().id);
  const [categorias, setCategorias] = useState<Categoria[] | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [fallo, setFallo] = useState(false);
  const [estados, setEstados] = useState<Record<number, EstadoTarjeta>>({});
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    api<Categoria[]>("/catalogo/categorias", { auth: false, cartToken: false }).then(setCategorias).catch(() => setCategorias([]));
  }, []);

  const actual = categorias?.find((c) => c.id === categoryId);
  const info = infoCategoria(actual?.name);
  const noExiste = categorias !== null && !actual;

  const cargar = useCallback(
    async (numero: number, reemplazar: boolean) => {
      setCargando(true);
      setFallo(false);
      try {
        const r = await api<ListaDeProductos>(`/catalogo/productos?categoryId=${categoryId}&page=${numero}`, { auth: false, cartToken: false });
        setTotal(r.total);
        setPagina(numero);
        setProductos((prev) => (reemplazar ? r.items : [...prev, ...r.items]));
      } catch {
        setFallo(true);
      } finally {
        setCargando(false);
      }
    },
    [categoryId],
  );

  useEffect(() => {
    setProductos([]);
    setEstados({});
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

  const paraCarrusel = useMemo(
    () =>
      [...(categorias ?? [])]
        .sort((a, b) => (a.name === "Electrodomésticos" ? -1 : b.name === "Electrodomésticos" ? 1 : (b.productCount ?? 0) - (a.productCount ?? 0)))
        .map((c) => {
          const i = infoCategoria(c.name);
          return { name: i.nombre, image: i.imagen ?? undefined, href: `/categoria/${c.id}`, active: c.id === categoryId };
        }),
    [categorias, categoryId],
  );

  const cargandoLista = cargando && productos.length === 0;
  const verTodos = !cargando && !fallo && productos.length > 0 && productos.length >= total;
  const cuenta = categorias === null ? "Contando productos…" : `${(actual?.productCount ?? total).toLocaleString("es-CO")} productos`;

  if (noExiste) {
    return (
      <Pantalla active="catalogo">
        <section className="wrap sec">
          <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Categoría no disponible" }]} />
          <div className="panel" style={{ marginTop: 16 }}>
            <EmptyState
              icon="grid"
              title="Esta categoría ya no está disponible"
              text="Puede que se haya movido o que ya no tenga productos. Mira las demás categorías en el catálogo."
              action={<Button icon="grid" href="/">Volver al catálogo</Button>}
            />
          </div>
        </section>
      </Pantalla>
    );
  }

  return (
    <Pantalla active="catalogo">
      <div className="wrap" style={{ paddingTop: 16 }}>
        <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: info.nombre || "Categoría" }]} />
      </div>

      <section className="wrap" style={{ paddingTop: 12 }} aria-labelledby="cat-title">
        <div className="cover">
          <div className="cover-copy">
            <span className="cover-count">
              <Icon name="grid" size={16} />
              {cuenta}
            </span>
            <h1 id="cat-title" className="h-display" style={{ color: "#ffffff" }}>{info.nombre || "Categoría"}</h1>
            <p>{info.descripcion}</p>
          </div>
          <div className="cover-img">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {info.imagen ? <img src={info.imagen} alt="" /> : null}
          </div>
        </div>
      </section>

      <section className="wrap sec" aria-label="Otras categorías">
        {categorias === null ? (
          <>
            <h2 className="h-sec" style={{ marginBottom: 12 }}>Explora otras categorías</h2>
            <Skeleton variant="category" count={8} label="Cargando categorías…" />
          </>
        ) : (
          <CategoryCarousel categories={paraCarrusel} title="Explora otras categorías" />
        )}
      </section>

      <section className="wrap sec" aria-labelledby="cat-products">
        <div className="toolbar">
          <h2 id="cat-products" className="h-sec">Productos de {info.nombre || "esta categoría"}</h2>
          <p className="small muted">
            {cargandoLista || fallo
              ? ""
              : verTodos && productos.length <= 20
                ? `Mostrando los ${productos.length} productos`
                : `Mostrando ${productos.length.toLocaleString("es-CO")} de ${total.toLocaleString("es-CO")} productos`}
          </p>
        </div>
        <div style={{ paddingTop: 16 }}>
          {aviso && (
            <div style={{ marginBottom: 16 }}>
              <Notice tone="warn" title="No pudimos agregar más unidades." action={<Button variant="secondary" size="sm" icon="cart" href="/carrito">Ver carrito</Button>}>
                <p>{aviso}</p>
              </Notice>
            </div>
          )}
          {cargandoLista && !fallo && <Skeleton variant="product-card" count={10} label="Cargando productos…" />}
          {fallo && (
            <Notice
              tone="danger"
              title="No pudimos cargar los productos."
              action={<Button variant="secondary" size="sm" icon="refresh" onClick={() => cargar(1, true)}>Reintentar</Button>}
            >
              <p>Revisa tu conexión e inténtalo de nuevo. Tu carrito sigue guardado.</p>
            </Notice>
          )}
          {productos.length > 0 && (
            <div className="grid-products">
              {productos.map((p) => (
                <ProductCard
                  key={p.id}
                  name={p.name}
                  category={info.nombre}
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
          )}
          {verTodos && productos.length <= 20 && (
            <div className="loyalty" style={{ marginTop: 24, background: "var(--orange-100)", color: "var(--ink)" }}>
              <span className="loyalty-ic" style={{ color: "var(--orange-600)" }}><Icon name="grid" size={26} /></span>
              <div style={{ flex: 1, minWidth: 220 }}>
                <strong style={{ fontSize: 16 }}>Viste todos los productos de {info.nombre}</strong>
                <p className="small">Sigue explorando en otras categorías o vuelve al catálogo completo.</p>
              </div>
              <Button variant="secondary" href="/" icon="arrow-left">Volver al catálogo</Button>
            </div>
          )}
          {!cargando && productos.length < total && (
            <div className="more">
              <Button variant="secondary" iconRight="chevron-down" onClick={() => cargar(pagina + 1, false)}>Ver más productos</Button>
              <p className="small muted">
                Mostrando {productos.length.toLocaleString("es-CO")} de {total.toLocaleString("es-CO")} productos
              </p>
            </div>
          )}
          {cargando && productos.length > 0 && <Skeleton variant="text" count={1} label="Cargando más productos…" />}
        </div>
      </section>
    </Pantalla>
  );
}
