import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

interface RegistrarAuditoria {
  action: string;
  customerId?: number;
  orderId?: number;
}

// Auditabilidad de acceso (ISO/IEC 9126-3, 8.1.4): quién ejecutó cada
// operación sensible del Caso de Uso 2 y cuándo. `customerId` queda sin
// definir cuando la acción la dispara un sistema externo simulado (la
// notificación de débito bancario) y no hay identidad de cliente que registrar.
@Injectable()
export class AuditoriaService {
  constructor(private readonly prisma: PrismaService) {}

  async registrar({ action, customerId, orderId }: RegistrarAuditoria) {
    await this.prisma.auditLog.create({
      data: { action, customerId, orderId },
    });
  }
}
