import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CurrentCustomer } from "../auth/current-customer.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PedidoService } from "./pedido.service";
import { ValidarCuponDto } from "./dto/validar-cupon.dto";

// CU-10 Aplicación de cupón de lealtad: valida el código y devuelve el descuento y el total reales sobre el
// carrito del cliente, para mostrarlos antes de confirmar el pedido. No redime nada (RN-07 se cumple al confirmar).
@Controller("cupones")
export class CuponesController {
  constructor(private readonly pedido: PedidoService) {}

  @UseGuards(JwtAuthGuard)
  @Post("validar")
  validar(@CurrentCustomer() customer: { customerId: number }, @Body() dto: ValidarCuponDto) {
    return this.pedido.validarCupon(customer.customerId, dto.codigo);
  }
}
