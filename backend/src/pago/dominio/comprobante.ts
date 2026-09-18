import { Branch, OrderItem, Product } from "@prisma/client";

type ItemComprobante = OrderItem & { product: Product };

interface DatosComprobante {
  idPedido: number;
  correlationId: string;
  pickupCode: string;
  pickupCodeExpiresAt: Date;
  branch: Branch;
  items: ItemComprobante[];
  pagadoEl: Date | null | undefined;
}

// Clase de diseño Comprobante (Plan_Pruebas_ComproYa.docx, PR-08, CU-09-01).
// No tiene tabla propia (CU-17 no persiste un comprobante aparte): envuelve
// el mismo objeto que ya arma PagoService.obtenerComprobante().
export class Comprobante {
  private constructor(
    public readonly idPedido: number,
    public readonly correlationId: string,
    public readonly pickupCode: string,
    public readonly pickupCodeExpiresAt: Date,
    public readonly branch: Branch,
    public readonly items: ItemComprobante[],
    public readonly pagadoEl: Date | null,
  ) {}

  static desde(data: DatosComprobante): Comprobante {
    return new Comprobante(
      data.idPedido,
      data.correlationId,
      data.pickupCode,
      data.pickupCodeExpiresAt,
      data.branch,
      data.items,
      data.pagadoEl ?? null,
    );
  }

  // RN-08: código de retiro de un solo uso, vence a los 5 días calendario.
  vigente(ahora: Date = new Date()): boolean {
    return ahora.getTime() <= this.pickupCodeExpiresAt.getTime();
  }
}
