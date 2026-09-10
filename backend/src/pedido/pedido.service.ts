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
