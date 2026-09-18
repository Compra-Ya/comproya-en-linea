import { Order, OrderItem, OrderStatus } from "@prisma/client";
import { LineaPedido } from "./linea-pedido";

type FilaPedido = Order & { items: OrderItem[] };

// Clase de diseño Pedido (Plan_Pruebas_ComproYa.docx, sección 9.2, PE-06 a
// PE-10). Vista tipada sobre el modelo Prisma `Order` — la máquina de
// estados real vive en PedidoService (cancelar/iniciarAlistamiento/
// marcarListoParaRetiro/retirarConCodigo); esta clase expone las reglas de
// negocio derivadas del estado (RN-08, RN-09) para lectura.
export class Pedido {
  constructor(
    public readonly id: number,
    public readonly status: OrderStatus,
    public readonly pickupCode: string,
    public readonly pickupCodeExpiresAt: Date,
    public readonly lineas: LineaPedido[],
  ) {}

  total(): number {
    return this.lineas.reduce((acc, linea) => acc + linea.subtotal(), 0);
  }

  // RN-09: un pedido solo puede cancelarse mientras no haya iniciado su
  // alistamiento en sucursal.
  puedeCancelarse(): boolean {
    return this.status === OrderStatus.CREATED || this.status === OrderStatus.PAID;
  }

  // RN-08: el código de retiro vence a los 5 días calendario.
  codigoVigente(ahora: Date = new Date()): boolean {
    return ahora.getTime() <= this.pickupCodeExpiresAt.getTime();
  }

  static desde(order: FilaPedido): Pedido {
    return new Pedido(order.id, order.status, order.pickupCode, order.pickupCodeExpiresAt, order.items.map(LineaPedido.desde));
  }
}
