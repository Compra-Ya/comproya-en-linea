"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, getSelectedBranch, setSelectedBranch } from "@/lib/api";
import type { Carrito, Pedido, Sucursal } from "@/lib/types";
import ShopHeaderConectado from "@/components/ShopHeaderConectado";
import { Button, CheckoutSteps, Notice, formatoCOP } from "@/components/ui";

// P-9 Confirmación del pedido (CU-09) + P-10 Aplicación de cupón de lealtad
// (CU-10, extensión de CU-09, vive dentro del mismo resumen). RN-05:
// confirmar reserva las unidades antes de que exista la posibilidad de pagar.
// Rediseñada con el sistema de diseño (design/design-system): ShopHeader compact,
// CheckoutSteps (paso 2), Button y Notice, y sin columnas fijas en estilos en línea.

type Aviso = {
  titulo: string;
  texto: string;
  /** Dónde se muestra: junto al cupón o junto al botón de confirmar. */
  donde: "cupon" | "resumen";
  accion?: "carrito" | "productos" | "quitar-cupon";
};

// El servidor responde con identificadores internos (producto 209, sucursal 6): la pantalla
// los traduce a lenguaje de cliente y dice qué hacer (design/06-copy.md, sección 3.4).
function explicarError(mensaje: string, sucursal: string | undefined): Aviso {
  const unidades = /Solo hay (\d+) unidades disponibles/.exec(mensaje);
  if (unidades) {
    return {
      titulo: "Ya no hay tantas unidades disponibles",
      texto: `Solo quedan ${unidades[1]} unidades disponibles${sucursal ? ` en ${sucursal}` : ""}. Ajusta la cantidad en tu carrito.`,
      donde: "resumen",
      accion: "carrito",
    };
  }
  if (/lleva más de 15 minutos sin sincronizar/.test(mensaje)) {
    return {
      titulo: `${sucursal ?? "Esa sucursal"} no ofrece retiro por ahora`,
      texto: "Lleva más de 15 minutos sin actualizar su información. Elige otra sucursal para retirar.",
      donde: "resumen",
    };
  }
  if (/cupón de lealtad no existe/.test(mensaje)) {
    return {
      titulo: "Ese cupón no es válido o ya venció",
      texto: "Revisa el código o continúa sin cupón.",
      donde: "cupon",
      accion: "quitar-cupon",
    };
  }
  if (/unidades disponibles cambiaron/.test(mensaje)) {
    return {
      titulo: "Las unidades de este producto cambiaron justo ahora",
      texto: "Vuelve a confirmar el pedido.",
      donde: "resumen",
    };
  }
  if (/carrito está vacío/.test(mensaje)) {
    return { titulo: "Tu carrito está vacío", texto: "Agrega productos para poder confirmar un pedido.", donde: "resumen", accion: "productos" };
  }
  return { titulo: "No pudimos confirmar tu pedido", texto: "Inténtalo de nuevo en unos segundos.", donde: "resumen" };
}

