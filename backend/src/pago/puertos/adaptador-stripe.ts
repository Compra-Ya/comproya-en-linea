import { Injectable } from "@nestjs/common";
import Stripe from "stripe";
import { PuertoPasarelaDePagos, SesionDeCobro } from "./puerto-pasarela-de-pagos";

// CU-15 Pago con tarjeta. Usa Stripe Checkout (la página de pago alojada por
// Stripe) en modo de prueba — RN-06 se cumple porque el número de tarjeta se
// captura en la página de Stripe, nunca en el frontend ni el backend propios.
// No se implementa Stripe Elements ni Payment Intents manuales en esta
// entrega (docs/plan-de-trabajo.md, Fase 5).
@Injectable()
export class AdaptadorStripe implements PuertoPasarelaDePagos {
  // Se construye de forma perezosa: si STRIPE_SECRET_KEY no está configurada
  // (por ejemplo, corriendo solo los otros módulos en desarrollo), el resto
  // del backend arranca igual; solo falla el intento real de cobrar.
  private stripeClient: Stripe | null = null;

  get cliente(): Stripe {
    if (!this.stripeClient) {
      const secretKey = process.env.STRIPE_SECRET_KEY;
      if (!secretKey) {
        throw new Error("Falta STRIPE_SECRET_KEY — ver backend/.env.example");
      }
      this.stripeClient = new Stripe(secretKey, { apiVersion: "2024-06-20" });
    }
    return this.stripeClient;
  }

  async crearCobroConTarjeta(orderId: number, amount: number, correlationId: string): Promise<SesionDeCobro> {
    const frontendUrl = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";
    // `expires_at` acota la sesión a 30 minutos: si el cliente cierra la
    // pestaña sin pagar, Stripe emite `checkout.session.expired` dentro del
    // plazo que exige el canon para liberar la reserva.
    const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60;
    const session = await this.cliente.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "cop",
            product_data: { name: `Pedido ComproYa #${orderId}` },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { orderId: String(orderId), correlationId },
      expires_at: expiresAt,
      success_url: `${frontendUrl}/comprobante/${orderId}?sesion={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/pago/${orderId}?cancelado=1`,
    });
    return { gatewayToken: session.id, redirectUrl: session.url ?? "" };
  }
}
