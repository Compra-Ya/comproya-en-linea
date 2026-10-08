"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError, setCartToken } from "@/lib/api";
import { infoCategoria } from "@/lib/categorias";
import type { Carrito, Disponibilidad, Producto } from "@/lib/types";
import ShopHeaderConectado from "@/components/ShopHeaderConectado";
import { ProductImage } from "@/components/ProductImage";
import { Button, Icon, Notice, QuantityStepper, formatoCOP } from "@/components/ui";

// Detalle de producto de la venta digital con envío: foto, precio, unidades disponibles, cantidad y
// "Agregar al carrito". No hay elección de sucursal: el sistema despacha desde la que tenga unidades.
export default function DetalleProductoEnvio({ productId }: { productId: number }) {
  const [producto, setProducto] = useState<Producto | null | undefined>(undefined);
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad[] | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [estado, setEstado] = useState<"reposo" | "agregando" | "agregado" | "error">("reposo");
  const [mensajeError, setMensajeError] = useState("");

  useEffect(() => {
    api<Producto>(`/catalogo/productos/${productId}`, { auth: false, cartToken: false })
      .then(setProducto)
      .catch(() => setProducto(null));
    api<Disponibilidad[]>(`/catalogo/productos/${productId}/disponibilidad`, { auth: false, cartToken: false })
      .then(setDisponibilidad)
      .catch(() => setDisponibilidad([]));
  }, [productId]);

  // Un pedido se despacha desde una sola sucursal: el máximo por pedido es lo que tiene la que más tiene.
  const maximo = disponibilidad ? Math.max(0, ...disponibilidad.map((d) => d.unidadesDisponibles)) : null;
  const agotado = maximo === 0;
  const info = infoCategoria(producto?.category?.name);

  async function agregar() {
    setEstado("agregando");
    setMensajeError("");
    try {
      const carrito = await api<Carrito>("/carrito/items", { method: "POST", body: { productId, quantity: cantidad } });
      if (carrito.guestToken) setCartToken(carrito.guestToken);
      setEstado("agregado");
    } catch (e) {
      setMensajeError(e instanceof ApiError && e.status === 404 ? "Este producto ya no está disponible." : "No pudimos agregar el producto. Inténtalo de nuevo.");
      setEstado("error");
    }
  }

  if (producto === null) {
    return (
      <div>
        <ShopHeaderConectado active="catalogo" />
        <main className="pantalla">
          <Notice tone="info" title="Este producto ya no está disponible" action={<Button variant="secondary" href="/">Ver el catálogo</Button>}>
            Puede que ya no se venda en la tienda en línea. Mira otros productos.
          </Notice>
        </main>
      </div>
    );
  }

  return (
    <div>
      <ShopHeaderConectado active="catalogo" />
      <main className="pantalla">
        <nav className="migas" aria-label="Ruta">
          <Link href="/">Catálogo</Link>
          {producto?.category && (
            <>
              <Icon name="chevron-right" size={14} />
              <Link href={`/categoria/${producto.category.id}`}>{info.nombre}</Link>
            </>
          )}
        </nav>

        <div className="detalle-grid">
          <div className="detalle-foto">
            <ProductImage imageUrl={producto?.imageUrl} nombre={producto?.name} categoria={producto?.category?.name} tamano={86} />
          </div>

          <div className="detalle-info">
            {producto ? (
              <>
                <span className="faint">{info.nombre}</span>
                <h1 className="pantalla-titulo">{producto.name}</h1>
                <p className="detalle-precio">{formatoCOP(producto.digitalPrice)}</p>
              </>
            ) : (
              <Notice tone="progress">Cargando producto…</Notice>
            )}

            <div className="detalle-disponibilidad">
              {maximo == null ? null : agotado ? (
                <Notice tone="warn" title="Producto agotado" action={<Button variant="secondary" href="/">Ver otros productos</Button>}>
                  Por ahora no hay unidades disponibles.
                </Notice>
              ) : (
                <p className="detalle-unidades">
                  <Icon name="package" size={16} />
                  <span title="Unidades que puedes pedir hoy en una sola compra">Hay {maximo} unidades disponibles</span>
                </p>
              )}
            </div>

            {!agotado && maximo != null && (
              <div className="detalle-compra">
                <div className="detalle-cantidad">
                  <span className="cupon-etiqueta" id="etiqueta-cantidad">Cantidad</span>
                  <QuantityStepper value={cantidad} min={1} max={maximo} label="Cantidad" onChange={setCantidad} />
                </div>
                <Button size="lg" icon="cart" loading={estado === "agregando"} title={`Agregar ${cantidad} ${cantidad === 1 ? "unidad" : "unidades"} al carrito`} onClick={agregar}>
                  {estado === "agregando" ? "Agregando…" : "Agregar al carrito"}
                </Button>
              </div>
            )}

            {estado === "agregado" && (
              <Notice
                tone="ok"
                title={`Agregamos ${cantidad} ${cantidad === 1 ? "unidad" : "unidades"} a tu carrito`}
                action={
                  <>
                    <Button href="/carrito" icon="cart">Ver carrito</Button>
                    <Button variant="ghost" href="/">Seguir comprando</Button>
                  </>
                }
              />
            )}
            {estado === "error" && <Notice tone="danger" title="No pudimos agregar el producto" action={<Button variant="secondary" onClick={agregar}>Reintentar</Button>}>{mensajeError}</Notice>}

            <ul className="detalle-garantias">
              <li><Icon name="card" size={18} /> Pagas en línea con tarjeta, en la página segura de la pasarela.</li>
              <li><Icon name="package" size={18} /> Te enviamos el pedido a la dirección que escribas.</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