export default function ConfirmarPedidoPage() {
  const router = useRouter();
  const [carrito, setCarrito] = useState<Carrito | null>(null);
  const [cargandoCarrito, setCargandoCarrito] = useState(true);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [branchId, setBranchId] = useState<number | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [cuponAplicado, setCuponAplicado] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    api<Carrito>("/carrito")
      .then(setCarrito)
      .catch(() => undefined)
      .finally(() => setCargandoCarrito(false));
    api<Sucursal[]>("/catalogo/sucursales", { auth: false, cartToken: false }).then((lista) => {
      setSucursales(lista);
      // Si ya se eligió sucursal desde la ficha de producto (P-3), se
      // respeta; si no (por ejemplo, se agregó al carrito desde el
      // catálogo con el botón rápido), se ofrece elegirla aquí mismo.
      const guardada = getSelectedBranch();
      setBranchId(guardada && lista.some((s) => s.id === guardada) ? guardada : lista[0]?.id ?? null);
    });
  }, []);

  const sucursalElegida = sucursales.find((s) => s.id === branchId)?.name;

  async function confirmar() {
    if (!branchId) {
      setAviso({ titulo: "Elige una sucursal de retiro", texto: "Necesitamos saber dónde vas a retirar tu pedido.", donde: "resumen" });
      return;
    }
    setSelectedBranch(branchId);
    setAviso(null);
    setConfirmando(true);
    try {
      const pedido = await api<Pedido>("/pedidos/confirmar", {
        method: "POST",
        body: { branchId, couponCode: cuponAplicado && couponCode ? couponCode : undefined },
      });
      router.push(`/pago/${pedido.id}`);
    } catch (e) {
      // RN-03/RN-04 (sin disponibilidad o sucursal desincronizada) llegan aquí.
      const error = explicarError(e instanceof ApiError ? e.message : "", sucursalElegida);
      // Un cupón inválido reemplaza el aviso de "se usará el cupón": nunca dos a la vez.
      if (error.donde === "cupon") setCuponAplicado(false);
      setAviso(error);
      setConfirmando(false);
    }
  }

  function accionDe(a: Aviso) {
    if (a.accion === "carrito") return <Button variant="secondary" href="/carrito">Volver al carrito</Button>;
    if (a.accion === "productos") return <Button variant="secondary" href="/">Ver productos</Button>;
    if (a.accion === "quitar-cupon") {
      return (
        <Button
          variant="secondary"
          onClick={() => {
            setCouponCode("");
            setCuponAplicado(false);
            setAviso(null);
          }}
        >
          Quitar cupón
        </Button>
      );
    }
    return undefined;
  }

  // El subtotal se calcula igual que en el carrito; el servidor valida precios al confirmar.
  const total = carrito?.items.reduce((acc, i) => acc + Number(i.product.digitalPrice) * i.quantity, 0) ?? 0;
  const vacio = !cargandoCarrito && !carrito?.items.length;

  return (
    <div>
      <ShopHeaderConectado variant="compact" active="carrito" />

      <main className="pantalla">
        <CheckoutSteps current={2} back={{ label: "Volver al carrito", href: "/carrito" }} />
        <h1 className="pantalla-titulo">Confirmar pedido</h1>

        {cargandoCarrito ? (
          <Notice tone="progress">Cargando tu carrito…</Notice>
        ) : vacio ? (
          <Notice
            tone="info"
            title="Tu carrito está vacío"
            action={<Button variant="secondary" href="/">Ver productos</Button>}
          >
            Agrega productos para poder confirmar un pedido.
          </Notice>
        ) : (
          <div className="confirmar-grid">
            <div className="confirmar-principal">
              <section className="card card-pad">
                <h2 className="pantalla-seccion">Productos</h2>
                {carrito?.items.map((item) => (
                  <div className="li" key={item.id}>
                    <span>{item.product.name}{item.quantity > 1 ? ` × ${item.quantity}` : ""}</span>
                    <span>{formatoCOP(Number(item.product.digitalPrice) * item.quantity)}</span>
                  </div>
                ))}
              </section>

              <section className="card card-pad">
                <h2 className="pantalla-seccion">Retiro en sucursal</h2>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label htmlFor="sucursal">Sucursal</label>
                  <select id="sucursal" value={branchId ?? ""} onChange={(e) => setBranchId(Number(e.target.value))}>
                    {sucursales.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} — {s.city}</option>
                    ))}
                  </select>
                </div>
                <p className="faint" style={{ marginTop: 8 }}>
                  Al confirmar el pedido se genera tu código de retiro; lo verás en el comprobante cuando pagues. Se puede
                  usar una sola vez y vence 5 días calendario después.
                </p>
              </section>
            </div>

            <aside className="confirmar-lateral">
              <section className="card card-pad">
                <h2 className="pantalla-seccion">Resumen del pedido</h2>
                <div className="totalsrow"><span>Subtotal</span><span>{formatoCOP(total)}</span></div>
                <div className="totalsrow grand"><span>Total</span><span>{formatoCOP(total)}</span></div>

                <div className="cupon">
                  <label htmlFor="cupon" className="cupon-etiqueta">Cupón de lealtad</label>
                  <div className="cupon-fila">
                    <input
                      id="cupon"
                      value={couponCode}
                      placeholder="Escribe tu código"
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCuponAplicado(false);
                        if (aviso?.donde === "cupon") setAviso(null);
                      }}
                    />
                    <Button variant="secondary" disabled={!couponCode} onClick={() => setCuponAplicado(true)}>Aplicar</Button>
                  </div>
                  {cuponAplicado && aviso?.donde !== "cupon" && (
                    <Notice tone="info">Usaremos el cupón {couponCode} al confirmar el pedido. Si no es válido, te avisamos aquí.</Notice>
                  )}
                  {aviso?.donde === "cupon" && (
                    <Notice tone="danger" title={aviso.titulo} action={accionDe(aviso)}>{aviso.texto}</Notice>
                  )}
                  <p className="faint">Cada cupón se usa una sola vez por pedido.</p>
                </div>
              </section>

              {aviso?.donde === "resumen" && (
                <Notice tone="danger" title={aviso.titulo} action={accionDe(aviso)}>{aviso.texto}</Notice>
              )}

              <Notice tone="info">Al confirmar el pedido reservamos tus unidades hasta que pagues.</Notice>

              <Button size="lg" full loading={confirmando} onClick={confirmar}>Confirmar pedido</Button>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
