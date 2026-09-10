import { Module } from "@nestjs/common";
import { CatalogoController } from "./catalogo.controller";
import { CatalogoService } from "./catalogo.service";
import { AdaptadorErpSimulado } from "./puertos/adaptador-erp-simulado";

// SP-01 (gobierno del catálogo) y SP-02 (disponibilidad) — canon sección 6,
// sprint 1. Otros módulos (pedido) consumen `AdaptadorErpSimulado` a través
// de este módulo, nunca importan `Availability`/`Product` directamente.
@Module({
  controllers: [CatalogoController],
  providers: [CatalogoService, AdaptadorErpSimulado],
  exports: [CatalogoService],
})
export class CatalogoModule {}
