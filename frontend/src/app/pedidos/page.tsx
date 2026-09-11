"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { Pedido } from "@/lib/types";
import ShopHeader from "@/components/ShopHeader";

const ETIQUETA_ESTADO: Record<string, string> = {
  CREATED: "Creado, pendiente de pago",
  PAID: "Pagado",
  PREPARING: "En alistamiento",
  READY_FOR_PICKUP: "Listo para retiro",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  PAYMENT_FAILED: "Pago fallido",
};

// Sin mockup propio (no es un CU nuevo): es el punto de entrada para volver
// a la pantalla de pago o de comprobante de un pedido ya confirmado.
export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Pedido[]>("/pedidos").then(setPedidos).catch((e) => {
      setError(e instanceof ApiError ? e.message : "Inicia sesión para ver tus pedidos");
    });
  }, []);

  return (
    <div>
      <ShopHeader activeLink="cuenta" />
      <div className="container">
        <h2 style={{ fontSize: 22, marginBottom: 16 }}>Mis pedidos</h2>
        {error && <div className="notice notice-danger" style={{ marginBottom: 16 }}>{error}</div>}
        {pedidos.map((p) => (
          <div className="card card-pad" style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }} key={p.id}>
            <div>
              <strong>Pedido #{p.id}</strong>
              <p className="faint" style={{ marginTop: 2 }}>{ETIQUETA_ESTADO[p.status] ?? p.status}</p>
            </div>
            {p.status === "CREATED" || p.status === "PAYMENT_FAILED" ? (
              <Link href={`/pago/${p.id}`}><button className="btn btn-primary">Pagar</button></Link>
            ) : p.status === "PAID" ? (
              <Link href={`/comprobante/${p.id}`}><button className="btn">Ver comprobante</button></Link>
            ) : null}
          </div>
        ))}
        {pedidos.length === 0 && !error && <p className="muted">Todavía no tienes pedidos.</p>}
      </div>
    </div>
  );
}
