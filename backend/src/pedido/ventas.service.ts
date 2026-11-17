import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { calcularTotales } from "./dominio/totales";
import { ESTADOS_DE_VENTA, rangoDeFechas } from "./dominio/ventas";
import { ConsultarVentasDto } from "./dto/consultar-ventas.dto";

const TAMANO_DE_PAGINA = 20;

// REQ-016 Consulta de ventas del Coordinador de Canal Digital: una lista con fecha, cliente, productos, total y estado,
// filtrable por fecha y estado, con el total vendido del periodo. No es un tablero analítico (docs/alcance, exclusiones).
// La fecha de una venta es la del pedido. Los totales salen de la misma fórmula que el cobro (dominio/totales.ts).
@Injectable()
export class VentasService {
  constructor(private readonly prisma: PrismaService) {}

  async consultar(filtros: ConsultarVentasDto) {
    const page = filtros.page ?? 1;
    const rango = rangoDeFechas(filtros.desde, filtros.hasta);
    const where: Prisma.OrderWhereInput = {
      status: filtros.estado ?? { in: [...ESTADOS_DE_VENTA] },
      ...(rango.gte || rango.lte ? { createdAt: rango } : {}),
    };

    // El total vendido cubre todo el filtro, no solo la página que se muestra.
    const precios = await this.prisma.order.findMany({
      where,
      select: {
        items: { select: { unitPrice: true, quantity: true } },
        couponRedemption: { select: { coupon: { select: { code: true, percentage: true } } } },
      },
    });
    const totalVendido = precios.reduce((acc, p) => acc + calcularTotales(p).total, 0);

    const pedidos = await this.prisma.order.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * TAMANO_DE_PAGINA,
      take: TAMANO_DE_PAGINA,
      include: {
        customer: { select: { id: true, name: true } },
        items: { include: { product: { select: { name: true } } } },
        couponRedemption: { include: { coupon: true } },
      },
    });

    return {
      items: pedidos.map((p) => {
        const totales = calcularTotales(p);
        return {
          id: p.id,
          fecha: p.createdAt,
          estado: p.status,
          cliente: { id: p.customer.id, nombre: p.customer.name },
          productos: p.items.map((i) => ({ nombre: i.product.name, cantidad: i.quantity })),
          unidades: p.items.reduce((acc, i) => acc + i.quantity, 0),
          ...totales,
          // Datos para despachar fuera del sistema; en un pedido con retiro en sucursal no hay dirección.
          envio: p.shippingAddress
            ? { nombre: p.shippingName, telefono: p.shippingPhone, direccion: p.shippingAddress, ciudad: p.shippingCity, notas: p.shippingNotes }
            : null,
        };
      }),
      total: precios.length,
      page,
      pageSize: TAMANO_DE_PAGINA,
      totalVendido: Math.round(totalVendido * 100) / 100,
    };
  }
}
