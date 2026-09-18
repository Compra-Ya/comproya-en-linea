import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentCustomer } from "../auth/current-customer.decorator";
import { PedidoService } from "./pedido.service";
import { ConfirmarPedidoDto } from "./dto/confirmar-pedido.dto";
import { RetirarPedidoDto } from "./dto/retirar-pedido.dto";

@Controller("pedidos")
export class PedidoController {
  constructor(private readonly pedido: PedidoService) {}

  @UseGuards(JwtAuthGuard)
  @Post("confirmar")
  confirmar(@CurrentCustomer() customer: { customerId: number }, @Body() dto: ConfirmarPedidoDto) {
    return this.pedido.confirmar(customer.customerId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  listar(@CurrentCustomer() customer: { customerId: number }) {
    return this.pedido.listarPorCliente(customer.customerId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  obtener(@Param("id", ParseIntPipe) id: number) {
    return this.pedido.obtener(id);
  }

  // Alcance mínimo de "operación" (RN-09, sprint 6) — endpoints internos sin
  // autenticación de rol, mismo patrón que
  // POST /catalogo/sucursales/:id/sincronizar. No reemplazan CU-11 a CU-14.
  @Post(":id/cancelar")
  cancelar(@Param("id", ParseIntPipe) id: number) {
    return this.pedido.cancelar(id);
  }

  @Post(":id/iniciar-alistamiento")
  iniciarAlistamiento(@Param("id", ParseIntPipe) id: number) {
    return this.pedido.iniciarAlistamiento(id);
  }

  @Post(":id/listo-para-retiro")
  marcarListoParaRetiro(@Param("id", ParseIntPipe) id: number) {
    return this.pedido.marcarListoParaRetiro(id);
  }

  @Post(":id/retirar")
  retirar(@Param("id", ParseIntPipe) id: number, @Body() dto: RetirarPedidoDto) {
    return this.pedido.retirarConCodigo(id, dto.pickupCode);
  }
}
