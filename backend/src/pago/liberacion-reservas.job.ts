import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PagoService } from "./pago.service";

// docs/arquitectura.md sección 8: pago con tarjeta fallido libera la reserva
// en ≤ 15 min; débito bancario sin confirmar cancela el pedido a los 30 min.
// Red de seguridad frente a webhooks/notificaciones perdidas — el camino
// principal ya libera al recibir el evento (ver PagoService).
@Injectable()
export class LiberacionReservasJob {
  private readonly logger = new Logger(LiberacionReservasJob.name);

  constructor(private readonly pago: PagoService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async ejecutar() {
    if (process.env.JOBS_ENABLED === "false") return;
    const liberados = await this.pago.liberarPagosVencidos();
    if (liberados > 0) {
      this.logger.log(`${liberados} pago(s) vencido(s) liberados/cancelados`);
    }
  }
}
