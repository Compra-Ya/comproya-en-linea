import { Module } from "@nestjs/common";
import { CatalogoModule } from "../catalogo/catalogo.module";
import { CarritoModule } from "../carrito/carrito.module";
import { PedidoController } from "./pedido.controller";
import { PedidoService } from "./pedido.service";

// SP-04 (cierre de la transacción de venta) — canon sección 6, sprint 4.
@Module({
  imports: [CatalogoModule, CarritoModule],
  controllers: [PedidoController],
  providers: [PedidoService],
  exports: [PedidoService],
})
export class PedidoModule {}
