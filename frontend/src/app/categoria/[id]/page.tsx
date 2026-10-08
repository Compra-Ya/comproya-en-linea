"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError, setCartToken } from "@/lib/api";
import { infoCategoria } from "@/lib/categorias";
import type { Categoria, Producto } from "@/lib/types";
import ShopHeaderConectado from "@/components/ShopHeaderConectado";
import TarjetaProducto from "@/components/TarjetaProducto";
import CarruselCategorias from "@/components/CarruselCategorias";
import { Button, Icon, Notice } from "@/components/ui";

// Página de una categoría: portada con su foto, nombre y descripción, y sus productos. Es una
// vista del catálogo filtrada por categoría (misma consulta que el catálogo, con categoryId).
type EstadoTarjeta = "reposo" | "agregando" | "agregado" | "error";

export default function CategoriaPage() {
  const params = useParams<{ id: string }>();
  const categoryId = Number(params.id);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [fallo, setFallo] = useState(false);
  const [estados, setEstados] = useState<Record<number, EstadoTarjeta>>({});

  const categoria = categorias.find((c) => c.id === categoryId);
  const info = infoCategoria(categoria?.name);

  useEffect(() => {
    api<Categoria[]>("/catalogo/categorias", { auth: false, cartToken: false }).then(setCategorias).catch(() => undefined);
  }, []);

  const cargar = useCallback(
    async (numero: number, reemplazar: boolean) => {
      setCargando(true);
      setFallo(false);
      try {
        const r = await api<{ items: Producto[]; total: number }>(
          `/catalogo/productos?categoryId=${categoryId}&page=${numero}`,
          { auth: false, cartToken: false },
        );
        setTotal(r.total);
        setProductos((prev) => (reemplazar ? r.items : [...prev, ...r.items]));
        setPagina(numero);
      } catch {
        setFallo(true);
      } finally {
        setCargando(false);
      }
    },
    [categoryId],
  );

  useEffect(() => {
    cargar(1, true);
  }, [cargar]);

  async function agregar(productId: number) {
    setEstados((e) => ({ ...e, [productId]: "agregando" }));
    try {
      const carrito = await api<{ guestToken: string | null }>("/carrito/items", {
        method: "POST",
        body: { productId, quantity: 1 },
      });
      if (carrito.guestToken) setCartToken(carrito.guestToken);
      setEstados((e) => ({ ...e, [productId]: "agregado" }));
    } catch (e) {
      void (e instanceof ApiError);
      setEstados((e2) => ({ ...e2, [productId]: "error" }));
    }
  }

  return (
    <div>
      <ShopHeaderConectado active="catalogo" />

      <div className="container" style={{ maxWidth: 1300 }}>
        <nav className="migas" aria-label="Ruta">
          <Link href="/">Catálogo</Link>
          <Icon name="chevron-right" size={14} />
          <span aria-current="page">{info.nombre || "Categoría"}</span>
        </nav>

        <header className="portada-categoria">
          {info.imagen && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={info.imagen} alt="" className="portada-foto" />
          )}
          <div className="portada-velo" />
          <div className="portada-texto">
            <h1>{info.nombre || "Categoría"}</h1>
            {info.descripcion && <p>{info.descripcion}</p>}
            {categoria && <span className="portada-cuenta">{categoria.productCount} productos disponibles</span>}
          </div>
        </header>

        <CarruselCategorias categorias={categorias} />

        {fallo && (
          <Notice
            tone="danger"
            title="No pudimos cargar los productos"
            action={<Button variant="secondary" onClick={() => cargar(1, true)}>Reintentar</Button>}
          >
            Revisa tu conexión e inténtalo de nuevo.
          </Notice>
        )}

        <div className="grid5" style={{ marginTop: 16 }}>
          {productos.map((p) => (
            <TarjetaProducto key={p.id} producto={p} estado={estados[p.id] ?? "reposo"} onAgregar={() => agregar(p.id)} />
          ))}
        </div>

        {cargando && productos.length === 0 && <Notice tone="progress">Cargando productos…</Notice>}
        {!cargando && !fallo && productos.length === 0 && (
          <Notice tone="info" title="Todavía no hay productos en esta categoría" action={<Button variant="secondary" href="/">Ver todo el catálogo</Button>}>
            Prueba con otra categoría.
          </Notice>
        )}

        {productos.length < total && (
          <div style={{ textAlign: "center", margin: "24px 0" }}>
            <Button variant="secondary" loading={cargando} onClick={() => cargar(pagina + 1, false)}>
              {`Ver más productos (${productos.length} de ${total})`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
