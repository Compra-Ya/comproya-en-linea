"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Comprobante } from "@/lib/types";

// P-17 Emisión del comprobante (CU-17). Solo visible cuando el webhook de
// Stripe (o la notificación de débito bancario) ya confirmó el pago —
// mientras tanto el backend responde 400 y esta pantalla reintenta.
export default function ComprobantePage() {
  const params = useParams<{ orderId: string }>();
  const orderId = Number(params.orderId);
  const [comprobante, setComprobante] = useState<Comprobante | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reintentando, setReintentando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    let intentos = 0;

    async function intentar() {
      try {
        const resultado = await api<Comprobante>(`/pagos/${orderId}/comprobante`);
        if (!cancelado) {
          setComprobante(resultado);
          setReintentando(false);
        }
      } catch (e) {
        intentos += 1;
        if (intentos >= 15) {
          setError("El pago aún no se ha confirmado. Si acabas de pagar con tarjeta, espera unos segundos y recarga.");
          setReintentando(false);
          return;
        }
        setTimeout(intentar, 2000);
      }
    }
    intentar();
    return () => {
      cancelado = true;
    };
  }, [orderId]);

  if (reintentando) return <p className="muted">Confirmando el pago con la pasarela…</p>;
  if (error) return <div className="alerta-error">{error}</div>;
  if (!comprobante) return null;

  return (
    <div className="tarjeta" style={{ maxWidth: 480 }}>
      <h1>Comprobante</h1>
      <div className="alerta-exito">Pago confirmado</div>

      <p className="muted">Código de retiro (un solo uso, RN-08)</p>
      <p className="pickup-code">{comprobante.pickupCode}</p>
      <p className="muted">Vence: {new Date(comprobante.pickupCodeExpiresAt).toLocaleString("es-CO")}</p>
      <p className="muted">Sucursal de retiro: {comprobante.branch.name} — {comprobante.branch.city}</p>

      <hr style={{ margin: "16px 0", border: "none", borderTop: "1px solid var(--border)" }} />
      {comprobante.items.map((item) => (
        <div className="fila" key={item.id}>
          <span>{item.product.name} × {item.quantity}</span>
          <span>${(Number(item.unitPrice) * item.quantity).toLocaleString("es-CO")}</span>
        </div>
      ))}
      <p className="muted">Identificador de correlación: {comprobante.correlationId}</p>
    </div>
  );
}
