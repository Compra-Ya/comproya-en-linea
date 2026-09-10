import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentCustomer } from "../auth/current-customer.decorator";
import { PedidoService } from "./pedido.service";
import { ConfirmarPedidoDto } from "./dto/confirmar-pedido.dto";

@UseGuards(JwtAuthGuard)
@Controller("pedidos")
export class PedidoController {
  constructor(private readonly pedido: PedidoService) {}

  @Post("confirmar")
  confirmar(@CurrentCustomer() customer: { customerId: number }, @Body() dto: ConfirmarPedidoDto) {
    return this.pedido.confirmar(customer.customerId, dto);
  }

  @Get()
  listar(@CurrentCustomer() customer: { customerId: number }) {
    return this.pedido.listarPorCliente(customer.customerId);
  }

  @Get(":id")
  obtener(@Param("id", ParseIntPipe) id: number) {
    return this.pedido.obtener(id);
  }
}
