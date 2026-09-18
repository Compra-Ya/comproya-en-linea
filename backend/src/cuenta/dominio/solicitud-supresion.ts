import { DeletionRequest } from "@prisma/client";

const SETENTA_Y_DOS_HORAS_MS = 72 * 60 * 60 * 1000;

// Clase de diseño SolicitudSupresion (Plan_Pruebas_ComproYa.docx, Caso de Uso
// 1; RN-11: "Una solicitud de supresión de datos personales debe ejecutarse
// dentro de las 72 horas siguientes"). Vista tipada sobre `DeletionRequest`.
export class SolicitudSupresion {
  private constructor(
    public readonly id: number,
    public readonly customerId: number,
    public readonly requestedAt: Date,
    public readonly fulfilledAt: Date | null,
  ) {}

  static desde(d: DeletionRequest): SolicitudSupresion {
    return new SolicitudSupresion(d.id, d.customerId, d.requestedAt, d.fulfilledAt);
  }

  // RN-11: la solicitud debe ejecutarse dentro de las 72 horas siguientes a
  // `requestedAt`. Si ya fue atendida (`fulfilledAt` no nulo), se evalúa si
  // se cumplió el plazo; si sigue pendiente, si todavía está dentro de él.
  estaDentroDePlazo(ahora: Date = new Date()): boolean {
    const referencia = this.fulfilledAt ?? ahora;
    return referencia.getTime() - this.requestedAt.getTime() <= SETENTA_Y_DOS_HORAS_MS;
  }
}
