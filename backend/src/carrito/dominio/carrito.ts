import { Cart, CartItem, Product } from "@prisma/client";
import { LineaCarrito } from "./linea-carrito";

type FilaCarrito = Cart & { items: (CartItem & { product: Pick<Product, "digitalPrice"> })[] };

// Clase de diseño Carrito (Plan_Pruebas_ComproYa.docx, Caso de Uso 2).
// Vista tipada sobre el modelo Prisma `Cart` — no se persiste aparte.
export class Carrito {
  constructor(
    public readonly id: number,
    public readonly customerId: number | null,
    public readonly lineas: LineaCarrito[],
  ) {}

  total(): number {
    return this.lineas.reduce((acc, linea) => acc + linea.subtotal(), 0);
  }

  estaVacio(): boolean {
    return this.lineas.length === 0;
  }

  static desde(cart: FilaCarrito): Carrito {
    return new Carrito(cart.id, cart.customerId, cart.items.map(LineaCarrito.desde));
  }
}
