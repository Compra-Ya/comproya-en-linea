"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { MODO_ENVIO, PASOS_COMPRA } from "@/lib/modo";
import type { Pedido } from "@/lib/types";
import ShopHeaderConectado from "@/components/ShopHeaderConectado";
import { Button, CheckoutSteps, Icon, Notice, formatoCOP } from "@/components/ui";

// P-15 Pago con tarjeta (CU-15, Stripe Checkout) y P-16 Pago con débito bancario (CU-16, simulado).
// Paso 3 de 4. Diferencia deliberada frente al mockup: la tarjeta no se pide en este formulario —
// RN-06 exige que ComproYa nunca la reciba, así que un botón lleva a la página que aloja la pasarela
// (donde sí se captura). En la venta digital (modo por defecto) solo existe el pago con tarjeta.
export default function PagoPage() {
  const params = useParams<{ orderId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const orderId = Number(params.orderId);
  const [tab, setTab] = useState<"tarjeta" | "debito">("tarjeta");
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [errorPedido, setErrorPedido] = useState<"sesion" | "ajeno" | "otro" | null>(null);
  const [cancelado] = useState(!!search.get("cancelado"));
  const [error, setError] = useState<string | null>(null);
  const [cargandoTarjeta, setCargandoTarjeta] = useState(false);
  const [debito, setDebito] = useState<{ referencia: string } | null>(null);
  const [notificando, setNotificando] = useState(false);

  useEffect(() => {
    api<Pedido>(`/pedidos/${orderId}`)
      .then(setPedido)
      .catch((e) => setErrorPedido(e instanceof ApiError ? (e.status === 401 ? "sesion" : e.status === 403 ? "ajeno" : "otro") : "otro"));
  }, [orderId]);

  async function pagarConTarjeta() {
    setError(null);
    setCargandoTarjeta(true);
    try {
      const { redirectUrl } = await api<{ redirectUrl: string }>(`/pagos/tarjeta/${orderId}`, { method: "POST" });
      window.location.href = redirectUrl;
    } catch (e) {
      setError(e instanceof ApiError && /ya no admite/.test(e.message)
        ? "Este pedido ya no admite pagos. Revisa su estado en Mis pedidos."
        : "No pudimos abrir la pasarela de pago. Inténtalo de nuevo.");
      setCargandoTarjeta(false);
    }
  }

  async function iniciarDebito() {
    setError(null);
    try {
      const resultado = await api<{ referencia: string }>(`/pagos/debito/${orderId}`, { method: "POST" });
      setDebito(resultado);
    } catch {
      setError("No pudimos iniciar el pago con débito bancario. Inténtalo de nuevo.");
    }
  }

  // Simula la notificación de débito bancario que en el canon entrega la pasarela de pagos (sección 3).
  async function simularNotificacion(exitoso: boolean) {
    setNotificando(true);
    setError(null);
    try {
      await api(`/pagos/debito/${orderId}/notificacion`, { method: "POST", auth: false, body: { exitoso } });
      if (exitoso) router.push(`/comprobante/${orderId}`);
      else setError("Tu banco rechazó el pago. Cancelamos el pedido y liberamos tus unidades.");
    } catch {
      setError("No pudimos procesar la respuesta del banco. Inténtalo de nuevo.");
    } finally {
      setNotificando(false);
    }
  }

  const envio = pedido?.deliveryMode === "SHIPPING";
  const subtotal = pedido?.items.reduce((acc, i) => acc + Number(i.unitPrice) * i.quantity, 0) ?? 0;

  return (
    <div>
      <ShopHeaderConectado variant="compact" active="carrito" />
      <main className="pantalla">
        <CheckoutSteps current={3} steps={PASOS_COMPRA} back={{ label: MODO_ENVIO ? "Volver a datos y envío" : "Volver a confirmar pedido", href: "/pedido/confirmar" }} />
        <h1 className="pantalla-titulo">Pagar pedido #{orderId}</h1>

        {errorPedido === "sesion" && (
          <Notice tone="danger" title="Inicia sesión para pagar tu pedido" action={<Button href={`/ingresar?volver=/pago/${orderId}`} icon="user">Iniciar sesión</Button>}>
            Necesitamos saber quién hace el pedido.
          </Notice>
        )}
        {errorPedido === "ajeno" && (
          <Notice tone="danger" title="No encontramos este pedido en tu cuenta" action={<Button variant="secondary" href="/pedidos">Ver mis pedidos</Button>}>
            Revisa que hayas iniciado sesión con la cuenta que hizo el pedido.
          </Notice>
        )}
        {cancelado && (
          <Notice tone="warn" title="No se completó tu pago">
            Tu pedido sigue creado. Puedes intentar de nuevo con la misma tarjeta o con otra.
          </Notice>
        )}
        {error && <Notice tone="danger" title="No pudimos completar la acción" action={<Button variant="secondary" href="/pedidos">Ver mis pedidos</Button>}>{error}</Notice>}

        <div className="confirmar-grid">
          <div className="confirmar-principal">
            {!MODO_ENVIO && (
              <div className="tabs">
                <button className={tab === "tarjeta" ? "active" : undefined} onClick={() => setTab("tarjeta")}>Pago con tarjeta</button>
                <button className={tab === "debito" ? "active" : undefined} onClick={() => setTab("debito")}>Pago con débito bancario</button>
              </div>
            )}

            <section className="card card-pad">
              {tab === "tarjeta" ? (
                <div className="formulario">
                  <h2 className="pantalla-seccion"><Icon name="card" size={20} /> Pago con tarjeta</h2>
                  <p className="ayuda">
                    Al continuar te llevamos a la página segura de la pasarela de pagos. ComproYa nunca ve ni guarda los datos de tu tarjeta.
                  </p>
                  <Notice tone="info" title="Modo de prueba">
                    Usa la tarjeta 4242 4242 4242 4242, cualquier fecha futura y cualquier código de seguridad. No se cobra dinero real.
                  </Notice>
                  <Button size="lg" full icon="card" loading={cargandoTarjeta} onClick={pagarConTarjeta} disabled={errorPedido !== null}>
                    Pagar con tarjeta
                  </Button>
                </div>
              ) : !debito ? (
                <div className="formulario">
                  <h2 className="pantalla-seccion"><Icon name="bank" size={20} /> Pago con débito bancario</h2>
                  <Notice tone="warn">Si tu banco no confirma el pago en 30 minutos, cancelamos el pedido y liberamos tus unidades.</Notice>
                  <Button size="lg" full onClick={iniciarDebito}>Continuar con el pago con débito bancario</Button>
                </div>
              ) : (
                <div className="formulario">
                  <p className="ayuda">Referencia de pago: {debito.referencia}</p>
                  <Notice tone="progress" title="Esperando la confirmación de tu banco">Tienes 30 minutos. Esta pantalla se actualiza sola.</Notice>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button loading={notificando} onClick={() => simularNotificacion(true)}>Simular confirmación</Button>
                    <Button variant="danger" disabled={notificando} onClick={() => simularNotificacion(false)}>Simular rechazo</Button>
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside className="confirmar-lateral">
            <section className="card card-pad">
              <h2 className="pantalla-seccion">Tu pedido</h2>
              {pedido ? (
                <>
                  {pedido.items.map((item) => (
                    <div className="li" key={item.id}>
                      <span>{item.product.name}{item.quantity > 1 ? ` × ${item.quantity}` : ""}</span>
                      <span>{formatoCOP(Number(item.unitPrice) * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="totalsrow"><span>Subtotal</span><span>{formatoCOP(subtotal)}</span></div>
                  <p className="faint" style={{ marginTop: 8 }}>El total final, con tu cupón si aplicaste uno, aparece en la pasarela y en tu pedido confirmado.</p>
                </>
              ) : errorPedido ? null : (
                <Notice tone="progress">Cargando tu pedido…</Notice>
              )}
            </section>

            {envio && pedido && (
              <section className="card card-pad">
                <h2 className="pantalla-seccion"><Icon name="package" size={20} /> Envío a</h2>
                <p className="linea-nombre">{pedido.shippingName}</p>
                <p className="faint">{pedido.shippingAddress}, {pedido.shippingCity}</p>
                <p className="faint">Tel. {pedido.shippingPhone}</p>
              </section>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
