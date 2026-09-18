import { PaymentStatus } from "@prisma/client";
import { PagoService } from "../pago.service";
import { Pago } from "./pago";

// Clase de diseño PagoConTarjeta (Plan_Pruebas_ComproYa.docx, PR-07/PR-08).
// Envuelve PagoService.crearSesionTarjeta() — CU-15, RN-06 (solo token).
export class PagoConTarjeta extends Pago {
  constructor(
    orderId: number,
    status: PaymentStatus,
    private readonly pagoService?: PagoService,
  ) {
    super(orderId, status);
  }

  async procesar(customerId: number): Promise<{ redirectUrl: string }> {
    if (!this.pagoService) {
      throw new Error("PagoConTarjeta necesita PagoService para procesar un cobro");
    }
    return this.pagoService.crearSesionTarjeta(customerId, this.orderId);
  }
}
