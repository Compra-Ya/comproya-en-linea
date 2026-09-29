import { Body, Controller, Delete, ForbiddenException, Get, Headers, Param, ParseIntPipe, Patch, Post, UseGuards } from "@nestjs/common";
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

  // Corrección: el carrito de invitado sin sesión sigue siendo válido (C-04)
  // — lo que faltaba era comparar el cartId de la URL contra la identidad de
  // quien llama, para que no cualquiera que tenga o adivine un cartId ajeno
  // pueda modificarlo o vaciarlo.
  @Patch(":cartId/items/:productId")
  async actualizar(
    @CurrentCustomer() customer: { customerId: number } | null,
    @Param("cartId", ParseIntPipe) cartId: number,
    @Param("productId", ParseIntPipe) productId: number,
    @Body() dto: ActualizarItemDto,
    @Headers("x-cart-token") cartToken?: string,
  ) {
    const esPropio = await this.carrito.perteneceA(cartId, customer?.customerId ?? null, cartToken ?? null);
    if (!esPropio) {
      throw new ForbiddenException("Este carrito no corresponde a quien hace la solicitud");
    }
    return this.carrito.actualizarItem(cartId, productId, dto);
  }

  @Delete(":cartId/items/:productId")
  async quitar(
    @CurrentCustomer() customer: { customerId: number } | null,
    @Param("cartId", ParseIntPipe) cartId: number,
    @Param("productId", ParseIntPipe) productId: number,
    @Headers("x-cart-token") cartToken?: string,
  ) {
    const esPropio = await this.carrito.perteneceA(cartId, customer?.customerId ?? null, cartToken ?? null);
    if (!esPropio) {
      throw new ForbiddenException("Este carrito no corresponde a quien hace la solicitud");
    }
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
