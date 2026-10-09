"use client";

import { useEffect, useState } from "react";
import { api, haySesion, urlImagenProducto } from "@/lib/api";
import { agregarAlCarrito, useCarrito } from "@/lib/useCarrito";
import type { Producto } from "@/lib/types";
import Pantalla from "@/components/Pantalla";
import { Button, CheckoutSteps, EmptyState, Icon, IconButton, LineItem, Notice, OrderSummary, ProductImage, Skeleton, Spinner, formatCOP } from "@/components/ui";

// P-7 Administración del carrito (CU-07) + P-8 Productos complementarios (CU-08, hasta 4). Paso 1 de 4: la persona
// ajusta la cantidad de cada producto y pasa a sus datos de envío. Subtotal, totales de línea y el máximo por
// producto los calcula el servidor. Estados de design/rediseno/pantallas/Carrito.dc.html: con productos, vacío,
// cargando y error.
export default function CarritoPage() {
  const { carrito, estado, recargar, cambiarCantidad, errorLinea } = useCarrito();
  const [complementarios, setComplementarios] = useState<Producto[]>([]);
  const [conSesion, setConSesion] = useState(true);
  const [errorCompl, setErrorCompl] = useState<string | null>(null);

  useEffect(() => setConSesion(haySesion()), []);

  // Sugerencias para los primeros productos del carrito, sin repetir los que ya están y hasta 4.
  const clave = carrito?.items.map((i) => i.productId).join(",") ?? "";
  useEffect(() => {
    const ids = clave ? clave.split(",").map(Number) : [];
    if (ids.length === 0) {
      setComplementarios([]);
      return;
    }
    let vigente = true;
    Promise.all(ids.slice(0, 3).map((id) => api<{ suggestedProduct: Producto }[]>(`/carrito/complementarios/${id}`, { auth: false, cartToken: false }).catch(() => [])))
      .then((listas) => {
        if (!vigente) return;
        const vistos = new Set(ids);
        const unicos: Producto[] = [];
        for (const s of listas.flat()) {
          if (!vistos.has(s.suggestedProduct.id)) {
            vistos.add(s.suggestedProduct.id);
            unicos.push(s.suggestedProduct);
          }
        }
        setComplementarios(unicos.slice(0, 4));
      });
    return () => {
      vigente = false;
    };
  }, [clave]);

  async function agregarComplementario(p: Producto) {
    setErrorCompl(null);
    try {
      await agregarAlCarrito(p.id, 1);
      await recargar();
    } catch {
      setErrorCompl(`No pudimos agregar ${p.name}. Inténtalo de nuevo.`);
    }
  }

  const vacio = estado === "listo" && carrito?.items.length === 0;
  const lleno = estado === "listo" && !!carrito && carrito.items.length > 0;

  return (
    <Pantalla active="carrito">
      <div className="wrap" style={{ paddingTop: 24 }}>
        <CheckoutSteps current={1} back={{ label: "Seguir comprando", href: "/" }} />

        <div className="between" style={{ margin: "24px 0 16px" }}>
          <div>
            <h1 className="h-title">Tu carrito</h1>
            <p className="muted" style={{ marginTop: 4 }}>
              {estado === "cargando"
                ? ""
                : vacio
                  ? "Aún no has agregado productos."
                  : lleno
                    ? `${carrito.unidades} ${carrito.unidades === 1 ? "producto" : "productos"} · Lo guardamos aunque cierres la página.`
                    : ""}
            </p>
          </div>
        </div>

        {vacio && (
          <div className="panel">
            <EmptyState icon="cart" title="Tu carrito está vacío" text="Explora el catálogo y agrega lo que te guste. Aquí lo guardamos mientras decides.">
              <Button icon="grid" href="/">Ver productos</Button>
            </EmptyState>
          </div>
        )}

        {estado === "error" && (
          <Notice
            tone="danger"
            title="No pudimos cargar tu carrito."
            action={
              <>
                <Button variant="secondary" size="sm" icon="refresh" onClick={recargar}>Reintentar</Button>
                <Button variant="ghost" size="sm" href="/">Seguir comprando</Button>
              </>
            }
          >
            <p>Revisa tu conexión e inténtalo de nuevo. Lo que agregaste sigue guardado.</p>
          </Notice>
        )}

        {estado === "cargando" && (
          <div className="checkout">
            <div className="panel">
              <Skeleton variant="line-item" count={2} label="Cargando tu carrito…" />
            </div>
            <div className="panel stack-sm">
              <Spinner label="Calculando el resumen…" />
              <div className="cy-skel" style={{ height: 14, width: "70%" }} />
              <div className="cy-skel" style={{ height: 14, width: "50%" }} />
              <div className="cy-skel" style={{ height: 48, marginTop: 12 }} />
            </div>
          </div>
        )}

        {lleno && (
          <div className="checkout">
            <div className="stack">
              {!conSesion && (
                <Notice
                  tone="info"
                  icon="user"
                  title="Estás comprando como invitado."
                  action={<Button variant="secondary" size="sm" href="/ingresar?volver=/carrito" icon="user">Iniciar sesión</Button>}
                >
                  <p>Inicia sesión para guardar el carrito en tu cuenta. No pierdes lo que agregaste.</p>
                </Notice>
              )}

              <section className="panel" aria-label="Productos en tu carrito" style={{ paddingTop: 4, paddingBottom: 4 }}>
                {carrito.items.map((it) => (
                  <div key={it.id}>
                    <LineItem
                      name={it.product.name}
                      image={urlImagenProducto(it.product.imageUrl)}
                      unitPrice={Number(it.product.digitalPrice)}
                      quantity={it.quantity}
                      max={carrito.maxPorProducto}
                      lineTotal={it.lineTotal}
                      onQuantity={(v) => cambiarCantidad(it.productId, v)}
                      onRemove={() => cambiarCantidad(it.productId, 0)}
                    />
                    {errorLinea?.productId === it.productId && (
                      <p className="cy-error" role="alert" style={{ paddingBottom: 12 }}>
                        <Icon name="alert" size={16} />
                        {errorLinea.texto}
                      </p>
                    )}
                  </div>
                ))}
              </section>

              {complementarios.length > 0 && (
                <section aria-labelledby="compl" style={{ paddingTop: 8 }}>
                  <div className="between" style={{ marginBottom: 10 }}>
                    <h2 id="compl" style={{ fontSize: 15, lineHeight: "20px", fontWeight: 700 }}>Productos complementarios</h2>
                    <p className="small muted">Hasta 4 sugerencias para tu compra</p>
                  </div>
                  {errorCompl && (
                    <div style={{ marginBottom: 10 }}>
                      <Notice tone="danger" title="No pudimos agregarlo."><p>{errorCompl}</p></Notice>
                    </div>
                  )}
                  <div className="compl">
                    {complementarios.map((c) => (
                      <div className="compl-item" key={c.id}>
                        <ProductImage src={urlImagenProducto(c.imageUrl)} alt={c.name} size="mini" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p>{c.name}</p>
                          <strong>{formatCOP(c.digitalPrice)}</strong>
                        </div>
                        <IconButton icon="cart-plus" label={`Agregar ${c.name} al carrito`} align="end" onClick={() => agregarComplementario(c)} />
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="sticky">
              <OrderSummary itemsCount={carrito.unidades} subtotal={carrito.subtotal} total={carrito.subtotal}>
                <Button size="lg" full iconRight="arrow-right" href="/pedido/confirmar">Continuar con tus datos de envío</Button>
                <Button variant="ghost" full href="/">Seguir comprando</Button>
              </OrderSummary>
              <p className="small muted" style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "0 4px" }}>
                <Icon name="ticket" size={18} />
                ¿Tienes un cupón de lealtad? Lo aplicas en el siguiente paso.
              </p>
            </div>
          </div>
        )}
      </div>
    </Pantalla>
  );
}
