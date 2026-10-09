"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError, urlImagenProducto } from "@/lib/api";
import { avisarCambioDeCarrito } from "@/lib/eventos";
import { estadoDePedido, fechaLarga } from "@/lib/pedidos";
import type { Pedido } from "@/lib/types";
import Pantalla from "@/components/Pantalla";
import { Breadcrumbs, Button, EmptyState, Icon, Notice, OrderRow, OrderStatus, Skeleton, Spinner } from "@/components/ui";
import type { OrderStatusKey } from "@/components/ui";

// Mis pedidos. Cada pedido dice su estado en palabras, por qué, y cuál es la siguiente acción. "Cancelar pedido" solo
// existe antes de pagar: un pedido pagado ya no se cancela desde aquí (no hay reembolso en la tienda). Estados de
// design/rediseno/pantallas/Pedidos.dc.html: con pedidos, vacío, sin sesión y cargando. Totales del servidor.
type Carga = "cargando" | "listo" | "sesion" | "error";

const LEYENDA: Array<{ key: OrderStatusKey; texto: string }> = [
  { key: "creado", texto: "Falta pagarlo con tarjeta." },
  { key: "pagado", texto: "Recibimos tu pago; pronto empezamos a alistarlo." },
  { key: "en-alistamiento", texto: "Lo estamos preparando; ya no se puede cancelar." },
  { key: "entregado", texto: "Llegó a tu dirección." },
  { key: "pago-fallido", texto: "El pago no se completó; puedes intentarlo otra vez." },
  { key: "cancelado", texto: "Se canceló." },
];

function motivo(p: Pedido, estado: OrderStatusKey): string | undefined {
  if (estado === "pago-fallido") return "La pasarela no completó el pago con tarjeta. No se hizo ningún cobro; puedes pagarlo de nuevo.";
  if (estado === "cancelado") {
    return p.payment?.status === "CONFIRMED"
      ? "Este pedido se canceló después de recibir el pago. El reembolso lo gestiona la tienda."
      : "Este pedido se canceló antes del alistamiento. No se hizo ningún cobro.";
  }
  return undefined;
}

