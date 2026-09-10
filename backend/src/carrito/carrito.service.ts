import { randomUUID } from "crypto";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CatalogoService } from "../catalogo/catalogo.service";
import { AgregarItemDto } from "./dto/agregar-item.dto";
import { ActualizarItemDto } from "./dto/actualizar-item.dto";

// Módulo carrito: SP-03 (sostenimiento de la intención de compra) — sprint 3.
// C-04: carrito persistente y fusionable entre invitado y registrado.
@Injectable()
export class CarritoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogo: CatalogoService,
  ) {}

  private incluirItems() {
    return { items: { include: { product: true }, orderBy: { id: "asc" as const } } };
  }

  // Resuelve el carrito vigente del cliente autenticado o del invitado
  // identificado por `guestToken`; lo crea si no existe (C-04).
  async obtenerOCrear(customerId: number | null, guestToken: string | null) {
    if (customerId) {
      const existente = await this.prisma.cart.findFirst({
        where: { customerId },
        include: this.incluirItems(),
      });
      if (existente) return existente;
      return this.prisma.cart.create({ data: { customerId }, include: this.incluirItems() });
    }

    if (guestToken) {
      const existente = await this.prisma.cart.findUnique({
        where: { guestToken },
        include: this.incluirItems(),
      });
      if (existente) return existente;
    }
    return this.prisma.cart.create({
      data: { guestToken: guestToken ?? randomUUID() },
      include: this.incluirItems(),
    });
  }

  async agregarItem(customerId: number | null, guestToken: string | null, dto: AgregarItemDto) {
    const producto = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!producto || !producto.published) {
      throw new NotFoundException("El producto no existe o no está publicado en el canal");
    }
    const cart = await this.obtenerOCrear(customerId, guestToken);

    await this.prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId: dto.productId } },
      update: { quantity: { increment: dto.quantity } },
      create: { cartId: cart.id, productId: dto.productId, quantity: dto.quantity },
    });
    return this.obtenerPorId(cart.id);
  }

  async actualizarItem(cartId: number, productId: number, dto: ActualizarItemDto) {
    if (dto.quantity === 0) {
      await this.prisma.cartItem.deleteMany({ where: { cartId, productId } });
    } else {
      await this.prisma.cartItem.update({
        where: { cartId_productId: { cartId, productId } },
        data: { quantity: dto.quantity },
      });
    }
    return this.obtenerPorId(cartId);
  }

  async quitarItem(cartId: number, productId: number) {
    await this.prisma.cartItem.deleteMany({ where: { cartId, productId } });
    return this.obtenerPorId(cartId);
  }

  async obtenerPorId(cartId: number) {
    const cart = await this.prisma.cart.findUnique({ where: { id: cartId }, include: this.incluirItems() });
    if (!cart) throw new NotFoundException("Carrito no encontrado");
    return cart;
  }

  // Fusión del carrito de invitado al iniciar sesión (C-04). Suma cantidades
  // cuando el mismo producto está en ambos carritos.
  async fusionar(customerId: number, guestToken: string) {
    const guestCart = await this.prisma.cart.findUnique({
      where: { guestToken },
      include: { items: true },
    });
    if (!guestCart) return this.obtenerOCrear(customerId, null);

    const customerCart = await this.obtenerOCrear(customerId, null);
    await this.prisma.$transaction(async (tx) => {
      for (const item of guestCart.items) {
        await tx.cartItem.upsert({
          where: { cartId_productId: { cartId: customerCart.id, productId: item.productId } },
          update: { quantity: { increment: item.quantity } },
          create: { cartId: customerCart.id, productId: item.productId, quantity: item.quantity },
        });
      }
      await tx.cartItem.deleteMany({ where: { cartId: guestCart.id } });
      await tx.cart.delete({ where: { id: guestCart.id } });
    });
    return this.obtenerPorId(customerCart.id);
  }

  // CU-08 Consulta de productos complementarios — hasta 4 (tope del canon, C-05).
  async complementarios(productId: number) {
    return this.prisma.complementaryProduct.findMany({
      where: { productId },
      include: { suggestedProduct: true },
      orderBy: { position: "asc" },
      take: 4,
    });
  }
}
