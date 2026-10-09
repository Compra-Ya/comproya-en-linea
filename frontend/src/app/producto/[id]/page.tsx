"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError, urlImagenProducto } from "@/lib/api";
import { infoCategoria } from "@/lib/categorias";
import { agregarAlCarrito } from "@/lib/useCarrito";
import type { Producto } from "@/lib/types";
import Pantalla from "@/components/Pantalla";
import { AddedToCart, Badge, Breadcrumbs, Button, EmptyState, Enlace, formatCOP, Icon, IconButton, InfoTip, Notice, ProductImage, QuantityStepper, Skeleton, Spinner } from "@/components/ui";

// P-3 Detalle de producto. Foto grande, precio, unidades disponibles (con su "?"), cantidad hasta el máximo por
// pedido que fija el servidor, "Agregar al carrito" con la confirmación en el mismo lugar, garantías de una línea
// y productos complementarios (hasta 4). Estados de design/rediseno/pantallas/Producto.dc.html: disponible,
// agregado, agotado, cargando y no disponible.
type Estado = "cargando" | "listo" | "no-disponible";

export default function ProductoPage() {
  const id = Number(useParams<{ id: string }>().id);
  const [estado, setEstado] = useState<Estado>("cargando");
  const [producto, setProducto] = useState<Producto | null>(null);
  const [complementarios, setComplementarios] = useState<Producto[]>([]);
  const [cantidad, setCantidad] = useState(1);
  const [agregando, setAgregando] = useState(false);
  const [agregadas, setAgregadas] = useState<number | null>(null);
  const [errorAgregar, setErrorAgregar] = useState<string | null>(null);
  const [agregadosCompl, setAgregadosCompl] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setEstado("cargando");
    setAgregadas(null);
    setCantidad(1);
    api<Producto>(`/catalogo/productos/${id}`, { auth: false, cartToken: false })
      .then((p) => {
        setProducto(p);
        setEstado("listo");
      })
      .catch(() => setEstado("no-disponible"));
    api<{ suggestedProduct: Producto }[]>(`/carrito/complementarios/${id}`, { auth: false, cartToken: false })
      .then((r) => setComplementarios(r.map((s) => s.suggestedProduct)))
      .catch(() => setComplementarios([]));
  }, [id]);

  const info = infoCategoria(producto?.category?.name);
  const unidades = producto?.unidadesDisponibles ?? 0;
  const maximo = producto?.maximoPorPedido ?? 0;
  const agotado = estado === "listo" && unidades === 0;

  async function agregar() {
    if (!producto) return;
    setAgregando(true);
    setErrorAgregar(null);
    try {
      await agregarAlCarrito(producto.id, cantidad);
      setAgregadas(cantidad);
    } catch (e) {
      setErrorAgregar(e instanceof ApiError && e.status === 400 ? `${e.message}.` : "No pudimos agregar el producto. Inténtalo de nuevo.");
    } finally {
      setAgregando(false);
    }
  }

  async function agregarComplementario(p: Producto) {
    try {
      await agregarAlCarrito(p.id, 1);
      setAgregadosCompl((a) => ({ ...a, [p.id]: true }));
    } catch {
      setErrorAgregar(`No pudimos agregar ${p.name}. Inténtalo de nuevo.`);
    }
  }

  const migas =
    estado === "no-disponible"
      ? [{ label: "Inicio", href: "/" }, { label: "Producto no disponible" }]
      : [
          { label: "Inicio", href: "/" },
          ...(producto?.category ? [{ label: info.nombre, href: `/categoria/${producto.category.id}` }] : []),
          { label: producto?.name ?? "Producto" },
        ];

  return (
    <Pantalla active="catalogo">
      <div className="wrap" style={{ paddingTop: 16 }}>
        <Breadcrumbs items={migas} />
      </div>

      {estado === "no-disponible" && (
        <section className="wrap sec">
          <div className="panel">
            <EmptyState
              icon="package"
              title="Este producto ya no está disponible en la tienda en línea"
              text="Puede que se haya agotado de forma definitiva o que ya no se venda. Mira otros productos del catálogo."
              action={<Button icon="grid" href="/">Volver al catálogo</Button>}
            />
          </div>
        </section>
      )}

      {estado === "cargando" && (
        <section className="wrap" style={{ paddingTop: 12 }}>
          <div className="pdp">
            <div className="pdp-media"><div className="cy-skel" style={{ aspectRatio: "1 / 1", borderRadius: 14 }} /></div>
            <div className="pdp-buy">
              <Spinner label="Cargando el producto…" />
              <div className="cy-skel" style={{ height: 16, width: "30%" }} />
              <div className="cy-skel" style={{ height: 34, width: "85%" }} />
              <div className="cy-skel" style={{ height: 40, width: "40%" }} />
              <div className="cy-skel" style={{ height: 180, borderRadius: 14 }} />
              <div className="cy-skel" style={{ height: 120, borderRadius: 14 }} />
            </div>
          </div>
        </section>
      )}

      {estado === "listo" && producto && (
        <>
          <section className="wrap" style={{ paddingTop: 12 }} aria-labelledby="p-name">
            <div className="pdp">
              <div className="pdp-media">
                <ProductImage src={urlImagenProducto(producto.imageUrl)} alt={producto.name} category={info.nombre} />
              </div>

              <div className="pdp-buy">
                {producto.category && (
                  <Enlace href={`/categoria/${producto.category.id}`} className="cy-link toque" style={{ alignSelf: "flex-start", fontSize: 14 }}>
                    {info.nombre}
                  </Enlace>
                )}
                <h1 id="p-name" className="h-title" style={{ fontSize: 32, lineHeight: "38px" }}>{producto.name}</h1>
                <p className="pdp-price">{formatCOP(producto.digitalPrice)}</p>

                {agotado ? (
                  <p className="stock stock-out">
                    <Icon name="x" size={18} />
                    Producto agotado: por ahora no hay unidades
                  </p>
                ) : (
                  <p className="stock">
                    <Icon name="check-circle" size={18} />
                    <InfoTip term="unidades disponibles" tip="Las que puedes comprar ahora; ya descuentan las reservadas por otros pedidos.">
                      Hay {unidades.toLocaleString("es-CO")} {unidades === 1 ? "unidad disponible" : "unidades disponibles"}
                    </InfoTip>
                  </p>
                )}

                <div className="pdp-box">
                  {!agotado && (
                    <div>
                      <p className="cy-label" style={{ display: "block", marginBottom: 6 }}>Cantidad</p>
                      <QuantityStepper
                        value={cantidad}
                        onChange={setCantidad}
                        max={maximo}
                        hint={`Máximo ${maximo} ${maximo === 1 ? "unidad" : "unidades"} por pedido`}
                        label={`Cantidad de ${producto.name}`}
                      />
                    </div>
                  )}

                  {agotado ? (
                    <>
                      <Button size="lg" full icon="cart-plus" disabled disabledReason={`Producto agotado: por ahora no hay unidades. Mira otros productos de ${info.nombre}.`}>
                        Agotado
                      </Button>
                      {producto.category && (
                        <Button variant="secondary" icon="grid" href={`/categoria/${producto.category.id}`}>
                          Ver otros productos de {info.nombre}
                        </Button>
                      )}
                    </>
                  ) : agregadas ? (
                    <AddedToCart quantity={agregadas} onContinue={() => setAgregadas(null)} />
                  ) : (
                    <Button size="lg" full icon="cart-plus" loading={agregando} onClick={agregar} tooltip={`Agregar ${producto.name} al carrito`}>
                      {agregando ? "Agregando…" : "Agregar al carrito"}
                    </Button>
                  )}

                  {errorAgregar && (
                    <Notice tone="warn" title="No pudimos agregarlo." action={<Button variant="secondary" size="sm" icon="cart" href="/carrito">Ver carrito</Button>}>
                      <p>{errorAgregar}</p>
                    </Notice>
                  )}
                </div>

                <ul className="guarantees" aria-label="Cómo compras">
                  <li>
                    <span className="g-ic"><Icon name="lock" size={18} /></span>
                    <span>
                      <strong>Pago con tarjeta seguro.</strong>{" "}
                      <InfoTip term="la pasarela de pagos" tip="Página segura de Stripe donde escribes tu tarjeta. ComproYa nunca la ve.">
                        Escribes tu tarjeta en la pasarela de pagos
                      </InfoTip>
                    </span>
                  </li>
                  <li>
                    <span className="g-ic"><Icon name="truck" size={18} /></span>
                    <span><strong>Envío a domicilio.</strong> Te lo enviamos a la dirección que escribas al hacer el pedido.</span>
                  </li>
                  <li>
                    <span className="g-ic"><Icon name="clock" size={18} /></span>
                    <span><strong>Unidades reservadas.</strong> Las apartamos para ti mientras pagas.</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {complementarios.length > 0 && (
            <section className="wrap sec-lg" aria-labelledby="compl">
              <div className="between" style={{ marginBottom: 12 }}>
                <h2 id="compl" style={{ fontSize: 16, lineHeight: "22px", fontWeight: 700 }}>Productos complementarios</h2>
                <p className="small muted">Van bien con este producto</p>
              </div>
              <div className="compl">
                {complementarios.map((c) => (
                  <div className="compl-item" key={c.id}>
                    <ProductImage src={urlImagenProducto(c.imageUrl)} alt={c.name} size="mini" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p>
                        <Enlace href={`/producto/${c.id}`} style={{ color: "inherit" }}>{c.name}</Enlace>
                      </p>
                      <strong>{formatCOP(c.digitalPrice)}</strong>
                    </div>
                    {agregadosCompl[c.id] ? (
                      <Badge tone="ok" icon="check">Agregado</Badge>
                    ) : (
                      <IconButton icon="cart-plus" label={`Agregar ${c.name} al carrito`} align="end" onClick={() => agregarComplementario(c)} />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
      {estado === "cargando" && <div className="wrap sec-lg"><Skeleton variant="text" count={1} label="Cargando…" /></div>}
    </Pantalla>
  );
}
