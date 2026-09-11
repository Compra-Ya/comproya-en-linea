"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

  return (
    <div className="auth-shell">
      <div style={{ width: "100%", background: "#ececec", borderBottom: "1px dashed var(--line)", padding: "8px 24px", fontSize: 11, color: "var(--ink-soft)", textAlign: "center" }}>
        Continúa el flujo de pago, una vez el pago quedó confirmado
      </div>
      <div className="auth-wrap" style={{ padding: "26px 0" }}>
        {reintentando && <p className="muted" style={{ textAlign: "center" }}>Confirmando el pago con la pasarela…</p>}
        {error && <div className="notice notice-danger">{error}</div>}
        {comprobante && (
          <>
            <div className="check-circle">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 6 9 17l-5-5" /></svg>
            </div>
            <h2 style={{ textAlign: "center", marginBottom: 4 }}>Pago confirmado</h2>
            <p className="muted" style={{ textAlign: "center", marginBottom: 22 }}>
              Pedido #{comprobante.idPedido} · identificador de correlación {comprobante.correlationId}
            </p>

            <div className="card card-pad">
              <div className="retiro-code">
                <span className="faint">Código de retiro</span>
                <div className="code">{comprobante.pickupCode}</div>
                <span className="faint">
                  Válido hasta el {new Date(comprobante.pickupCodeExpiresAt).toLocaleDateString("es-CO")} · de un solo uso
                </span>
              </div>

              {comprobante.items.map((item) => (
                <div className="li" key={item.id}>
                  <span>{item.product.name}{item.quantity > 1 ? ` × ${item.quantity}` : ""}</span>
                  <span>$ {(Number(item.unitPrice) * item.quantity).toLocaleString("es-CO")}</span>
                </div>
              ))}
              <div className="li" style={{ borderBottom: "none", fontWeight: 800, color: "var(--ink)" }}>
                <span>Total pagado</span>
                <span>
                  $ {comprobante.items.reduce((acc, i) => acc + Number(i.unitPrice) * i.quantity, 0).toLocaleString("es-CO")}
                </span>
              </div>
              <p className="faint" style={{ marginTop: 10 }}>Sucursal de retiro: {comprobante.branch.name} — {comprobante.branch.city}</p>

              <Link href="/"><button className="btn btn-navy btn-full" style={{ marginTop: 16 }}>Volver al catálogo</button></Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
