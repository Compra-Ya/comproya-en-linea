import { Module } from "@nestjs/common";
import { CatalogoModule } from "../catalogo/catalogo.module";
import { CarritoModule } from "../carrito/carrito.module";
import { AuditoriaModule } from "../auditoria/auditoria.module";
import { PedidoController } from "./pedido.controller";
import { CuponesController } from "./cupones.controller";
import { PedidoService } from "./pedido.service";
import { VentasController } from "./ventas.controller";
import { VentasService } from "./ventas.service";

// SP-04 (cierre de la transacción de venta) — canon sección 6, sprint 4.
@Module({
  imports: [CatalogoModule, CarritoModule, AuditoriaModule],
  controllers: [PedidoController, CuponesController, VentasController],
  providers: [PedidoService, VentasService],
  exports: [PedidoService],
})
export class PedidoModule {}
