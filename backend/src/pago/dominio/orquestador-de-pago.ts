import { Injectable, NotFoundException } from "@nestjs/common";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import type { Stripe } from "stripe";
import { PrismaService } from "../../prisma/prisma.service";
import { PagoService } from "../pago.service";
import { Pago } from "./pago";
import { PagoConTarjeta } from "./pago-con-tarjeta";
import { PagoConDebitoBancario } from "./pago-con-debito-bancario";

export type MetodoDePago = "tarjeta" | "debito";

// Clase de control OrquestadorDePago (Plan_Pruebas_ComproYa.docx, PR-07,
// PR-08, PI-05). Envuelve PagoService (que ya orquesta ambos métodos de pago
// y el webhook de Stripe) para exponer un único punto de entrada
// `procesarPago()` que despacha a PagoConTarjeta o PagoConDebitoBancario.
@Injectable()
export class OrquestadorDePago {
  constructor(
    private readonly pagoService: PagoService,
    private readonly prisma: PrismaService,
  ) {}

  crearPagoConTarjeta(orderId: number): PagoConTarjeta {
    return new PagoConTarjeta(orderId, PaymentStatus.PENDING, this.pagoService);
  }

  crearPagoConDebito(orderId: number): PagoConDebitoBancario {
    return new PagoConDebitoBancario(orderId, PaymentStatus.PENDING, this.pagoService, this.prisma);
  }

  // `eventoSimulado`: en pruebas de unidad/integración simula lo que en
  // producción entrega el webhook real de Stripe (o la notificación de
  // débito) — nunca se espera el paso del tiempo real (PR-07/PR-08).
  async procesarPago(
    customerId: number,
    orderId: number,
    metodo: MetodoDePago,
    eventoSimulado?: Stripe.Event,
  ): Promise<Pago> {
    if (metodo === "tarjeta") {
      await this.crearPagoConTarjeta(orderId).procesar(customerId);
      if (eventoSimulado) {
        await this.pagoService.manejarEventoStripe(eventoSimulado);
      }
    } else {
      await this.crearPagoConDebito(orderId).procesar(customerId);
    }
    return this.obtenerEstado(orderId);
  }

  private async obtenerEstado(orderId: number): Promise<Pago> {
    const payment = await this.prisma.payment.findUnique({ where: { orderId } });
    if (!payment) throw new NotFoundException("Pago no encontrado tras procesarlo");
    return payment.method === PaymentMethod.CARD
      ? new PagoConTarjeta(payment.orderId, payment.status, this.pagoService)
      : new PagoConDebitoBancario(payment.orderId, payment.status, this.pagoService, this.prisma);
  }
}
