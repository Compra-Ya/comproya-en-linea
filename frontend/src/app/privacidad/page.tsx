"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Consentimiento } from "@/lib/types";
import ShopHeader from "@/components/ShopHeader";

// P-5 Administración del consentimiento (CU-05). Actor: Cliente digital ·
// Oficial de Protección de Datos (vigencia de la política). Canon, sección
// 10: activar o revocar en ≤ 2 interacciones — un clic sobre el interruptor.
const TEXTO_POLITICA_VIGENTE = `Tiendas ComproYa trata tus datos personales para operar tu cuenta,
procesar tus pedidos y, si lo autorizas, vincular tu identificador de
lealtad y registrar tu comportamiento de navegación para tu propio perfil
de cliente.`;

export default function PrivacidadPage() {
  const [consentimiento, setConsentimiento] = useState<Consentimiento | null>(null);
  const [loyaltyId, setLoyaltyId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api<Consentimiento>("/cuenta/consentimiento").then(setConsentimiento).catch(() => undefined);
  }, []);

  async function alternar() {
    setError(null);
    setMensaje(null);
    setCargando(true);
    const activo = !(consentimiento?.active ?? false);
    try {
      const actualizado = await api<Consentimiento>("/cuenta/consentimiento", {
        method: "POST",
        body: { activo, loyaltyId: activo && loyaltyId ? loyaltyId : undefined },
      });
      setConsentimiento(actualizado);
      setMensaje(activo ? "Consentimiento activado" : "Consentimiento revocado — tu comportamiento se registrará de forma anónima (RN-10)");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo registrar tu decisión");
    } finally {
      setCargando(false);
    }
  }

  async function solicitarSupresion() {
    setError(null);
    setMensaje(null);
    try {
      await api("/cuenta/supresion", { method: "POST" });
      setMensaje("Solicitud de supresión registrada — se ejecutará dentro de las 72 horas siguientes (RN-11)");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo registrar la solicitud. Inicia sesión primero.");
    }
  }

  const activo = consentimiento?.active ?? false;

  return (
    <div>
      <ShopHeader activeLink="cuenta" />
      <div className="container container-narrow">
        <h2 style={{ fontSize: 22, marginBottom: 6 }}>Privacidad y consentimiento</h2>
        <p className="muted" style={{ marginBottom: 22 }}>{TEXTO_POLITICA_VIGENTE}</p>

        {error && <div className="notice notice-danger" style={{ marginBottom: 16 }}>{error}</div>}
        {mensaje && <div className="notice notice-ok" style={{ marginBottom: 16 }}>{mensaje}</div>}

        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Registro de comportamiento</span>
              <p className="faint" style={{ marginTop: 4 }}>
                Con tu consentimiento activo, tu actividad se asocia a tu cuenta. Sin él, se registra de forma anónima.
              </p>
            </div>
            <button
              onClick={alternar}
              disabled={cargando}
              style={{
                width: 44, height: 24, borderRadius: 999, border: "none", cursor: "pointer", position: "relative", flexShrink: 0,
                background: activo ? "var(--ok)" : "#d1d5db",
              }}
              aria-pressed={activo}
            >
              <span style={{ position: "absolute", top: 3, width: 18, height: 18, borderRadius: 999, background: "#fff", left: activo ? 23 : 3, transition: "left .15s" }} />
            </button>
          </div>

          {activo ? (
            <span className="badge badge-ok" style={{ marginTop: 14, display: "inline-flex" }}>Consentimiento activo</span>
          ) : (
            <div className="field" style={{ marginTop: 14 }}>
              <label>Identificador de lealtad (opcional, se vincula al activar)</label>
              <input placeholder="LEALTAD-000123" value={loyaltyId} onChange={(e) => setLoyaltyId(e.target.value.toUpperCase())} />
            </div>
          )}
        </div>

        <div className="card card-pad">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Supresión de mis datos personales</span>
              <p className="faint" style={{ marginTop: 4 }}>Solicita eliminar tus datos personales del canal.</p>
            </div>
            <button className="btn btn-outline-red" onClick={solicitarSupresion}>Solicitar supresión</button>
          </div>
          <div className="notice notice-warn" style={{ marginTop: 14 }}>
            Toda solicitud de supresión se ejecuta dentro de las 72 horas siguientes (RN-11).
          </div>
        </div>
      </div>
    </div>
  );
}
