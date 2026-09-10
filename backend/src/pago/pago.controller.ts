import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentCustomer } from "../auth/current-customer.decorator";
import { PagoService } from "./pago.service";
import { AdaptadorStripe } from "./puertos/adaptador-stripe";
import { NotificarDebitoDto } from "./dto/notificar-debito.dto";

@Controller("pagos")
export class PagoController {
  constructor(
    private readonly pago: PagoService,
    private readonly stripe: AdaptadorStripe,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post("tarjeta/:orderId")
  crearSesionTarjeta(@CurrentCustomer() customer: { customerId: number }, @Param("orderId", ParseIntPipe) orderId: number) {
    return this.pago.crearSesionTarjeta(customer.customerId, orderId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("debito/:orderId")
  crearIntentoDebito(@CurrentCustomer() customer: { customerId: number }, @Param("orderId", ParseIntPipe) orderId: number) {
    return this.pago.crearIntentoDebito(customer.customerId, orderId);
  }

  // Simula la notificación de débito bancario que en el canon entrega la
  // pasarela de pagos (sección 3) — no hay pasarela de débito real conectada.
  @Post("debito/:orderId/notificacion")
  notificarDebito(@Param("orderId", ParseIntPipe) orderId: number, @Body() dto: NotificarDebitoDto) {
    return this.pago.notificarDebito(orderId, dto.exitoso);
  }

  @UseGuards(JwtAuthGuard)
  @Get(":orderId/comprobante")
  comprobante(@CurrentCustomer() customer: { customerId: number }, @Param("orderId", ParseIntPipe) orderId: number) {
    return this.pago.obtenerComprobante(customer.customerId, orderId);
  }

  // RN-06 / paso 7 de la sección 5 de la tarea: nunca se procesa un webhook
  // sin validar `Stripe-Signature` contra el signing secret.
  @Post("webhook/stripe")
  async webhookStripe(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers("stripe-signature") signature: string,
  ) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new BadRequestException("Falta STRIPE_WEBHOOK_SECRET");
    if (!req.rawBody) throw new BadRequestException("Falta el cuerpo crudo de la petición para verificar la firma");

    let event;
    try {
      event = this.stripe.cliente.webhooks.constructEvent(req.rawBody, signature, secret);
    } catch (error) {
      throw new BadRequestException(`Firma de webhook inválida: ${(error as Error).message}`);
    }
    await this.pago.manejarEventoStripe(event);
    return { received: true };
  }
}
