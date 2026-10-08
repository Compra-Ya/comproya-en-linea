"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { MODO_ENVIO } from "@/lib/modo";
import type { Pedido } from "@/lib/types";
import ShopHeaderConectado from "@/components/ShopHeaderConectado";
import { Button, Icon, Notice, formatoCOP } from "@/components/ui";

// Mis pedidos: punto de entrada para volver a pagar o ver un pedido ya confirmado. Cada pedido dice
// su estado en palabras y cuál es la siguiente acción. Estados del canon; en la venta digital
// "Listo para retiro" se lee como "Listo para despacho".
const ETIQUETA_ESTADO: Record<string, string> = {
  CREATED: "Creado, pendiente de pago",
  PAID: "Pagado",
  PREPARING: "En alistamiento",
  READY_FOR_PICKUP: MODO_ENVIO ? "Listo para despacho" : "Listo para retiro",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  PAYMENT_FAILED: "Pago fallido",
};

const NOTA_ESTADO: Record<string, string> = {
  CREATED: "Falta el pago. Tus unidades están reservadas por tiempo limitado.",
  PAYMENT_FAILED: "No se completó el pago. Puedes intentarlo de nuevo.",
  CANCELLED: "Cancelamos el pedido y liberamos las unidades reservadas.",
};

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<"sesion" | "otro" | null>(null);

  useEffect(() => {
    api<Pedido[]>("/pedidos")
      .then(setPedidos)
      .catch((e) => setError(e instanceof ApiError && e.status === 401 ? "sesion" : "otro"))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div>
      <ShopHeaderConectado active="pedidos" />
      <main className="pantalla">
        <h1 className="pantalla-titulo">Mis pedidos</h1>

        {cargando && <Notice tone="progress">Cargando tus pedidos…</Notice>}
        {error === "sesion" && (
          <Notice tone="info" title="Inicia sesión para ver tus pedidos" action={<Button href="/ingresar?volver=/pedidos" icon="user">Iniciar sesión</Button>}>
            Tus pedidos están guardados en tu cuenta.
          </Notice>
        )}
        {error === "otro" && (
          <Notice tone="danger" title="No pudimos cargar tus pedidos" action={<Button variant="secondary" onClick={() => location.reload()}>Reintentar</Button>}>
            Revisa tu conexión e inténtalo de nuevo.
          </Notice>
        )}
        {!cargando && !error && pedidos.length === 0 && (
          <Notice tone="info" title="Todavía no tienes pedidos" action={<Button variant="secondary" href="/">Ver productos</Button>}>
            Cuando hagas una compra la verás aquí.
          </Notice>
        )}

        {pedidos.map((p) => {
          const total = p.items.reduce((acc, i) => acc + Number(i.unitPrice) * i.quantity, 0);
          const unidades = p.items.reduce((acc, i) => acc + i.quantity, 0);
          return (
            <article className="card card-pad pedido-fila" key={p.id}>
              <div className="pedido-datos">
                <p className="linea-nombre"><Icon name="receipt" size={18} /> Pedido #{p.id}</p>
                <p className="estado-pedido">{ETIQUETA_ESTADO[p.status] ?? p.status}</p>
                <p className="faint">
                  {unidades} {unidades === 1 ? "producto" : "productos"} · {formatoCOP(total)}
                  {p.deliveryMode === "SHIPPING" && p.shippingCity ? ` · Envío a ${p.shippingCity}` : ""}
                </p>
                {NOTA_ESTADO[p.status] && <p className="faint">{NOTA_ESTADO[p.status]}</p>}
              </div>
              {p.status === "CREATED" || p.status === "PAYMENT_FAILED" ? (
                <Button icon="card" href={`/pago/${p.id}`}>Pagar</Button>
              ) : p.status !== "CANCELLED" ? (
                <Button variant="secondary" icon="receipt" href={`/comprobante/${p.id}`}>
                  {MODO_ENVIO ? "Ver pedido confirmado" : "Ver comprobante y código de retiro"}
                </Button>
              ) : null}
            </article>
          );
        })}
      </main>
    </div>
  );
}
