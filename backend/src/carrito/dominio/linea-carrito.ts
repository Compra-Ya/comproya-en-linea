import { CartItem, Product } from "@prisma/client";

type FilaLineaCarrito = CartItem & { product: Pick<Product, "digitalPrice"> };

// Clase de diseño LineaCarrito (Plan_Pruebas_ComproYa.docx, Caso de Uso 2).
// Vista tipada sobre el modelo Prisma `CartItem` — no se persiste aparte.
export class LineaCarrito {
  constructor(
    public readonly productId: number,
    public readonly quantity: number,
    public readonly unitPrice: number,
  ) {}

  subtotal(): number {
    return this.unitPrice * this.quantity;
  }

  static desde(item: FilaLineaCarrito): LineaCarrito {
    return new LineaCarrito(item.productId, item.quantity, Number(item.product.digitalPrice));
  }
}
