"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { Pedido } from "@/lib/types";

// Sin mockup propio (no es un CU nuevo): es solo el punto de entrada para
// volver a la pantalla de pago o de comprobante de un pedido ya confirmado.
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
      <h1>Mis pedidos</h1>
      {error && <div className="alerta-error">{error}</div>}
      {pedidos.map((p) => (
        <div className="tarjeta fila" key={p.id}>
          <div>
            <strong>Pedido #{p.id}</strong>
            <p className="muted">Estado: {p.status}</p>
          </div>
          <div>
            {p.status === "CREATED" || p.status === "PAYMENT_FAILED" ? (
              <Link href={`/pago/${p.id}`}><button>Pagar</button></Link>
            ) : (
              <Link href={`/comprobante/${p.id}`}><button className="secundario">Ver comprobante</button></Link>
            )}
          </div>
        </div>
      ))}
      {pedidos.length === 0 && !error && <p className="muted">Todavía no tienes pedidos.</p>}
    </div>
  );
}
