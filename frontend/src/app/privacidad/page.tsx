"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Consentimiento } from "@/lib/types";

// P-5 Administración del consentimiento (CU-05). Actor: Cliente digital ·
// Oficial de Protección de Datos (vigencia de la política). Canon, sección
// 10: activar o revocar en ≤ 2 interacciones — una sola llamada a este
// formulario decide.
const TEXTO_POLITICA_VIGENTE = `Tiendas ComproYa trata tus datos personales para operar tu cuenta,
procesar tus pedidos y, si lo autorizas, vincular tu identificador de
lealtad y registrar tu comportamiento de navegación para tu propio perfil
de cliente. Puedes revocar este consentimiento en cualquier momento desde
esta misma pantalla, y solicitar la supresión de tus datos personales
— se ejecuta dentro de las 72 horas siguientes (RN-11).`;

export default function PrivacidadPage() {
  const [consentimiento, setConsentimiento] = useState<Consentimiento | null>(null);
  const [loyaltyId, setLoyaltyId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api<Consentimiento>("/cuenta/consentimiento").then(setConsentimiento).catch(() => undefined);
  }, []);

  async function decidir(activo: boolean) {
    setError(null);
    setMensaje(null);
    setCargando(true);
    try {
      const actualizado = await api<Consentimiento>("/cuenta/consentimiento", {
        method: "POST",
        body: { activo, loyaltyId: activo && loyaltyId ? loyaltyId : undefined },
      });
      setConsentimiento(actualizado);
      setMensaje(activo ? "Consentimiento activado" : "Consentimiento rechazado — tu comportamiento se registrará de forma anónima (RN-10)");
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
      setError(e instanceof ApiError ? e.message : "No se pudo registrar la solicitud");
    }
  }

  return (
    <div className="tarjeta" style={{ maxWidth: 560 }}>
      <h1>Política de datos personales</h1>
      <p className="muted">Debes haber iniciado sesión para decidir tu consentimiento.</p>
      {error && <div className="alerta-error">{error}</div>}
      {mensaje && <div className="alerta-exito">{mensaje}</div>}

      <p style={{ whiteSpace: "pre-line" }}>{TEXTO_POLITICA_VIGENTE}</p>

      <p>
        Estado actual: {consentimiento ? (consentimiento.active ? "Activo" : "Rechazado / pendiente") : "Sin registrar"}
      </p>

      <div className="campo">
        <label>Identificador de lealtad (opcional, solo si aceptas)</label>
        <input placeholder="LEALTAD-000123" value={loyaltyId} onChange={(e) => setLoyaltyId(e.target.value.toUpperCase())} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => decidir(true)} disabled={cargando}>Aceptar</button>
        <button className="secundario" onClick={() => decidir(false)} disabled={cargando}>Rechazar</button>
      </div>

      <hr style={{ margin: "16px 0", border: "none", borderTop: "1px solid var(--border)" }} />
      <button className="secundario" onClick={solicitarSupresion}>Solicitar supresión de mis datos (RN-11)</button>
    </div>
  );
}
