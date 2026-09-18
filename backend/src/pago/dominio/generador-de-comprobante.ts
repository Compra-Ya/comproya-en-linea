import { Injectable } from "@nestjs/common";
import { PagoService } from "../pago.service";
import { Comprobante } from "./comprobante";

// Clase de control GeneradorDeComprobante (Plan_Pruebas_ComproYa.docx,
// PR-08). Envuelve PagoService.obtenerComprobante() — CU-17.
@Injectable()
export class GeneradorDeComprobante {
  constructor(private readonly pagoService: PagoService) {}

  async generar(customerId: number, orderId: number): Promise<Comprobante> {
    const data = await this.pagoService.obtenerComprobante(customerId, orderId);
    return Comprobante.desde(data);
  }
}
