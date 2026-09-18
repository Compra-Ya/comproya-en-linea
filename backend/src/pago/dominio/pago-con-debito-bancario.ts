import { NotFoundException } from "@nestjs/common";
import { PaymentStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { PagoService } from "../pago.service";
import { Pago } from "./pago";

// Mismo plazo que usa PagoService.liberarPagosVencidos() para débito
// bancario (canon, sección 10) — se repite aquí porque esa constante es
// privada en pago.service.ts y ambos representan la misma regla fija.
const TREINTA_MINUTOS_MS = 30 * 60 * 1000;

// Clase de diseño PagoConDebitoBancario (Plan_Pruebas_ComproYa.docx, PR-09).
// Envuelve PagoService.crearIntentoDebito()/notificarDebito() — CU-16.
export class PagoConDebitoBancario extends Pago {
  constructor(
    orderId: number,
    status: PaymentStatus,
    private readonly pagoService?: PagoService,
    private readonly prisma?: PrismaService,
  ) {
    super(orderId, status);
  }

  async procesar(customerId: number): Promise<{ referencia: string }> {
    if (!this.pagoService) {
      throw new Error("PagoConDebitoBancario necesita PagoService para procesar un cobro");
    }
    return this.pagoService.crearIntentoDebito(customerId, this.orderId);
  }

  // PR-09: reserva exitosa, pago con débito bancario sin confirmación
  // pasados 30 minutos -> Pago.estado = fallido, pedido cancelado, reserva
  // liberada. Devuelve si el pago terminó confirmado (true) o no (false).
  async esperarConfirmacion(ahora: Date = new Date()): Promise<boolean> {
    if (!this.pagoService || !this.prisma) {
      throw new Error("PagoConDebitoBancario necesita PagoService y PrismaService para esperar confirmación");
    }
    const payment = await this.prisma.payment.findUnique({ where: { orderId: this.orderId } });
    if (!payment) throw new NotFoundException("Pago no encontrado");
    if (payment.status === PaymentStatus.CONFIRMED) return true;

    const vencioElPlazo = ahora.getTime() - payment.createdAt.getTime() >= TREINTA_MINUTOS_MS;
    if (vencioElPlazo) {
      await this.pagoService.notificarDebito(this.orderId, false);
      return false;
    }
    return false;
  }
}
