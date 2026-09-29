import { Body, Controller, ForbiddenException, Get, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentCustomer } from "../auth/current-customer.decorator";
import { AuditoriaService } from "../auditoria/auditoria.service";
import { PedidoService } from "./pedido.service";
import { ConfirmarPedidoDto } from "./dto/confirmar-pedido.dto";
import { RetirarPedidoDto } from "./dto/retirar-pedido.dto";

@Controller("pedidos")
export class PedidoController {
  constructor(
    private readonly pedido: PedidoService,
    private readonly auditoria: AuditoriaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post("confirmar")
  async confirmar(@CurrentCustomer() customer: { customerId: number }, @Body() dto: ConfirmarPedidoDto) {
    const order = await this.pedido.confirmar(customer.customerId, dto);
    await this.auditoria.registrar({ action: "pedido.confirmar", customerId: customer.customerId, orderId: order.id });
    return order;
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  listar(@CurrentCustomer() customer: { customerId: number }) {
    return this.pedido.listarPorCliente(customer.customerId);
  }

  // Corrección CU-2 #4: antes solo exigía autenticación, sin verificar
  // pertenencia — cualquier cliente autenticado podía leer el pedido de otro.
  // Mismo patrón que `cancelar`.
  @UseGuards(JwtAuthGuard)
  @Get(":id")
  async obtener(@CurrentCustomer() customer: { customerId: number }, @Param("id", ParseIntPipe) id: number) {
    const order = await this.pedido.obtener(id);
    if (order.customerId !== customer.customerId) {
      throw new ForbiddenException("Este pedido no pertenece al cliente autenticado");
    }
    return order;
  }

  // Alcance mínimo de "operación" (RN-09, sprint 6) — el Cliente digital
  // cancela su propio pedido, por eso además de autenticarse se verifica
  // pertenencia (mismo patrón que PagoService.pedidoDelCliente, usado por
  // GET /pagos/:orderId/comprobante). Los otros tres endpoints de esta
  // sección son operación de sucursal (Gerente de Tienda), no del cliente
  // dueño: exigen solo autenticación hasta que exista el rol real de CU-11 a
  // CU-14 — no se simula un sistema de roles que todavía no existe.
  @UseGuards(JwtAuthGuard)
  @Post(":id/cancelar")
  async cancelar(@CurrentCustomer() customer: { customerId: number }, @Param("id", ParseIntPipe) id: number) {
    const order = await this.pedido.obtener(id);
    if (order.customerId !== customer.customerId) {
      throw new ForbiddenException("Este pedido no pertenece al cliente autenticado");
    }
    const cancelado = await this.pedido.cancelar(id);
    await this.auditoria.registrar({ action: "pedido.cancelar", customerId: customer.customerId, orderId: id });
    return cancelado;
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/iniciar-alistamiento")
  async iniciarAlistamiento(@CurrentCustomer() customer: { customerId: number }, @Param("id", ParseIntPipe) id: number) {
    const resultado = await this.pedido.iniciarAlistamiento(id);
    await this.auditoria.registrar({ action: "pedido.iniciarAlistamiento", customerId: customer.customerId, orderId: id });
    return resultado;
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/listo-para-retiro")
  async marcarListoParaRetiro(@CurrentCustomer() customer: { customerId: number }, @Param("id", ParseIntPipe) id: number) {
    const resultado = await this.pedido.marcarListoParaRetiro(id);
    await this.auditoria.registrar({ action: "pedido.marcarListoParaRetiro", customerId: customer.customerId, orderId: id });
    return resultado;
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/retirar")
  async retirar(
    @CurrentCustomer() customer: { customerId: number },
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: RetirarPedidoDto,
  ) {
    const resultado = await this.pedido.retirarConCodigo(id, dto.pickupCode);
    await this.auditoria.registrar({ action: "pedido.retirar", customerId: customer.customerId, orderId: id });
    return resultado;
  }
}
