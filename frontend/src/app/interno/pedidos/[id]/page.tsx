"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Pedido } from "@/lib/types";

// Pantalla interna mínima para las transiciones de Pedido hacia alistamiento,
// listo para retiro, entrega y cancelación (RN-08, RN-09) — alcance mínimo
// confirmado con el usuario para poder probar PE-07/PE-09/PE-10 de punta a
// punta. NO es CU-11 a CU-14 completos: no hay rol de Gerente de Tienda
// autenticado, ni notificaciones, ni el resto del flujo de operación; mismo
// patrón sin autenticación que /interno/publicar (decisión D-01 del canon).
export default function PedidoInternoPage() {
  const params = useParams<{ id: string }>();
  const orderId = Number(params.id);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [pickupCode, setPickupCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState<string | null>(null);

  async function ejecutar(accion: string, ruta: string, body?: unknown) {
    setError(null);
    setCargando(accion);
    try {
      const actualizado = await api<Pedido>(ruta, {
        method: "POST",
        auth: false,
        cartToken: false,
        body,
      });
      setPedido(actualizado);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo completar la acción");
    } finally {
      setCargando(null);
    }
  }

  return (
    <div className="panel-shell">
      <div className="panel-sidebar">
        <div className="brand-row"><span className="brand-mark" style={{ width: 28, height: 28, fontSize: 12 }}>CY</span>ComproYa</div>
        <nav>
          <a href="/interno/publicar">Publicación de catálogo</a>
          <a href="#" className="active">Operación de pedidos</a>
        </nav>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div className="panel-topbar">
          <h1 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-soft)" }}>Operación — Pedido #{orderId}</h1>
        </div>
        <div className="panel-main">
          <p className="muted" style={{ marginBottom: 20 }}>
            Alcance mínimo para probar las transiciones de estado del pedido (RN-08, RN-09). No reemplaza el panel
            completo de alistamiento del Gerente de Tienda (CU-11 a CU-14, fuera de esta entrega).
          </p>

          {error && <div className="notice notice-danger" style={{ marginBottom: 16 }}>{error}</div>}

          <div className="card card-pad" style={{ marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              className="btn"
              style={{ color: "var(--danger, #b3261e)", borderColor: "var(--danger, #b3261e)" }}
              disabled={cargando !== null}
              onClick={() => ejecutar("cancelar", `/pedidos/${orderId}/cancelar`)}
            >
              {cargando === "cancelar" ? "Cancelando…" : "Cancelar pedido"}
            </button>
            <button className="btn" disabled={cargando !== null} onClick={() => ejecutar("alistamiento", `/pedidos/${orderId}/iniciar-alistamiento`)}>
              {cargando === "alistamiento" ? "Iniciando…" : "Iniciar alistamiento"}
            </button>
            <button className="btn" disabled={cargando !== null} onClick={() => ejecutar("listo", `/pedidos/${orderId}/listo-para-retiro`)}>
              {cargando === "listo" ? "Actualizando…" : "Marcar listo para retiro"}
            </button>
          </div>

          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, marginBottom: 12 }}>Retirar con código (RN-08)</h3>
            <div className="grid2">
              <div className="field">
                <label>Código de retiro</label>
                <input value={pickupCode} onChange={(e) => setPickupCode(e.target.value.toUpperCase())} placeholder="RET-XXXXXXXX" />
              </div>
            </div>
            <button
              className="btn btn-primary"
              style={{ marginTop: 12 }}
              disabled={cargando !== null || !pickupCode}
              onClick={() => ejecutar("retirar", `/pedidos/${orderId}/retirar`, { pickupCode })}
            >
              {cargando === "retirar" ? "Confirmando…" : "Confirmar entrega"}
            </button>
          </div>

          {pedido && (
            <div className="card card-pad">
              <h3 style={{ fontSize: 14, marginBottom: 12 }}>Estado actual</h3>
              <p><b>Estado:</b> <span className="badge badge-ok">{pedido.status}</span></p>
              <p><b>Código de retiro:</b> {pedido.pickupCode}</p>
              <p><b>Vence:</b> {new Date(pedido.pickupCodeExpiresAt).toLocaleString("es-CO")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
