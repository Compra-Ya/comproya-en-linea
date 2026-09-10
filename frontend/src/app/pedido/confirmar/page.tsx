"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Carrito, Pedido, Sucursal } from "@/lib/types";

// P-9 Confirmación del pedido (CU-09) + P-10 Aplicación de cupón de lealtad
// (CU-10, extensión de CU-09). RN-05: confirmar reserva las unidades antes
// de que exista la posibilidad de pagar.
export default function ConfirmarPedidoPage() {
  const router = useRouter();
  const [carrito, setCarrito] = useState<Carrito | null>(null);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [branchId, setBranchId] = useState<number | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    api<Carrito>("/carrito").then(setCarrito).catch(() => undefined);
    api<Sucursal[]>("/catalogo/sucursales", { auth: false, cartToken: false }).then((lista) => {
      setSucursales(lista);
      if (lista[0]) setBranchId(lista[0].id);
    });
  }, []);

  async function confirmar() {
    if (!branchId) return;
    setError(null);
    setConfirmando(true);
    try {
      const pedido = await api<Pedido>("/pedidos/confirmar", {
        method: "POST",
        body: { branchId, couponCode: couponCode || undefined },
      });
      router.push(`/pago/${pedido.id}`);
    } catch (e) {
      // RN-03/RN-04 (sin disponibilidad o sucursal desincronizada) llegan aquí.
      setError(e instanceof ApiError ? e.message : "No se pudo confirmar el pedido");
    } finally {
      setConfirmando(false);
    }
  }

  const total = carrito?.items.reduce((acc, i) => acc + Number(i.product.digitalPrice) * i.quantity, 0) ?? 0;

  return (
    <div className="tarjeta" style={{ maxWidth: 520 }}>
      <h1>Confirmar pedido</h1>
      {error && <div className="alerta-error">{error}</div>}

      {carrito?.items.map((item) => (
        <div className="fila" key={item.id}>
          <span>{item.product.name} × {item.quantity}</span>
          <span>${(Number(item.product.digitalPrice) * item.quantity).toLocaleString("es-CO")}</span>
        </div>
      ))}
      <div className="fila"><strong>Total</strong><strong>${total.toLocaleString("es-CO")}</strong></div>

      <div className="campo">
        <label>Sucursal de retiro</label>
        <select value={branchId ?? ""} onChange={(e) => setBranchId(Number(e.target.value))}>
          {sucursales.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.city}</option>)}
        </select>
      </div>

      <div className="campo">
        <label>Cupón de lealtad (opcional — CU-10)</label>
        <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} />
      </div>

      <button onClick={confirmar} disabled={confirmando || !carrito?.items.length}>Confirmar pedido</button>
    </div>
  );
}
