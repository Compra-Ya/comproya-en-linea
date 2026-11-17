import { Body, Controller, ForbiddenException, Get, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";
import { StaffRole } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AccesoInterno, StaffActual } from "../auth/acceso-interno";
import { StaffAutenticado } from "../auth/jwt-staff.strategy";
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
  // sección son operación de sucursal, no del cliente dueño: exigen la
  // sesión de la cuenta interna (antes bastaba cualquier cliente con sesión).
  // El despacho en sucursal está fuera del alcance (docs/alcance), así que esto
  // solo cierra el acceso; no agrega funciones.
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

  @AccesoInterno(StaffRole.CHANNEL_COORDINATOR)
  @Post(":id/iniciar-alistamiento")
  async iniciarAlistamiento(@StaffActual() staff: StaffAutenticado, @Param("id", ParseIntPipe) id: number) {
    const resultado = await this.pedido.iniciarAlistamiento(id);
    await this.auditoria.registrar({ action: "pedido.iniciarAlistamiento", actor: `coordinador:${staff.staffId}`, orderId: id });
    return resultado;
  }

  @AccesoInterno(StaffRole.CHANNEL_COORDINATOR)
  @Post(":id/listo-para-retiro")
  async marcarListoParaRetiro(@StaffActual() staff: StaffAutenticado, @Param("id", ParseIntPipe) id: number) {
    const resultado = await this.pedido.marcarListoParaRetiro(id);
    await this.auditoria.registrar({ action: "pedido.marcarListoParaRetiro", actor: `coordinador:${staff.staffId}`, orderId: id });
    return resultado;
  }

  @AccesoInterno(StaffRole.CHANNEL_COORDINATOR)
  @Post(":id/retirar")
  async retirar(
    @StaffActual() staff: StaffAutenticado,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: RetirarPedidoDto,
  ) {
    const resultado = await this.pedido.retirarConCodigo(id, dto.pickupCode);
    await this.auditoria.registrar({ action: "pedido.retirar", actor: `coordinador:${staff.staffId}`, orderId: id });
    return resultado;
  }
}
