import { randomUUID } from "crypto";
import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { PedidoService } from "../pedido/pedido.service";
import { AdaptadorStripe } from "./puertos/adaptador-stripe";

// Módulo pago: SP-05 (cobro y conciliación) — sprint 5. RN-06: nunca se
// guarda un número de tarjeta, solo el token/identificador que entrega la
// pasarela.
const QUINCE_MINUTOS_MS = 15 * 60 * 1000;
const TREINTA_MINUTOS_MS = 30 * 60 * 1000;

@Injectable()
export class PagoService {
  private readonly logger = new Logger(PagoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pedido: PedidoService,
    private readonly stripe: AdaptadorStripe,
  ) {}

  private async pedidoDelCliente(customerId: number, orderId: number) {
    const order = await this.pedido.obtener(orderId);
    if (order.customerId !== customerId) {
      throw new ForbiddenException("Este pedido no pertenece al cliente autenticado");
    }
    return order;
  }

  // CU-15 Pago con tarjeta — paso 1: el backend crea la Checkout Session.
  async crearSesionTarjeta(customerId: number, orderId: number) {
    const order = await this.pedidoDelCliente(customerId, orderId);
    if (order.status !== OrderStatus.CREATED && order.status !== OrderStatus.PAYMENT_FAILED) {
      throw new BadRequestException("El pedido ya no admite un nuevo intento de pago");
    }
    const total = await this.pedido.calcularTotal(orderId);
    const sesion = await this.stripe.crearCobroConTarjeta(orderId, total, order.correlationId);

    await this.prisma.payment.upsert({
      where: { orderId },
      update: { method: PaymentMethod.CARD, status: PaymentStatus.PENDING, gatewayToken: sesion.gatewayToken },
      create: { orderId, method: PaymentMethod.CARD, status: PaymentStatus.PENDING, gatewayToken: sesion.gatewayToken },
    });
    return { redirectUrl: sesion.redirectUrl };
  }

  // Paso 5-7 del flujo Stripe: el webhook es la única fuente de verdad del
  // pago (nunca se confía en `success_url`, porque el cliente puede cerrar
  // la pestaña antes de volver).
  async manejarEventoStripe(event: import("stripe").Stripe.Event) {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as import("stripe").Stripe.Checkout.Session;
        const orderId = Number(session.metadata?.orderId);
        if (!orderId) return;
        await this.confirmarPago(orderId, String(session.payment_intent ?? session.id));
        return;
      }
      case "checkout.session.expired": {
        const session = event.data.object as import("stripe").Stripe.Checkout.Session;
        const orderId = Number(session.metadata?.orderId);
        if (!orderId) return;
        await this.marcarPagoFallido(orderId);
        return;
      }
      case "payment_intent.payment_failed": {
        const intent = event.data.object as import("stripe").Stripe.PaymentIntent;
        const orderId = Number(intent.metadata?.orderId);
        if (!orderId) return;
        await this.marcarPagoFallido(orderId);
        return;
      }
      default:
        this.logger.debug(`Evento de Stripe sin manejar: ${event.type}`);
    }
  }

  // CU-16 Pago con débito bancario — paso 1: se registra la intención.
  async crearIntentoDebito(customerId: number, orderId: number) {
    const order = await this.pedidoDelCliente(customerId, orderId);
    if (order.status !== OrderStatus.CREATED && order.status !== OrderStatus.PAYMENT_FAILED) {
      throw new BadRequestException("El pedido ya no admite un nuevo intento de pago");
    }
    const referencia = `DEBITO-${randomUUID().slice(0, 10).toUpperCase()}`;
    await this.prisma.payment.upsert({
      where: { orderId },
      update: { method: PaymentMethod.BANK_DEBIT, status: PaymentStatus.PENDING, gatewayToken: referencia },
      create: { orderId, method: PaymentMethod.BANK_DEBIT, status: PaymentStatus.PENDING, gatewayToken: referencia },
    });
    return { referencia };
  }

  // CU-16 — paso 2: notificación de débito bancario (canon, sección 3: la
  // pasarela de pagos es quien la entrega). Se simula como un endpoint
  // propio porque no hay una pasarela de débito bancario real conectada.
  async notificarDebito(orderId: number, exitoso: boolean) {
    if (exitoso) {
      await this.confirmarPago(orderId, `debito-confirmado-${orderId}`);
    } else {
      // Canon, sección 10: sin confirmación el pedido se cancela — aquí ya
      // hay una respuesta explícita de rechazo, se aplica el mismo desenlace.
      await this.marcarPagoFallido(orderId, OrderStatus.CANCELLED);
    }
  }

  private async confirmarPago(orderId: number, gatewayToken: string) {
    const payment = await this.prisma.payment.findUnique({ where: { orderId } });
    if (!payment || payment.status === PaymentStatus.CONFIRMED) return; // idempotente ante reintentos del webhook.
    await this.prisma.payment.update({
      where: { orderId },
      data: { status: PaymentStatus.CONFIRMED, gatewayToken, confirmedAt: new Date() },
    });
    // CU-17: el comprobante nunca se genera antes de que el pago quede
    // confirmado — se apoya en que el pedido solo pasa a PAID aquí.
    await this.pedido.marcarEstado(orderId, OrderStatus.PAID);
  }

  private async marcarPagoFallido(orderId: number, estadoPedido: OrderStatus = OrderStatus.PAYMENT_FAILED) {
    const payment = await this.prisma.payment.findUnique({ where: { orderId } });
    if (!payment || payment.status === PaymentStatus.CONFIRMED) return;
    await this.prisma.payment.update({ where: { orderId }, data: { status: PaymentStatus.FAILED } });
    await this.pedido.marcarEstado(orderId, estadoPedido);
    await this.pedido.liberarReservasDelPedido(orderId);
  }

  // CU-17 Emisión del comprobante — solo visible cuando el pago ya está
  // confirmado (P-6 / P-17).
  async obtenerComprobante(customerId: number, orderId: number) {
    const order = await this.pedidoDelCliente(customerId, orderId);
    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException("El comprobante no está disponible hasta que el pago quede confirmado");
    }
    return {
      idPedido: order.id,
      correlationId: order.correlationId,
      pickupCode: order.pickupCode,
      pickupCodeExpiresAt: order.pickupCodeExpiresAt,
      branch: order.branch,
      items: order.items,
      pagadoEl: order.payment?.confirmedAt,
    };
  }

  // Red de seguridad de docs/arquitectura.md sección 8: si por lo que sea el
  // webhook nunca llega (o la notificación de débito nunca llega), este job
  // hace cumplir el plazo del canon en vez de dejar la reserva viva para siempre.
  async liberarPagosVencidos(ahora = new Date()) {
    const pendientes = await this.prisma.payment.findMany({
      where: { status: PaymentStatus.PENDING },
      include: { order: true },
    });
    let liberados = 0;
    for (const pago of pendientes) {
      const limite = pago.method === PaymentMethod.CARD ? QUINCE_MINUTOS_MS : TREINTA_MINUTOS_MS;
      if (ahora.getTime() - pago.createdAt.getTime() >= limite) {
        const estado = pago.method === PaymentMethod.CARD ? OrderStatus.PAYMENT_FAILED : OrderStatus.CANCELLED;
        await this.marcarPagoFallido(pago.orderId, estado);
        liberados++;
      }
    }
    return liberados;
  }
}
