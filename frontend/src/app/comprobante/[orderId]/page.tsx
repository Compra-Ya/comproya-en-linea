"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError, getStoredCustomer, urlImagenProducto } from "@/lib/api";
import { primerNombre } from "@/lib/pedidos";
import type { Comprobante } from "@/lib/types";
import Pantalla from "@/components/Pantalla";
import { Button, CheckoutSteps, EmptyState, Icon, LineItem, Notice, OrderSummary, ShippingSummary, Skeleton } from "@/components/ui";

// P-17 Pedido confirmado (CU-17). Paso 4 de 4. Solo se muestra cuando la pasarela ya avisó que el pago quedó
// confirmado; mientras tanto el servidor responde 400 y esta pantalla pregunta cada 2 s hasta 30 s, diciendo qué
// pasa. Cada fallo se explica según su causa: sin sesión (401), pedido de otra cuenta (403), pago sin confirmar
// o error de conexión. El total es el que cobró el servidor. Estados de design/rediseno/pantallas/Confirmado.dc.html:
// confirmado, confirmando y la confirmación tarda.
const INTENTOS_MAXIMOS = 15;
const ESPERA_MS = 2000;

type Fase = "confirmando" | "confirmado" | "tarda" | "sesion" | "ajeno" | "error";

export default function PedidoConfirmadoPage() {
  const orderId = Number(useParams<{ orderId: string }>().orderId);
  const [fase, setFase] = useState<Fase>("confirmando");
  const [comprobante, setComprobante] = useState<Comprobante | null>(null);
  const [ronda, setRonda] = useState(0);
  const [nombre, setNombre] = useState<string | undefined>(undefined);

  useEffect(() => setNombre(primerNombre(getStoredCustomer()?.name)), []);

  useEffect(() => {
    let vigente = true;
    let intentos = 0;
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    setFase("confirmando");

    async function consultar() {
      try {
        const r = await api<Comprobante>(`/pagos/${orderId}/comprobante`);
        if (!vigente) return;
        setComprobante(r);
        setFase("confirmado");
      } catch (e) {
        if (!vigente) return;
        const estado = e instanceof ApiError ? e.status : 0;
        // 401 y 403 no se arreglan esperando: se muestran de inmediato.
        if (estado === 401) return setFase("sesion");
        if (estado === 403) return setFase("ajeno");
        intentos += 1;
        if (intentos >= INTENTOS_MAXIMOS) return setFase(estado === 400 ? "tarda" : "error");
        temporizador = setTimeout(consultar, ESPERA_MS);
      }
    }
    consultar();
    return () => {
      vigente = false;
      if (temporizador) clearTimeout(temporizador);
    };
  }, [orderId, ronda]);

  const unidades = comprobante?.items.reduce((acc, i) => acc + i.quantity, 0) ?? 0;

  return (
    <Pantalla active="pedidos" variant="compact">
      <div className="wrap" style={{ paddingTop: 24 }}>
        <CheckoutSteps current={4} />

        {fase === "confirmando" && (
          <div className="stack" style={{ marginTop: 24, maxWidth: 760 }}>
            <h1 className="h-title">Pedido #{orderId}</h1>
            <Notice tone="progress" progress title="Estamos confirmando tu pago…">
              <p>La pasarela nos está avisando que pagaste. Suele tardar unos segundos; esta página se actualiza sola. No cierres esta ventana ni vuelvas a pagar.</p>
            </Notice>
            <div className="panel"><Skeleton variant="line-item" count={2} label="Cargando el detalle del pedido…" /></div>
          </div>
        )}

        {fase === "tarda" && (
          <div className="stack" style={{ marginTop: 24, maxWidth: 760 }}>
            <h1 className="h-title">Pedido #{orderId}</h1>
            <Notice
              tone="warn"
              icon="clock"
              title="Todavía no recibimos la confirmación de tu pago."
              action={
                <>
                  <Button variant="secondary" size="sm" icon="refresh" onClick={() => setRonda((r) => r + 1)}>Revisar de nuevo</Button>
                  <Button variant="ghost" size="sm" href="/pedidos">Ver mis pedidos</Button>
                </>
              }
            >
              <p>Si ya pagaste, no vuelvas a pagar: a veces la pasarela tarda unos minutos en avisarnos. Revisa de nuevo en un momento o mira el estado del pedido en Mis pedidos.</p>
            </Notice>
            <p className="small muted" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <Icon name="info" size={16} />
              Si el pago no se completó, en Mis pedidos verás «Pago fallido» con la opción de pagar otra vez. No se hace ningún cobro dos veces.
            </p>
          </div>
        )}

        {fase === "sesion" && (
          <div className="panel" style={{ marginTop: 24 }}>
            <EmptyState icon="user" title="Inicia sesión para ver tu pedido" text="Tu pedido está guardado en tu cuenta. Al iniciar sesión vuelves a esta página.">
              <Button icon="user" href={`/ingresar?volver=/comprobante/${orderId}`}>Iniciar sesión</Button>
              <Button variant="secondary" href={`/registro?volver=/comprobante/${orderId}`}>Crear cuenta</Button>
            </EmptyState>
          </div>
        )}

        {fase === "ajeno" && (
          <div className="panel" style={{ marginTop: 24 }}>
            <EmptyState icon="receipt" title="No encontramos este pedido en tu cuenta" text="Revisa que hayas iniciado sesión con la cuenta que hizo el pedido.">
              <Button icon="receipt" href="/pedidos">Ver mis pedidos</Button>
            </EmptyState>
          </div>
        )}

        {fase === "error" && (
          <div className="stack" style={{ marginTop: 24, maxWidth: 760 }}>
            <h1 className="h-title">Pedido #{orderId}</h1>
            <Notice
              tone="danger"
              title="No pudimos consultar tu pedido."
              action={
                <>
                  <Button variant="secondary" size="sm" icon="refresh" onClick={() => setRonda((r) => r + 1)}>Reintentar</Button>
                  <Button variant="ghost" size="sm" href="/pedidos">Ver mis pedidos</Button>
                </>
              }
            >
              <p>Revisa tu conexión e inténtalo de nuevo. Si ya pagaste, tu pedido está guardado y no se cobra dos veces.</p>
            </Notice>
          </div>
        )}

        {fase === "confirmado" && comprobante && (
          <>
            <section className="confirm-hero" style={{ marginTop: 24 }} aria-labelledby="ok-title">
              <span className="confetti" aria-hidden="true" style={{ left: "12%", top: "22%", background: "var(--orange-500)", transform: "rotate(18deg)" }} />
              <span className="confetti" aria-hidden="true" style={{ left: "20%", top: "64%", background: "var(--navy-700)", transform: "rotate(-12deg)", borderRadius: "50%" }} />
              <span className="confetti" aria-hidden="true" style={{ left: "30%", top: "14%", background: "var(--ok)", transform: "rotate(40deg)" }} />
              <span className="confetti" aria-hidden="true" style={{ right: "14%", top: "26%", background: "var(--navy-700)", transform: "rotate(-30deg)" }} />
              <span className="confetti" aria-hidden="true" style={{ right: "22%", top: "70%", background: "var(--orange-500)", borderRadius: "50%" }} />
              <span className="confetti" aria-hidden="true" style={{ right: "30%", top: "12%", background: "var(--orange-600)", transform: "rotate(12deg)" }} />
              <span className="confirm-badge"><Icon name="check-circle" size={44} /></span>
              <h1 id="ok-title" className="h-title" style={{ fontSize: 32, lineHeight: "38px" }}>¡Pedido confirmado!</h1>
              <p className="muted" style={{ fontSize: 16, lineHeight: "24px", maxWidth: 520 }}>
                {nombre ? `Gracias, ${nombre}. ` : "Gracias. "}Recibimos tu pago y empezamos a preparar tu pedido para enviarlo.
              </p>
              <span className="order-no"><Icon name="receipt" size={20} />Pedido #{comprobante.idPedido}</span>
              <div className="row" style={{ justifyContent: "center", marginTop: 8 }}>
                <Button size="lg" href="/pedidos" icon="receipt">Ver mis pedidos</Button>
                <Button variant="secondary" size="lg" href="/" icon="grid">Seguir comprando</Button>
              </div>
            </section>

            <div className="checkout sec">
              <div className="stack">
                <section className="panel" aria-labelledby="prod" style={{ paddingBottom: 4 }}>
                  <h2 id="prod" className="panel-title"><Icon name="package" size={20} />Productos de tu pedido</h2>
                  {comprobante.items.map((it) => (
                    <LineItem
                      key={it.id}
                      name={it.product.name}
                      image={urlImagenProducto(it.product.imageUrl)}
                      unitPrice={Number(it.unitPrice)}
                      quantity={it.quantity}
                      readOnly
                    />
                  ))}
                </section>
                <section className="panel" aria-labelledby="sigue">
                  <h2 id="sigue" className="panel-title"><Icon name="truck" size={20} />¿Qué sigue?</h2>
                  <ol className="pay-steps">
                    <li><span><strong>Alistamos tu pedido.</strong> Mientras no empiece el alistamiento, puedes verlo en Mis pedidos.</span></li>
                    <li><span><strong>Te lo enviamos</strong> a la dirección que escribiste.</span></li>
                    <li><span><strong>Sigues su estado</strong> en Mis pedidos, en palabras: Pagado, En alistamiento, Entregado.</span></li>
                  </ol>
                </section>
              </div>
              <div className="sticky">
                <OrderSummary
                  title="Total pagado"
                  itemsCount={unidades}
                  subtotal={comprobante.subtotal}
                  discount={comprobante.descuento}
                  discountLabel={comprobante.codigoCupon ? `Descuento por cupón ${comprobante.codigoCupon}` : undefined}
                  total={comprobante.total}
                  totalLabel="Total pagado"
                />
                {comprobante.shippingAddress && (
                  <ShippingSummary
                    title="Enviaremos tu pedido a"
                    name={comprobante.shippingName ?? ""}
                    address={comprobante.shippingAddress}
                    city={comprobante.shippingCity ?? ""}
                    notes={comprobante.shippingNotes ?? undefined}
                    phone={comprobante.shippingPhone ?? undefined}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Pantalla>
  );
}
