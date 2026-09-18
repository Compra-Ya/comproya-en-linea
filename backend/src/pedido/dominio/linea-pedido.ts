import { OrderItem } from "@prisma/client";

// Clase de diseño LineaPedido (Plan_Pruebas_ComproYa.docx, Caso de Uso 2).
// Vista tipada sobre el modelo Prisma `OrderItem` — no se persiste aparte.
export class LineaPedido {
  constructor(
    public readonly productId: number,
    public readonly quantity: number,
    public readonly unitPrice: number,
  ) {}

  subtotal(): number {
    return this.unitPrice * this.quantity;
  }

  static desde(item: OrderItem): LineaPedido {
    return new LineaPedido(item.productId, item.quantity, Number(item.unitPrice));
  }
}
