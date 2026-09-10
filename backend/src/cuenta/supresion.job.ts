import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { CuentaService } from "./cuenta.service";

// RN-11: toda solicitud de supresión se ejecuta dentro de las 72 horas
// siguientes. En producción esto es un Cloud Run Job disparado por Cloud
// Scheduler (docs/arquitectura.md sección 8); aquí, dentro del mismo
// monolito modular, con un cron de NestJS. Se puede desactivar con
// `JOBS_ENABLED=false` (por ejemplo en las pruebas, que llaman
// `procesarSolicitudesPendientes` directamente para no depender del reloj).
@Injectable()
export class SupresionJob {
  private readonly logger = new Logger(SupresionJob.name);

  constructor(private readonly cuenta: CuentaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async ejecutar() {
    if (process.env.JOBS_ENABLED === "false") return;
    const procesadas = await this.cuenta.procesarSolicitudesPendientes();
    if (procesadas > 0) {
      this.logger.log(`RN-11: ${procesadas} solicitud(es) de supresión ejecutada(s)`);
    }
  }
}
