import { Product } from "@prisma/client";

type FilaProducto = Pick<Product, "id" | "homologatedCode" | "name" | "digitalPrice" | "cost" | "published">;

// Clase de diseño Producto (Plan_Pruebas_ComproYa.docx, Caso de Uso 2).
// Vista tipada sobre el modelo Prisma `Product` — no se persiste aparte.
export class Producto {
  private constructor(
    public readonly id: number,
    public readonly homologatedCode: string,
    public readonly name: string,
    public readonly digitalPrice: number,
    public readonly cost: number,
    public readonly published: boolean,
  ) {}

  static desde(p: FilaProducto): Producto {
    return new Producto(p.id, p.homologatedCode, p.name, Number(p.digitalPrice), Number(p.cost), p.published);
  }
}
