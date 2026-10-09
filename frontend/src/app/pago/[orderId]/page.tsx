"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { api, ApiError, urlImagenProducto } from "@/lib/api";
import type { Pedido } from "@/lib/types";
import Pantalla from "@/components/Pantalla";
import { Button, CheckoutSteps, EmptyState, Icon, InfoTip, Notice, OrderSummary, ShippingSummary, Skeleton, formatCOP } from "@/components/ui";

// P-15 Pago con tarjeta (CU-15). Paso 3 de 4: la tarjeta se escribe en la página segura de la pasarela, nunca en
// ComproYa (RN-06); este paso explica cómo funciona y lleva allá. El total es el que calcula el servidor y el que
// se cobra. Estados de design/rediseno/pantallas/Pago.dc.html: normal, abriendo la pasarela y no se completó
// (regreso con ?cancelado=1).
type Carga = "cargando" | "listo" | "sesion" | "ajeno" | "error";

function Pago() {
  const orderId = Number(useParams<{ orderId: string }>().orderId);
  const canceladoEnPasarela = !!useSearchParams().get("cancelado");
  const [carga, setCarga] = useState<Carga>("cargando");
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [abriendo, setAbriendo] = useState(false);
  const [falloAlAbrir, setFalloAlAbrir] = useState<string | null>(null);

  useEffect(() => {
    api<Pedido>(`/pedidos/${orderId}`)
      .then((p) => {
        setPedido(p);
        setCarga("listo");
      })
      .catch((e) => setCarga(e instanceof ApiError ? (e.status === 401 ? "sesion" : e.status === 403 ? "ajeno" : "error") : "error"));
  }, [orderId]);

  async function pagar() {
    setFalloAlAbrir(null);
    setAbriendo(true);
    try {
      const { redirectUrl } = await api<{ redirectUrl: string }>(`/pagos/tarjeta/${orderId}`, { method: "POST" });
      window.location.href = redirectUrl;
    } catch (e) {
      setFalloAlAbrir(
        e instanceof ApiError && /ya no admite/.test(e.message)
          ? "Este pedido ya no admite pagos. Revisa su estado en Mis pedidos."
          : "No pudimos abrir la pasarela de pago. No se hizo ningún cobro; inténtalo de nuevo.",
      );
      setAbriendo(false);
    }
  }

  const puedePagar = pedido?.status === "CREATED" || pedido?.status === "PAYMENT_FAILED";
  const yaPagado = !!pedido && ["PAID", "PREPARING", "READY_FOR_PICKUP", "DELIVERED"].includes(pedido.status);
  const cancelado = pedido?.status === "CANCELLED";
  const unidades = pedido?.items.reduce((acc, i) => acc + i.quantity, 0) ?? 0;
  const etiqueta = abriendo ? "Abriendo la pasarela…" : canceladoEnPasarela || pedido?.status === "PAYMENT_FAILED" ? "Intentar el pago de nuevo" : "Pagar con tarjeta";
  const volver = puedePagar ? `/pedido/confirmar?pedido=${orderId}` : "/pedidos";

  return (
    <Pantalla active="carrito" variant="compact">
      <div className="wrap" style={{ paddingTop: 24 }}>
        <CheckoutSteps current={3} back={{ label: puedePagar ? "Volver a tus datos" : "Ver mis pedidos", href: volver }} />

        <div style={{ margin: "24px 0 16px" }}>
          <h1 className="h-title">Pagar pedido #{orderId}</h1>
          {pedido && puedePagar && (
            <p className="muted" style={{ marginTop: 4 }}>
              Total a pagar: <strong style={{ color: "var(--ink)" }}>{formatCOP(pedido.total)}</strong>
            </p>
          )}
        </div>

        {carga === "sesion" && (
          <div className="panel">
            <EmptyState icon="user" title="Inicia sesión para pagar tu pedido" text="Necesitamos saber quién hizo el pedido. Al iniciar sesión vuelves a esta página.">
              <Button icon="user" href={`/ingresar?volver=/pago/${orderId}`}>Iniciar sesión</Button>
              <Button variant="secondary" href={`/registro?volver=/pago/${orderId}`}>Crear cuenta</Button>
            </EmptyState>
          </div>
        )}
        {carga === "ajeno" && (
          <div className="panel">
            <EmptyState icon="receipt" title="No encontramos este pedido en tu cuenta" text="Revisa que hayas iniciado sesión con la cuenta que hizo el pedido.">
              <Button icon="receipt" href="/pedidos">Ver mis pedidos</Button>
            </EmptyState>
          </div>
        )}
        {carga === "error" && (
          <Notice
            tone="danger"
            title="No pudimos cargar tu pedido."
            action={<Button variant="secondary" size="sm" icon="refresh" onClick={() => location.reload()}>Reintentar</Button>}
          >
            <p>Revisa tu conexión e inténtalo de nuevo. Tu pedido sigue guardado en Mis pedidos.</p>
          </Notice>
        )}
        {carga === "cargando" && (
          <div className="checkout">
            <div className="stack">
              <div className="panel"><Skeleton variant="line-item" count={2} label="Cargando tu pedido…" /></div>
            </div>
            <div className="panel"><div className="cy-skel" style={{ height: 160 }} /></div>
          </div>
        )}

        {carga === "listo" && pedido && (
          <div className="checkout">
            <div className="stack">
              {yaPagado && (
                <Notice tone="ok" title="Este pedido ya está pagado." action={<Button size="sm" icon="receipt" href={`/comprobante/${orderId}`}>Ver pedido confirmado</Button>}>
                  <p>No hace falta pagar de nuevo. Mira su estado y lo que sigue.</p>
                </Notice>
              )}
              {cancelado && (
                <Notice tone="info" title="Este pedido se canceló." action={<Button size="sm" variant="secondary" href="/">Seguir comprando</Button>}>
                  <p>No se hizo ningún cobro. Puedes armar un pedido nuevo desde el catálogo.</p>
                </Notice>
              )}
              {canceladoEnPasarela && puedePagar && (
                <Notice tone="danger" title="No se completó tu pago." action={<Button variant="secondary" size="sm" icon="receipt" href="/pedidos">Ver mis pedidos</Button>}>
                  <p>Volviste de la pasarela sin terminar el pago. No se hizo ningún cobro y tus unidades siguen reservadas. Pulsa «Intentar el pago de nuevo» o revisa el pedido más tarde en Mis pedidos.</p>
                </Notice>
              )}
              {pedido.status === "PAYMENT_FAILED" && !canceladoEnPasarela && (
                <Notice tone="danger" title="El pago de este pedido no se completó." action={<Button variant="secondary" size="sm" icon="receipt" href="/pedidos">Ver mis pedidos</Button>}>
                  <p>No se hizo ningún cobro. Puedes intentar el pago de nuevo con la misma tarjeta o con otra.</p>
                </Notice>
              )}
              {abriendo && (
                <Notice tone="progress" progress title="Abriendo la pasarela segura…">
                  <p>En unos segundos verás la página de pago. No cierres esta ventana.</p>
                </Notice>
              )}
              {falloAlAbrir && (
                <Notice tone="danger" title="No pudimos abrir la pasarela." action={<Button variant="secondary" size="sm" icon="receipt" href="/pedidos">Ver mis pedidos</Button>}>
                  <p>{falloAlAbrir}</p>
                </Notice>
              )}

              {puedePagar && (
                <>
                  <section className="panel" aria-labelledby="como">
                    <div className="pay-hero">
                      <span className="pay-ic"><Icon name="card" size={26} /></span>
                      <div className="stack-sm" style={{ flex: 1 }}>
                        <h2 id="como" style={{ fontSize: 18, lineHeight: "24px", fontWeight: 700 }}>Pago con tarjeta</h2>
                        <p>
                          Te llevamos a la página segura de la{" "}
                          <InfoTip term="la pasarela de pagos" tip="Página segura de Stripe donde escribes tu tarjeta. ComproYa nunca la ve.">pasarela de pagos</InfoTip>{" "}
                          para que escribas tu tarjeta. <strong>ComproYa nunca ve ni guarda los datos de tu tarjeta.</strong>
                        </p>
                      </div>
                    </div>
                    <ol className="pay-steps" style={{ marginTop: 20 }}>
                      <li><span>Pulsa <strong>«Pagar con tarjeta»</strong>.</span></li>
                      <li><span>Escribe tu tarjeta en la página segura de la pasarela.</span></li>
                      <li><span>Vuelves aquí y ves <strong>«Pedido confirmado»</strong> con tu número de pedido.</span></li>
                    </ol>
                  </section>

                  <Notice tone="test" icon="card" title="Modo de prueba">
                    <p>Usa la tarjeta <strong style={{ letterSpacing: ".04em" }}>4242 4242 4242 4242</strong>, cualquier fecha futura y cualquier código de seguridad. No se hace ningún cobro real.</p>
                  </Notice>
                </>
              )}

              {pedido.shippingAddress && (
                <ShippingSummary
                  name={pedido.shippingName ?? ""}
                  address={pedido.shippingAddress}
                  city={pedido.shippingCity ?? ""}
                  notes={pedido.shippingNotes ?? undefined}
                  phone={pedido.shippingPhone ?? undefined}
                  editHref={puedePagar ? volver : undefined}
                />
              )}
            </div>

            <div className="sticky">
              <OrderSummary
                items={pedido.items.map((i) => ({ name: i.product.name, image: urlImagenProducto(i.product.imageUrl) ?? undefined, quantity: i.quantity, lineTotal: Number(i.unitPrice) * i.quantity }))}
                itemsCount={unidades}
                subtotal={pedido.subtotal}
                discount={pedido.descuento}
                discountLabel={pedido.codigoCupon ? `Descuento por cupón ${pedido.codigoCupon}` : undefined}
                total={pedido.total}
                totalLabel="Total a pagar"
                note={puedePagar ? "Tus unidades están reservadas mientras pagas." : undefined}
                secure={puedePagar}
              >
                {puedePagar && (
                  <Button size="lg" full icon="lock" loading={abriendo} onClick={pagar} tooltip="Abre la página segura de la pasarela de pagos">
                    {etiqueta}
                  </Button>
                )}
              </OrderSummary>
            </div>
          </div>
        )}
      </div>
    </Pantalla>
  );
}

export default function PagoPage() {
  return (
    <Suspense fallback={<Pantalla active="carrito" variant="compact"><div className="wrap sec"><Skeleton variant="line-item" count={2} label="Cargando…" /></div></Pantalla>}>
      <Pago />
    </Suspense>
  );
}
