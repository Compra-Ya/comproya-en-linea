import { Module } from "@nestjs/common";
import { CuentaController } from "./cuenta.controller";
import { CuentaService } from "./cuenta.service";
import { AdaptadorLealtadSimulado } from "./puertos/adaptador-lealtad-simulado";
import { SupresionJob } from "./supresion.job";

// SP-07 (identidad del comprador digital) y SP-08 (consentimiento y registro
// del comportamiento) — canon sección 6, sprint 2.
@Module({
  controllers: [CuentaController],
  providers: [CuentaService, AdaptadorLealtadSimulado, SupresionJob],
  exports: [CuentaService],
})
export class CuentaModule {}
