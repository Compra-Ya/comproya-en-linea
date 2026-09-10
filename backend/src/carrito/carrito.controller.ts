import { Body, Controller, Delete, Get, Headers, Param, ParseIntPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { OptionalJwtAuthGuard } from "../auth/optional-jwt-auth.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentCustomer } from "../auth/current-customer.decorator";
import { CarritoService } from "./carrito.service";
import { AgregarItemDto } from "./dto/agregar-item.dto";
import { ActualizarItemDto } from "./dto/actualizar-item.dto";

// CU-07 Administración del carrito. Admite invitados (C-04): sin sesión, el
// carrito se identifica por el encabezado `X-Cart-Token` que el frontend
// genera y conserva entre visitas.
@UseGuards(OptionalJwtAuthGuard)
@Controller("carrito")
export class CarritoController {
  constructor(private readonly carrito: CarritoService) {}

  @Get()
  obtener(
    @CurrentCustomer() customer: { customerId: number } | null,
    @Headers("x-cart-token") cartToken?: string,
  ) {
    return this.carrito.obtenerOCrear(customer?.customerId ?? null, cartToken ?? null);
  }

  @Post("items")
  agregar(
    @CurrentCustomer() customer: { customerId: number } | null,
    @Headers("x-cart-token") cartToken?: string,
    @Body() dto: AgregarItemDto = {} as AgregarItemDto,
  ) {
    return this.carrito.agregarItem(customer?.customerId ?? null, cartToken ?? null, dto);
  }

  @Patch(":cartId/items/:productId")
  actualizar(
    @Param("cartId", ParseIntPipe) cartId: number,
    @Param("productId", ParseIntPipe) productId: number,
    @Body() dto: ActualizarItemDto,
  ) {
    return this.carrito.actualizarItem(cartId, productId, dto);
  }

  @Delete(":cartId/items/:productId")
  quitar(@Param("cartId", ParseIntPipe) cartId: number, @Param("productId", ParseIntPipe) productId: number) {
    return this.carrito.quitarItem(cartId, productId);
  }

  @Get("complementarios/:productId")
  complementarios(@Param("productId", ParseIntPipe) productId: number) {
    return this.carrito.complementarios(productId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("fusionar")
  fusionar(
    @CurrentCustomer() customer: { customerId: number },
    @Headers("x-cart-token") cartToken: string,
  ) {
    return this.carrito.fusionar(customer.customerId, cartToken);
  }
}
