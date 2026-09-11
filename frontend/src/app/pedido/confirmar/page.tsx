"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError, getSelectedBranch } from "@/lib/api";
import type { Carrito, Pedido, Sucursal } from "@/lib/types";

// P-9 Confirmación del pedido (CU-09) + P-10 Aplicación de cupón de lealtad
// (CU-10, extensión de CU-09, vive dentro del mismo resumen). RN-05:
// confirmar reserva las unidades antes de que exista la posibilidad de pagar.
export default function ConfirmarPedidoPage() {
  const router = useRouter();
  const [carrito, setCarrito] = useState<Carrito | null>(null);
  const [sucursal, setSucursal] = useState<Sucursal | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [cuponAplicado, setCuponAplicado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    api<Carrito>("/carrito").then(setCarrito).catch(() => undefined);
    const branchId = getSelectedBranch();
    if (branchId) {
      api<Sucursal[]>("/catalogo/sucursales", { auth: false, cartToken: false }).then((lista) => {
        setSucursal(lista.find((s) => s.id === branchId) ?? null);
      });
    }
  }, []);

  async function confirmar() {
    const branchId = getSelectedBranch();
    if (!branchId) {
      setError("Elige una sucursal de retiro desde la ficha de un producto antes de confirmar.");
      return;
    }
    setError(null);
    setConfirmando(true);
    try {
      const pedido = await api<Pedido>("/pedidos/confirmar", {
        method: "POST",
        body: { branchId, couponCode: cuponAplicado && couponCode ? couponCode : undefined },
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
    <div style={{ background: "var(--surface)", minHeight: "100vh" }}>
      <div className="header-main">
        <Link href="/" className="brand"><span className="brand-mark">CY</span>ComproYa</Link>
        <span className="muted" style={{ marginLeft: "auto", fontWeight: 600 }}>Paso 2 de 3 · Confirmación</span>
      </div>

      <div className="container" style={{ maxWidth: 1100, display: "grid", gridTemplateColumns: "1fr 340px", gap: 32 }}>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 14 }}>Confirmar pedido</h2>

          <div className="card card-pad" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, marginBottom: 10 }}>Productos</h3>
            {carrito?.items.map((item) => (
              <div className="li" key={item.id}>
                <span>{item.product.name}{item.quantity > 1 ? ` × ${item.quantity}` : ""}</span>
                <span>$ {(Number(item.product.digitalPrice) * item.quantity).toLocaleString("es-CO")}</span>
              </div>
            ))}
          </div>

          <div className="card card-pad">
            <h3 style={{ fontSize: 13, marginBottom: 10 }}>Retiro</h3>
            {sucursal ? (
              <p>{sucursal.name} · código de retiro se genera al confirmar</p>
            ) : (
              <p className="muted">Aún no elegiste sucursal — vuelve a la ficha del producto y usa "Retirar aquí".</p>
            )}
          </div>
        </div>

        <div className="card card-pad">
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>Resumen del pedido</h3>
          <div className="totalsrow"><span>Subtotal</span><span>$ {total.toLocaleString("es-CO")}</span></div>
          <div className="totalsrow grand"><span>Total</span><span>$ {total.toLocaleString("es-CO")}</span></div>

          <div className="card" style={{ marginTop: 16, padding: 16 }}>
            <h3 style={{ fontSize: 13, marginBottom: 12 }}>Cupón de lealtad</h3>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={couponCode} onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCuponAplicado(false); }} placeholder="LEALTAD10" />
              <button className="btn btn-navy" onClick={() => setCuponAplicado(true)} disabled={!couponCode}>Aplicar</button>
            </div>
            {cuponAplicado && (
              <div className="notice notice-ok" style={{ marginTop: 12 }}>Cupón aplicado al confirmar (se valida en el servidor)</div>
            )}
            <p className="faint" style={{ marginTop: 10 }}>
              Un cupón se redime una sola vez por pedido, incluso si reintentas la confirmación (RN-07).
            </p>
          </div>

          {error && <div className="notice notice-danger" style={{ marginTop: 14 }}>{error}</div>}

          <div className="notice notice-ok" style={{ marginTop: 14 }}>
            Al confirmar, tus unidades quedan reservadas en el ERP antes de cualquier cobro (RN-05).
          </div>
          <button className="btn btn-primary btn-full" style={{ marginTop: 8 }} onClick={confirmar} disabled={confirmando || !carrito?.items.length}>
            Confirmar pedido
          </button>
        </div>
      </div>
    </div>
  );
}
