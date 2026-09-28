import { timingSafeEqual } from "crypto";
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
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentCustomer } from "../auth/current-customer.decorator";
import { AuditoriaService } from "../auditoria/auditoria.service";
import { PagoService } from "./pago.service";
import { AdaptadorStripe } from "./puertos/adaptador-stripe";
import { NotificarDebitoDto } from "./dto/notificar-debito.dto";

// Compara el secreto recibido contra el configurado en tiempo constante
// (crypto.timingSafeEqual), igualando longitudes de antemano para no filtrar
// por qué tan larga es la coincidencia — mismo cuidado que la verificación de
// firma de Stripe, adaptado a un secreto compartido simple porque este
// endpoint simulado no pasa por ningún SDK de pasarela real.
function secretoValido(recibido: string | undefined, esperado: string): boolean {
  if (!recibido) return false;
  const bufferRecibido = Buffer.from(recibido);
  const bufferEsperado = Buffer.from(esperado);
  if (bufferRecibido.length !== bufferEsperado.length) return false;
  return timingSafeEqual(bufferRecibido, bufferEsperado);
}

@Controller("pagos")
export class PagoController {
  constructor(
    private readonly pago: PagoService,
    private readonly stripe: AdaptadorStripe,
    private readonly auditoria: AuditoriaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post("tarjeta/:orderId")
  async crearSesionTarjeta(@CurrentCustomer() customer: { customerId: number }, @Param("orderId", ParseIntPipe) orderId: number) {
    const resultado = await this.pago.crearSesionTarjeta(customer.customerId, orderId);
    await this.auditoria.registrar({ action: "pago.crearSesionTarjeta", customerId: customer.customerId, orderId });
    return resultado;
  }

  @UseGuards(JwtAuthGuard)
  @Post("debito/:orderId")
  async crearIntentoDebito(@CurrentCustomer() customer: { customerId: number }, @Param("orderId", ParseIntPipe) orderId: number) {
    const resultado = await this.pago.crearIntentoDebito(customer.customerId, orderId);
    await this.auditoria.registrar({ action: "pago.crearIntentoDebito", customerId: customer.customerId, orderId });
    return resultado;
  }

  // Simula la notificación de débito bancario que en el canon entrega la
  // pasarela de pagos (sección 3) — no hay pasarela de débito real conectada,
  // así que se verifica un secreto compartido (X-Debito-Secreto) en vez de la
  // firma real de una pasarela que no existe. Sin identidad de cliente: quien
  // llama es un sistema externo, no un cliente autenticado.
  @Post("debito/:orderId/notificacion")
  async notificarDebito(
    @Headers("x-debito-secreto") secreto: string | undefined,
    @Param("orderId", ParseIntPipe) orderId: number,
    @Body() dto: NotificarDebitoDto,
  ) {
    const esperado = process.env.DEBITO_NOTIFICATION_SECRET;
    if (!esperado) throw new BadRequestException("Falta DEBITO_NOTIFICATION_SECRET");
    if (!secretoValido(secreto, esperado)) {
      throw new UnauthorizedException("Encabezado X-Debito-Secreto ausente o inválido");
    }
    const resultado = await this.pago.notificarDebito(orderId, dto.exitoso);
    await this.auditoria.registrar({ action: "pago.notificarDebito", orderId });
    return resultado;
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
