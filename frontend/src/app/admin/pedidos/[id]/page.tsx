"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import PanelInterno from "@/components/PanelInterno";
import { Badge } from "@/components/ui";
import type { Pedido } from "@/lib/types";

// Pantalla interna mínima para las transiciones de Pedido hacia alistamiento,
// listo para retiro y entrega (RN-08) — alcance mínimo para poder probar PE-09 y PE-10
// de punta a punta. Fuera del alcance (docs/alcance): el despacho en sucursal no se
// ofrece en el menú; la pantalla sigue accesible por su ruta y exige la sesión interna.
// La cancelación es del cliente dueño del pedido, no de la cuenta interna.
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
        interno: true,
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
    <PanelInterno titulo={`Operación — Pedido #${orderId}`}>
      <p className="muted" style={{ marginBottom: 20 }}>
        Alcance mínimo para probar las transiciones de estado del pedido (RN-08). El despacho en sucursal está fuera del
        alcance del canal (docs/alcance); esta pantalla no hace parte del menú.
      </p>

      {error && <div className="notice notice-danger" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="card card-pad" style={{ marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
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
            <label htmlFor="ped-codigo">Código de retiro</label>
            <input id="ped-codigo" value={pickupCode} onChange={(e) => setPickupCode(e.target.value.toUpperCase())} placeholder="RET-XXXXXXXX" />
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
          <p><b>Estado:</b> <Badge tone="info">{pedido.status}</Badge></p>
          <p><b>Código de retiro:</b> {pedido.pickupCode}</p>
          <p><b>Vence:</b> {new Date(pedido.pickupCodeExpiresAt).toLocaleString("es-CO")}</p>
        </div>
      )}
    </PanelInterno>
  );
}
