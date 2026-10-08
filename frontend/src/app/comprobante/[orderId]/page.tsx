"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { MODO_ENVIO, PASOS_COMPRA } from "@/lib/modo";
import type { Comprobante } from "@/lib/types";
import ShopHeaderConectado from "@/components/ShopHeaderConectado";
import { Button, CheckoutSteps, Icon, Notice, formatoCOP } from "@/components/ui";

// P-17 Emisión del comprobante (CU-17) = "Pedido confirmado" en la venta digital. Paso 4 de 4. Solo
// se muestra cuando el webhook de la pasarela (o la notificación del banco) ya confirmó el pago;
// mientras tanto el servidor responde 400 y esta pantalla reintenta cada 2 s hasta 30 s, mostrando
// el estado. Cada error se explica según su causa (sin sesión, pedido ajeno, pago sin confirmar).
const INTENTOS_MAXIMOS = 15;

type Fallo = "sesion" | "ajeno" | "pendiente" | "otro";

export default function ComprobantePage() {
  const params = useParams<{ orderId: string }>();
  const orderId = Number(params.orderId);
  const [comprobante, setComprobante] = useState<Comprobante | null>(null);
  const [fallo, setFallo] = useState<Fallo | null>(null);
  const [consultando, setConsultando] = useState(true);
  const [ronda, setRonda] = useState(0);

  useEffect(() => {
    let cancelado = false;
    let intentos = 0;
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    setConsultando(true);
    setFallo(null);

    async function intentar() {
      try {
        const resultado = await api<Comprobante>(`/pagos/${orderId}/comprobante`);
        if (!cancelado) {
          setComprobante(resultado);
          setConsultando(false);
        }
      } catch (e) {
        if (cancelado) return;
        const estado = e instanceof ApiError ? e.status : 0;
        // 401 y 403 no se arreglan esperando: se muestran de inmediato.
        if (estado === 401 || estado === 403) {
          setFallo(estado === 401 ? "sesion" : "ajeno");
          setConsultando(false);
          return;
        }
        intentos += 1;
        if (intentos >= INTENTOS_MAXIMOS) {
          setFallo(estado === 400 ? "pendiente" : "otro");
          setConsultando(false);
          return;
        }
        temporizador = setTimeout(intentar, 2000);
      }
    }
    intentar();
    return () => {
      cancelado = true;
      if (temporizador) clearTimeout(temporizador);
    };
  }, [orderId, ronda]);

  const envio = comprobante?.deliveryMode === "SHIPPING";

  return (
    <div>
      <ShopHeaderConectado variant="compact" active="pedidos" />
      <main className="pantalla">
        <CheckoutSteps current={4} steps={PASOS_COMPRA} />

        {consultando && (
          <Notice tone="progress" title="Estamos confirmando tu pago…">
            Esto toma unos segundos. No cierres esta página.
          </Notice>
        )}
        {fallo === "sesion" && (
          <Notice tone="danger" title="Inicia sesión para ver tu pedido" action={<Button href={`/ingresar?volver=/comprobante/${orderId}`} icon="user">Iniciar sesión</Button>}>
            Tu pedido está guardado en tu cuenta.
          </Notice>
        )}
        {fallo === "ajeno" && (
          <Notice tone="danger" title="No encontramos este pedido en tu cuenta" action={<Button variant="secondary" href="/pedidos">Ver mis pedidos</Button>}>
            Revisa que hayas iniciado sesión con la cuenta que hizo el pedido.
          </Notice>
        )}
        {fallo === "pendiente" && (
          <Notice
            tone="warn"
            title="Todavía no recibimos la confirmación de tu pago"
            action={
              <>
                <Button icon="clock" onClick={() => setRonda((r) => r + 1)}>Revisar de nuevo</Button>
                <Button variant="ghost" href="/pedidos">Ver mis pedidos</Button>
              </>
            }
          >
            Si ya pagaste, puede tardar un poco. Si no completaste el pago, puedes pagar desde Mis pedidos.
          </Notice>
        )}
        {fallo === "otro" && (
          <Notice
            tone="danger"
            title="No pudimos consultar tu pedido"
            action={<Button variant="secondary" onClick={() => setRonda((r) => r + 1)}>Reintentar</Button>}
          >
            Revisa tu conexión e inténtalo de nuevo.
          </Notice>
        )}

        {comprobante && (
          <>
            <header className="confirmado-cabecera">
              <span className="confirmado-icono"><Icon name="check-circle" size={40} /></span>
              <div>
                <h1 className="pantalla-titulo">{MODO_ENVIO ? "¡Pedido confirmado!" : "¡Pago confirmado!"}</h1>
                <p className="muted">Pedido #{comprobante.idPedido}. Recibimos tu pago.</p>
              </div>
            </header>

            <div className="confirmar-grid">
              <div className="confirmar-principal">
                <section className="card card-pad">
                  <h2 className="pantalla-seccion">Productos</h2>
                  {comprobante.items.map((item) => (
                    <div className="li" key={item.id}>
                      <span>{item.product.name}{item.quantity > 1 ? ` × ${item.quantity}` : ""}</span>
                      <span>{formatoCOP(Number(item.unitPrice) * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="li" style={{ borderBottom: "none", fontWeight: 800, color: "var(--ink)" }}>
                    <span>Total pagado</span>
                    {/* El total es el que calculó y cobró el servidor (incluye el cupón); no se recalcula aquí. */}
                    <span>{formatoCOP(comprobante.total)}</span>
                  </div>
                </section>
              </div>

              <aside className="confirmar-lateral">
                {envio ? (
                  <section className="card card-pad">
                    <h2 className="pantalla-seccion"><Icon name="package" size={20} /> Te lo enviamos a</h2>
                    <p className="linea-nombre">{comprobante.shippingName}</p>
                    <p>{comprobante.shippingAddress}</p>
                    <p>{comprobante.shippingCity}</p>
                    <p className="faint">Tel. {comprobante.shippingPhone}</p>
                    {comprobante.shippingNotes && <p className="faint">Indicaciones: {comprobante.shippingNotes}</p>}
                  </section>
                ) : (
                  <section className="card card-pad">
                    <div className="retiro-code">
                      <span className="faint">Código de retiro</span>
                      <div className="code">{comprobante.pickupCode}</div>
                      <span className="faint">
                        Vence el {new Date(comprobante.pickupCodeExpiresAt).toLocaleDateString("es-CO")} (5 días calendario) · se puede usar una sola vez
                      </span>
                    </div>
                    <p className="faint" style={{ marginTop: 10 }}>Retira en {comprobante.branch.name}, {comprobante.branch.city}</p>
                  </section>
                )}
                <Button size="lg" full icon="receipt" href="/pedidos">Ver mis pedidos</Button>
                <Button variant="secondary" full href="/">Seguir comprando</Button>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