export default function PedidosPage() {
  const [carga, setCarga] = useState<Carga>("cargando");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [porCancelar, setPorCancelar] = useState<number | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; texto: string } | null>(null);

  const cargar = useCallback(async () => {
    setCarga("cargando");
    try {
      setPedidos(await api<Pedido[]>("/pedidos"));
      setCarga("listo");
    } catch (e) {
      setCarga(e instanceof ApiError && e.status === 401 ? "sesion" : "error");
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function cancelar(id: number) {
    setCancelando(true);
    setResultado(null);
    try {
      await api(`/pedidos/${id}/cancelar`, { method: "POST" });
      setResultado({ ok: true, texto: `Cancelamos el pedido #${id}. No se hizo ningún cobro y liberamos tus unidades.` });
      avisarCambioDeCarrito();
      await cargar();
    } catch {
      setResultado({ ok: false, texto: `No pudimos cancelar el pedido #${id}. Si ya empezamos a alistarlo, ya no se puede cancelar. Revisa su estado e inténtalo de nuevo.` });
    } finally {
      setCancelando(false);
      setPorCancelar(null);
    }
  }

  return (
    <Pantalla active="pedidos">
      <div className="wrap" style={{ paddingTop: 16 }}>
        <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Mis pedidos" }]} />
        <div style={{ margin: "12px 0 20px" }}>
          <h1 className="h-title">Mis pedidos</h1>
          <p className="muted" style={{ marginTop: 4 }}>
            {carga === "listo" && pedidos.length > 0
              ? `${pedidos.length} ${pedidos.length === 1 ? "pedido" : "pedidos"} · El más reciente primero`
              : carga === "listo"
                ? "Aquí verás el estado de cada compra."
                : carga === "cargando"
                  ? "Buscando tus pedidos…"
                  : carga === "sesion"
                    ? "Necesitas iniciar sesión."
                    : ""}
          </p>
        </div>

        {carga === "sesion" && (
          <div className="panel">
            <EmptyState icon="user" title="Inicia sesión para ver tus pedidos" text="Tus pedidos se guardan en tu cuenta. Al iniciar sesión vuelves directo a esta página.">
              <Button icon="user" href="/ingresar?volver=/pedidos">Iniciar sesión</Button>
              <Button variant="secondary" href="/registro?volver=/pedidos">Crear cuenta</Button>
            </EmptyState>
          </div>
        )}

        {carga === "error" && (
          <Notice tone="danger" title="No pudimos cargar tus pedidos." action={<Button variant="secondary" size="sm" icon="refresh" onClick={cargar}>Reintentar</Button>}>
            <p>Revisa tu conexión e inténtalo de nuevo. Tus pedidos siguen guardados.</p>
          </Notice>
        )}

        {carga === "cargando" && (
          <div className="checkout">
            <div className="stack">
              <Spinner label="Cargando tus pedidos…" />
              <div className="panel"><Skeleton variant="line-item" count={2} label="Cargando tus pedidos…" /></div>
              <div className="panel"><Skeleton variant="line-item" count={1} label="Cargando tus pedidos…" /></div>
            </div>
          </div>
        )}

        {carga === "listo" && pedidos.length === 0 && (
          <div className="panel">
            <EmptyState icon="receipt" title="Todavía no tienes pedidos" text="Cuando confirmes tu primera compra, aquí verás su estado y lo que sigue.">
              <Button icon="grid" href="/">Ver productos</Button>
            </EmptyState>
          </div>
        )}

        {carga === "listo" && pedidos.length > 0 && (
          <div className="checkout">
            <div className="stack">
              {resultado && (
                <Notice tone={resultado.ok ? "ok" : "danger"} title={resultado.ok ? "Pedido cancelado." : "No pudimos cancelar el pedido."}>
                  <p>{resultado.texto}</p>
                </Notice>
              )}
              {pedidos.map((p) => {
                const estado = estadoDePedido(p.status);
                return (
                  <div key={p.id} className="stack-sm">
                    {porCancelar === p.id && (
                      <Notice
                        tone="warn"
                        title={`¿Cancelar el pedido #${p.id}?`}
                        action={
                          <>
                            <Button variant="ghost-danger" size="sm" loading={cancelando} onClick={() => cancelar(p.id)}>Sí, cancelar pedido</Button>
                            <Button variant="secondary" size="sm" disabled={cancelando} onClick={() => setPorCancelar(null)}>No, mantenerlo</Button>
                          </>
                        }
                      >
                        <p>Liberamos tus unidades y no se hace ningún cobro. Para comprarlo de nuevo tendrás que armar otro pedido.</p>
                      </Notice>
                    )}
                    <OrderRow
                      number={p.id}
                      date={fechaLarga(p.createdAt)}
                      status={estado}
                      itemsCount={p.items.reduce((acc, i) => acc + i.quantity, 0)}
                      total={p.total}
                      city={p.shippingCity ?? "—"}
                      images={p.items.map((i) => urlImagenProducto(i.product.imageUrl) ?? "")}
                      reason={motivo(p, estado)}
                      note={estado === "pagado" ? "Ya recibimos tu pago, por eso este pedido no se puede cancelar desde aquí." : undefined}
                      payHref={`/pago/${p.id}`}
                      viewHref={`/comprobante/${p.id}`}
                      onCancel={estado === "creado" ? () => setPorCancelar(p.id) : undefined}
                    />
                  </div>
                );
              })}
            </div>
            <aside className="sticky">
              <section className="panel" aria-labelledby="leer">
                <h2 id="leer" className="panel-title"><Icon name="help" size={20} />Qué significa cada estado</h2>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                  {LEYENDA.map((l) => (
                    <li key={l.key} className="stack-sm" style={{ gap: 4 }}>
                      <OrderStatus status={l.key} />
                      <span className="small muted">{l.texto}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <p className="small muted" style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "0 4px" }}>
                <Icon name="info" size={16} />
                Puedes cancelar un pedido mientras falte pagarlo. Después de pagar ya no se puede cancelar desde aquí.
              </p>
            </aside>
          </div>
        )}
      </div>
    </Pantalla>
  );
}
