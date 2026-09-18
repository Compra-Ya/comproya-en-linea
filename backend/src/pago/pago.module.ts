import { Module } from "@nestjs/common";
import { PedidoModule } from "../pedido/pedido.module";
import { PagoController } from "./pago.controller";
import { PagoService } from "./pago.service";
import { AdaptadorStripe } from "./puertos/adaptador-stripe";
import { LiberacionReservasJob } from "./liberacion-reservas.job";
import { OrquestadorDePago } from "./dominio/orquestador-de-pago";
import { GeneradorDeComprobante } from "./dominio/generador-de-comprobante";

// SP-05 (cobro y conciliación) — canon sección 6, sprint 5.
@Module({
  imports: [PedidoModule],
  controllers: [PagoController],
  providers: [PagoService, AdaptadorStripe, LiberacionReservasJob, OrquestadorDePago, GeneradorDeComprobante],
  exports: [PagoService, OrquestadorDePago, GeneradorDeComprobante],
})
export class PagoModule {}
