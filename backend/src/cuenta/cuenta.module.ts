import { Module } from "@nestjs/common";
import { CuentaController } from "./cuenta.controller";
import { CuentaService } from "./cuenta.service";
import { AdaptadorLealtadSimulado } from "./puertos/adaptador-lealtad-simulado";
import { SupresionJob } from "./supresion.job";
import { GestorDeRegistro } from "./dominio/gestor-de-registro";
import { GestorDeConsentimiento } from "./dominio/gestor-de-consentimiento";

// SP-07 (identidad del comprador digital) y SP-08 (consentimiento y registro
// del comportamiento) — canon sección 6, sprint 2.
@Module({
  controllers: [CuentaController],
  providers: [CuentaService, AdaptadorLealtadSimulado, SupresionJob, GestorDeRegistro, GestorDeConsentimiento],
  exports: [CuentaService, GestorDeRegistro, GestorDeConsentimiento],
})
export class CuentaModule {}
