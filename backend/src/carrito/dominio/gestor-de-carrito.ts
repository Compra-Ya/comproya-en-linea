import { Injectable } from "@nestjs/common";
import { CarritoService } from "../carrito.service";
import { AgregarItemDto } from "../dto/agregar-item.dto";
import { ActualizarItemDto } from "../dto/actualizar-item.dto";
import { Carrito } from "./carrito";

// Clase de control GestorDeCarrito (Plan_Pruebas_ComproYa.docx, Caso de Uso
// 2). Envuelve CarritoService sin duplicar su lógica (C-04: persistente y
// fusionable).
@Injectable()
export class GestorDeCarrito {
  constructor(private readonly carritoService: CarritoService) {}

  async obtenerCarrito(customerId: number | null, guestToken: string | null): Promise<Carrito> {
    const cart = await this.carritoService.obtenerOCrear(customerId, guestToken);
    return Carrito.desde(cart);
  }

  async agregarItem(customerId: number | null, guestToken: string | null, dto: AgregarItemDto): Promise<Carrito> {
    const cart = await this.carritoService.agregarItem(customerId, guestToken, dto);
    return Carrito.desde(cart);
  }

  async actualizarItem(cartId: number, productId: number, dto: ActualizarItemDto): Promise<Carrito> {
    const cart = await this.carritoService.actualizarItem(cartId, productId, dto);
    return Carrito.desde(cart);
  }

  async quitarItem(cartId: number, productId: number): Promise<Carrito> {
    const cart = await this.carritoService.quitarItem(cartId, productId);
    return Carrito.desde(cart);
  }
}
