import { Module } from "@nestjs/common";
import { CatalogoModule } from "../catalogo/catalogo.module";
import { CarritoController } from "./carrito.controller";
import { CarritoService } from "./carrito.service";

// SP-03 (sostenimiento de la intención de compra) — canon sección 6, sprint 3.
@Module({
  imports: [CatalogoModule],
  controllers: [CarritoController],
  providers: [CarritoService],
  exports: [CarritoService],
})
export class CarritoModule {}
