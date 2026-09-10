"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";

// P-15 Pago con tarjeta (CU-15, Stripe Checkout) y P-16 Pago con débito
// bancario (CU-16, simulado) — especialización de "Pagar pedido" a nivel de
// interfaz (docs/plan-de-trabajo.md, Fase 5), sin ser un caso de uso nuevo.
// RN-06: nunca se pide ni se muestra un número de tarjeta en esta pantalla —
// la tarjeta se captura en la página que aloja Stripe.
export default function PagoPage() {
  const params = useParams<{ orderId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const orderId = Number(params.orderId);
  const [error, setError] = useState<string | null>(
    search.get("cancelado") ? "El pago con tarjeta fue cancelado o no se completó." : null,
  );
  const [cargandoTarjeta, setCargandoTarjeta] = useState(false);
  const [debito, setDebito] = useState<{ referencia: string } | null>(null);
  const [notificando, setNotificando] = useState(false);

  async function pagarConTarjeta() {
    setError(null);
    setCargandoTarjeta(true);
    try {
      const { redirectUrl } = await api<{ redirectUrl: string }>(`/pagos/tarjeta/${orderId}`, { method: "POST" });
      window.location.href = redirectUrl;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo iniciar el pago con tarjeta");
      setCargandoTarjeta(false);
    }
  }

  async function iniciarDebito() {
    setError(null);
    try {
      const resultado = await api<{ referencia: string }>(`/pagos/debito/${orderId}`, { method: "POST" });
      setDebito(resultado);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo iniciar el pago con débito bancario");
    }
  }

  // Simula la notificación de débito bancario que en el canon entrega la
  // pasarela de pagos (no hay una pasarela de débito real conectada).
  async function simularNotificacion(exitoso: boolean) {
    setNotificando(true);
    setError(null);
    try {
      await api(`/pagos/debito/${orderId}/notificacion`, { method: "POST", auth: false, body: { exitoso } });
      if (exitoso) router.push(`/comprobante/${orderId}`);
      else setError("El banco rechazó el débito (E-2). El pedido se canceló y la reserva se liberó.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo procesar la notificación");
    } finally {
      setNotificando(false);
    }
  }

  return (
    <div className="tarjeta" style={{ maxWidth: 480 }}>
      <h1>Pagar pedido #{orderId}</h1>
      {error && <div className="alerta-error">{error}</div>}
      <p className="muted">
        ComproYa no captura ni almacena el número de tarjeta (RN-06): el pago con tarjeta ocurre en una
        página propia de Stripe.
      </p>

      <div style={{ marginBottom: 16 }}>
        <h2>Pago con tarjeta (Stripe, modo de prueba)</h2>
        <button onClick={pagarConTarjeta} disabled={cargandoTarjeta}>Pagar con tarjeta</button>
      </div>

      <div>
        <h2>Pago con débito bancario</h2>
        {!debito ? (
          <button className="secundario" onClick={iniciarDebito}>Iniciar débito bancario</button>
        ) : (
          <div>
            <p className="muted">Referencia: {debito.referencia}. Esperando notificación del banco…</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => simularNotificacion(true)} disabled={notificando}>Simular notificación exitosa</button>
              <button className="secundario" onClick={() => simularNotificacion(false)} disabled={notificando}>Simular rechazo</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
