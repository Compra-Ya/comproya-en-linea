import { randomUUID } from "crypto";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { OrderStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CatalogoService } from "../catalogo/catalogo.service";
import { CarritoService } from "../carrito/carrito.service";
import { ConfirmarPedidoDto } from "./dto/confirmar-pedido.dto";

// Módulo pedido: SP-04 (cierre de la transacción de venta) — sprint 4.
// RN-05: ninguna unidad se cobra sin reserva previa en el ERP.
const CINCO_DIAS_MS = 5 * 24 * 60 * 60 * 1000;
const HORA_COMPROMISO_MS = 2 * 60 * 60 * 1000; // Placeholder documentado — ver resumen final.

@Injectable()
export class PedidoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogo: CatalogoService,
    private readonly carrito: CarritoService,
  ) {}

  // CU-09 Confirmación del pedido + CU-10 Aplicación de cupón de lealtad.
  async confirmar(customerId: number, dto: ConfirmarPedidoDto) {
    const cart = await this.carrito.obtenerOCrear(customerId, null);
    if (cart.items.length === 0) {
      throw new BadRequestException("El carrito está vacío, no hay nada que confirmar");
    }

    // RN-05: se reserva ANTES de que exista la posibilidad de cobrar. Como
    // `AdaptadorErpSimulado.reservarUnidades` no admite una transacción SQL
    // compartida con la creación del pedido (el puerto vive en otro módulo,
    // sección 3 de arquitectura.md), se reserva línea por línea y, si una
    // falla, se liberan las que sí se alcanzaron a reservar (compensación).
    const reservas: { availabilityId: number; quantity: number }[] = [];
    try {
      for (const item of cart.items) {
        const availabilityId = await this.catalogo.reservarUnidades(
          item.productId,
          dto.branchId,
          item.quantity,
        );
        reservas.push({ availabilityId, quantity: item.quantity });
      }
    } catch (error) {
      for (const reserva of reservas) {
        await this.catalogo.liberarReserva(reserva.availabilityId, reserva.quantity);
      }
      throw error;
    }

    let cupon: { id: number; percentage: unknown } | null = null;
    if (dto.couponCode) {
      cupon = await this.prisma.loyaltyCoupon.findUnique({ where: { code: dto.couponCode } });
      if (!cupon || !(cupon as any).active) {
        for (const reserva of reservas) {
          await this.catalogo.liberarReserva(reserva.availabilityId, reserva.quantity);
        }
        throw new BadRequestException("El cupón de lealtad no existe o no está vigente");
      }
    }

    const now = new Date();
    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          customerId,
          branchId: dto.branchId,
          status: OrderStatus.CREATED,
          committedAt: new Date(now.getTime() + HORA_COMPROMISO_MS),
          pickupCode: this.generarCodigoRetiro(),
          pickupCodeExpiresAt: new Date(now.getTime() + CINCO_DIAS_MS),
          correlationId: randomUUID(),
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.product.digitalPrice,
            })),
          },
          statusHistory: { create: { status: OrderStatus.CREATED } },
        },
        include: { items: true },
      });

      for (let i = 0; i < cart.items.length; i++) {
        await tx.unitsReservation.create({
          data: {
            orderId: created.id,
            availabilityId: reservas[i].availabilityId,
            quantity: reservas[i].quantity,
          },
        });
      }

      // RN-07: una sola redención por pedido, aunque el cliente reintente la
      // confirmación — reforzado por `@unique` en `orderId` además de por el
      // carrito ya vaciado más abajo (no queda nada que reconfirmar).
      if (cupon) {
        await tx.couponRedemption.create({ data: { couponId: cupon.id, orderId: created.id } });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return created;
    });

    return this.obtener(order.id);
  }

  private generarCodigoRetiro(): string {
    return `RET-${randomUUID().slice(0, 8).toUpperCase()}`;
  }

  async obtener(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        payment: true,
        couponRedemption: { include: { coupon: true } },
        branch: true,
      },
    });
    if (!order) throw new NotFoundException("Pedido no encontrado");
    return order;
  }

  async listarPorCliente(customerId: number) {
    return this.prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      include: { items: true, payment: true },
    });
  }

  // Total a cobrar (unitPrice ya congelado en el pedido) menos el cupón
  // redimido, si aplica. Lo usa el módulo pago para crear la sesión de Stripe.
  async calcularTotal(orderId: number): Promise<number> {
    const order = await this.obtener(orderId);
    const subtotal = order.items.reduce(
      (acc, item) => acc + Number(item.unitPrice) * item.quantity,
      0,
    );
    if (order.couponRedemption) {
      const descuento = Number(order.couponRedemption.coupon.percentage) / 100;
      return Math.round(subtotal * (1 - descuento) * 100) / 100;
    }
    return subtotal;
  }

  // RN-09: un pedido solo puede cancelarse mientras no haya iniciado su
  // alistamiento en sucursal. Alcance mínimo de "operación" (sprint 6, ver
  // Resultados_Pruebas_ComproYa.md): estos cuatro métodos solo mueven la
  // máquina de estados de Pedido — no hay pantallas ni rol de Gerente de
  // Tienda completos, eso sigue siendo CU-11 a CU-14.
  async cancelar(orderId: number) {
    const order = await this.obtener(orderId);
    if (order.status !== OrderStatus.CREATED && order.status !== OrderStatus.PAID) {
      throw new BadRequestException("El pedido ya inició alistamiento y no admite cancelación (RN-09)");
    }
    await this.marcarEstado(orderId, OrderStatus.CANCELLED);
    await this.liberarReservasDelPedido(orderId);
    return this.obtener(orderId);
  }

  async iniciarAlistamiento(orderId: number) {
    const order = await this.obtener(orderId);
    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException("Solo un pedido pagado puede iniciar alistamiento");
    }
    await this.marcarEstado(orderId, OrderStatus.PREPARING);
    return this.obtener(orderId);
  }

  async marcarListoParaRetiro(orderId: number) {
    const order = await this.obtener(orderId);
    if (order.status !== OrderStatus.PREPARING) {
      throw new BadRequestException("Solo un pedido en alistamiento puede quedar listo para retiro");
    }
    await this.marcarEstado(orderId, OrderStatus.READY_FOR_PICKUP);
    return this.obtener(orderId);
  }

  // RN-08: el código de retiro es de un solo uso y vence a los 5 días
  // calendario — ambas condiciones se verifican aquí, no solo la fecha.
  async retirarConCodigo(orderId: number, pickupCode: string, ahora: Date = new Date()) {
    const order = await this.obtener(orderId);
    if (order.status !== OrderStatus.READY_FOR_PICKUP) {
      throw new BadRequestException("El pedido no está listo para retiro");
    }
    if (order.pickupCode !== pickupCode) {
      throw new BadRequestException("El código de retiro no coincide con el del pedido");
    }
    if (ahora.getTime() > order.pickupCodeExpiresAt.getTime()) {
      throw new BadRequestException("El código de retiro venció (RN-08: vigente 5 días calendario)");
    }
    await this.marcarEstado(orderId, OrderStatus.DELIVERED);
    return this.obtener(orderId);
  }

  async marcarEstado(orderId: number, status: OrderStatus) {
    return this.prisma.$transaction([
      this.prisma.order.update({ where: { id: orderId }, data: { status } }),
      this.prisma.orderStatusHistory.create({ data: { orderId, status } }),
    ]);
  }

  // Usado por el módulo pago cuando el webhook de Stripe (o la simulación de
  // débito bancario) informa que la reserva debe liberarse: pago rechazado,
  // sesión expirada, o vencimiento del plazo de confirmación (RN-05 en
  // reversa — si al final no se cobra, la reserva no puede quedar viva).
  async liberarReservasDelPedido(orderId: number) {
    const reservas = await this.prisma.unitsReservation.findMany({
      where: { orderId, releasedAt: null },
    });
    for (const reserva of reservas) {
      // Nunca se toca `Availability` directamente aquí — solo a través del
      // servicio de aplicación de catalogo (docs/arquitectura.md sección 3).
      await this.catalogo.liberarReserva(reserva.availabilityId, reserva.quantity);
      await this.prisma.unitsReservation.update({ where: { id: reserva.id }, data: { releasedAt: new Date() } });
    }
  }
}
