import { Module } from "@nestjs/common";
import { AuditoriaService } from "./auditoria.service";

// Auditoría de acceso a operaciones sensibles de pedido y pago — no es
// @Global() a propósito: solo los módulos que de verdad registran eventos
// (pedido, pago) la importan explícitamente.
@Module({
  providers: [AuditoriaService],
  exports: [AuditoriaService],
})
export class AuditoriaModule {}
