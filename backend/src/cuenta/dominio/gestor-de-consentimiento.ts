import { Injectable } from "@nestjs/common";
import { CuentaService } from "../cuenta.service";
import { AdaptadorLealtadSimulado } from "../puertos/adaptador-lealtad-simulado";
import { Consentimiento } from "./consentimiento";
import { IdentificadorLealtad } from "./identificador-lealtad";
import { SolicitudSupresion } from "./solicitud-supresion";

// Clase de control GestorDeConsentimiento (Plan_Pruebas_ComproYa.docx,
// PR-02/PR-03/PR-04, PE-01 a PE-05, PI-03). Envuelve CuentaService: la
// máquina de estados de Consentimiento y la persistencia ya viven ahí
// (RN-10, RN-11); este control expone las operaciones de CU-05 con los
// nombres exactos del documento UML.
@Injectable()
export class GestorDeConsentimiento {
  constructor(
    private readonly cuentaService: CuentaService,
    private readonly lealtad: AdaptadorLealtadSimulado,
  ) {}

  // PR-03/PR-04: si trae identificador de lealtad, se vincula (IdentificadorLealtad.vincular)
  // antes de otorgar el consentimiento; si no trae, el consentimiento se
  // otorga igual sin crear ningún identificador.
  async otorgarConsentimiento(customerId: number, loyaltyId?: string): Promise<Consentimiento> {
    let identificador: IdentificadorLealtad | undefined;
    if (loyaltyId) {
      identificador = await IdentificadorLealtad.vincular(customerId, loyaltyId, this.lealtad);
    }
    const consent = await this.cuentaService.decidirConsentimiento(customerId, { activo: true, loyaltyId });
    return Consentimiento.desde(consent, identificador?.codigo ?? null);
  }

  async revocarConsentimiento(customerId: number): Promise<Consentimiento> {
    const consent = await this.cuentaService.decidirConsentimiento(customerId, { activo: false });
    return Consentimiento.desde(consent);
  }

  async consultarConsentimiento(customerId: number): Promise<Consentimiento | null> {
    const consent = await this.cuentaService.consultarConsentimiento(customerId);
    return consent ? Consentimiento.desde(consent) : null;
  }

  async solicitarSupresion(customerId: number): Promise<SolicitudSupresion> {
    const solicitud = await this.cuentaService.solicitarSupresion(customerId);
    return SolicitudSupresion.desde(solicitud);
  }

  // RN-11: ejecuta toda solicitud de supresión pendiente (llamado por
  // SupresionJob cada hora). Devuelve cuántas se procesaron.
  async ejecutarSupresionesPendientes(ahora?: Date): Promise<number> {
    return this.cuentaService.procesarSolicitudesPendientes(ahora);
  }
}
