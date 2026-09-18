import { Customer } from "@prisma/client";

type FilaCliente = Pick<Customer, "id" | "document" | "name" | "email" | "loyaltyId">;

// Clase de diseño Cliente (Plan_Pruebas_ComproYa.docx, Caso de Uso 1).
// Vista tipada sobre el modelo Prisma `Customer` — no se persiste aparte.
export class Cliente {
  private constructor(
    public readonly id: number,
    public readonly document: string,
    public readonly name: string,
    public readonly email: string,
    public readonly loyaltyId: string | null,
  ) {}

  static desde(c: FilaCliente): Cliente {
    return new Cliente(c.id, c.document, c.name, c.email, c.loyaltyId);
  }
}
