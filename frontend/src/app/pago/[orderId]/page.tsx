"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";

// P-15 Pago con tarjeta (CU-15, Stripe Checkout) y P-16 Pago con débito
// bancario (CU-16, simulado) — mismas pestañas "Tarjeta / Débito bancario"
// del mockup. Diferencia deliberada frente al mockup: la pestaña de tarjeta
// no pide número de tarjeta en este formulario — RN-06 exige que ComproYa
// nunca la reciba, así que solo hay un botón que redirige a la página que
// aloja Stripe (donde sí se captura la tarjeta).
export default function PagoPage() {
  const params = useParams<{ orderId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const orderId = Number(params.orderId);
  const [tab, setTab] = useState<"tarjeta" | "debito">("tarjeta");
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
  // pasarela de pagos (canon, sección 3) — no hay banco real conectado.
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
    <div className="auth-shell">
      <Link href="/" className="auth-brand"><span className="brand-mark">CY</span>ComproYa</Link>
      <div className="auth-wrap">
        <h2 style={{ textAlign: "center", marginBottom: 16 }}>Pagar pedido #{orderId}</h2>

        <div className="tabs">
          <button className={tab === "tarjeta" ? "active" : undefined} onClick={() => setTab("tarjeta")}>Tarjeta</button>
          <button className={tab === "debito" ? "active" : undefined} onClick={() => setTab("debito")}>Débito bancario</button>
        </div>

        {error && <div className="notice notice-danger" style={{ marginBottom: 14 }}>{error}</div>}

        <div className="card card-pad">
          {tab === "tarjeta" ? (
            <>
              <div className="notice notice-neutral" style={{ marginBottom: 16 }}>
                Este pago lo administra Stripe, en modo de prueba. ComproYa no almacena ni procesa el número de
                tarjeta: solo recibe un token emitido por la pasarela (RN-06).
              </div>
              <button className="btn btn-primary btn-full" onClick={pagarConTarjeta} disabled={cargandoTarjeta}>
                Pagar con tarjeta
              </button>
            </>
          ) : (
            <>
              {!debito ? (
                <>
                  <div className="field">
                    <label>Selecciona tu banco</label>
                    <select disabled><option>Banco Central</option></select>
                  </div>
                  <div className="notice notice-warn" style={{ margin: "8px 0 16px" }}>
                    Se simula la confirmación del banco (no hay una pasarela de débito bancario real conectada). Si no
                    hay confirmación en 30 minutos, el pedido se cancela.
                  </div>
                  <button className="btn btn-primary btn-full" onClick={iniciarDebito}>Continuar con mi banco</button>
                </>
              ) : (
                <>
                  <p className="faint" style={{ marginBottom: 12 }}>Referencia: {debito.referencia}</p>
                  <div className="notice notice-warn" style={{ marginBottom: 16 }}>Esperando confirmación del débito bancario…</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => simularNotificacion(true)} disabled={notificando}>
                      Simular confirmación
                    </button>
                    <button className="btn btn-outline-red" style={{ flex: 1 }} onClick={() => simularNotificacion(false)} disabled={notificando}>
                      Simular rechazo
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
