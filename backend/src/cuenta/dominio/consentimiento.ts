import { Consent, ConsentStatus } from "@prisma/client";
import { POLITICA_DATOS_VIGENTE } from "./politica-datos";

// Clase de diseño Consentimiento (Plan_Pruebas_ComproYa.docx, sección 9.2,
// PE-01 a PE-05). Máquina de estados: Pendiente -> Activo/Revocado ->
// Suprimido (terminal). Vista tipada sobre el modelo Prisma `Consent`.
export class Consentimiento {
  private constructor(
    public readonly id: number,
    public readonly customerId: number,
    public readonly status: ConsentStatus,
    public readonly loyaltyId: string | null,
    public readonly politicaDatosVersion: string = POLITICA_DATOS_VIGENTE.version,
  ) {}

  static desde(c: Consent, loyaltyId: string | null = null): Consentimiento {
    return new Consentimiento(c.id, c.customerId, c.status, loyaltyId);
  }

  // PE-05: desde el estado terminal Suprimido ninguna transición está
  // declarada — cualquier otro estado sí admite pasar a Suprimido (RN-11).
  puedeTransicionarA(nuevo: ConsentStatus): boolean {
    if (this.status === ConsentStatus.SUPRIMIDO) return false;
    return true;
  }
}
