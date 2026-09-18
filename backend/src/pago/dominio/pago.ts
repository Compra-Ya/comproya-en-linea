import { PaymentStatus } from "@prisma/client";

// Clase de diseño Pago (abstracta) (Plan_Pruebas_ComproYa.docx, Caso de Uso
// 2), especializada en PagoConTarjeta y PagoConDebitoBancario. Vista tipada
// sobre el modelo Prisma `Payment` — no se persiste aparte.
export abstract class Pago {
  protected constructor(
    public readonly orderId: number,
    public readonly status: PaymentStatus,
  ) {}
}
