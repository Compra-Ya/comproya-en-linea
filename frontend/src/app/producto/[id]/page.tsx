"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError, setCartToken, setSelectedBranch } from "@/lib/api";
import type { Carrito, Disponibilidad, Producto } from "@/lib/types";
import ShopHeader from "@/components/ShopHeader";

// P-3 Consulta de disponibilidad por sucursal (CU-03). "Retirar aquí" fija
// la sucursal de retiro del pedido (RN-03/RN-04 ya evaluadas por fila) y
// agrega el producto al carrito — el pedido solo admite una sucursal (schema).
export default function ProductoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const productId = Number(params.id);
  const [producto, setProducto] = useState<Producto | null>(null);
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [retirando, setRetirando] = useState<number | null>(null);

  useEffect(() => {
    api<Producto>(`/catalogo/productos/${productId}`, { auth: false, cartToken: false })
      .then(setProducto)
      .catch(() => setProducto(null));
    api<Disponibilidad[]>(`/catalogo/productos/${productId}/disponibilidad`, { auth: false, cartToken: false })
      .then(setDisponibilidad)
      .catch((e) => setError(e instanceof ApiError ? e.message : "No se pudo consultar la disponibilidad"));
  }, [productId]);

  async function retirarAqui(branchId: number) {
    setError(null);
    setMensaje(null);
    setRetirando(branchId);
    try {
      const carrito = await api<Carrito>("/carrito/items", { method: "POST", body: { productId, quantity: 1 } });
      if (carrito.guestToken) setCartToken(carrito.guestToken);
      setSelectedBranch(branchId);
      setMensaje("Producto agregado al carrito para retirar en esta sucursal.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo agregar el producto");
    } finally {
      setRetirando(null);
    }
  }

  const minutosDesdeSync = (syncedAt: string) => Math.floor((Date.now() - new Date(syncedAt).getTime()) / 60000);

  return (
    <div>
      <ShopHeader activeLink="catalogo" />
      <div className="container" style={{ maxWidth: 1180, display: "grid", gridTemplateColumns: "360px 1fr", gap: 40 }}>
        <div className="product-thumb" style={{ height: 360, margin: 0 }}>
          <svg width="86" height="86" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1"><rect x="5" y="2" width="14" height="20" rx="1.5" /><path d="M5 11h14" /></svg>
        </div>
        <div>
          {producto && (
            <>
              <span className="faint">{producto.category?.name} · Código homologado {producto.homologatedCode}</span>
              <h2 style={{ fontSize: 26, margin: "8px 0 12px" }}>{producto.name}</h2>
              <span style={{ fontWeight: 800, fontSize: 24 }}>$ {Number(producto.digitalPrice).toLocaleString("es-CO")}</span>
            </>
          )}

          {error && <div className="notice notice-danger" style={{ marginTop: 20 }}>{error}</div>}
          {mensaje && (
            <div className="notice notice-ok" style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <span>{mensaje}</span>
              <button className="btn" style={{ height: 30, fontSize: 12 }} onClick={() => router.push("/carrito")}>Ver carrito</button>
            </div>
          )}

          <div className="card" style={{ overflow: "hidden", margin: "26px 0 18px" }}>
            <table>
              <thead>
                <tr><th>Sucursal</th><th>Unidades disponibles publicadas</th><th>Sincronización</th><th></th></tr>
              </thead>
              <tbody>
                {disponibilidad.map((d) => {
                  const minutos = minutosDesdeSync(d.syncedAt);
                  return (
                    <tr key={d.branchId}>
                      <td>Sucursal #{d.branchId}</td>
                      <td>{d.unidadesDisponibles}</td>
                      <td>
                        {d.puedeRetirar
                          ? <span className="badge badge-ok">Sincronizado hace {minutos} min</span>
                          : <span className="badge badge-danger">Sin sincronizar hace {minutos} min</span>}
                      </td>
                      <td>
                        <button
                          className="btn btn-primary"
                          disabled={!d.puedeRetirar || d.unidadesDisponibles === 0 || retirando === d.branchId}
                          onClick={() => retirarAqui(d.branchId)}
                        >
                          Retirar aquí
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="notice notice-danger">
            Una sucursal con más de 15 minutos sin sincronizar con el ERP no puede ofrecer retiro (RN-04). Las
            unidades disponibles publicadas ya descuentan el umbral de seguridad y las reservas de otros pedidos (RN-03).
          </div>
        </div>
      </div>
    </div>
  );
}
