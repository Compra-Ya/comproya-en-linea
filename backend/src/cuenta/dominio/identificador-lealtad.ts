import { BadRequestException } from "@nestjs/common";
import { PuertoLealtad } from "../puertos/puerto-lealtad";

// Clase de diseño IdentificadorLealtad (Plan_Pruebas_ComproYa.docx, PR-03:
// "GestorDeConsentimiento.otorgarConsentimiento() + IdentificadorLealtad.vincular()").
// Vista sobre `Customer.loyaltyId` — no tiene tabla propia.
export class IdentificadorLealtad {
  private constructor(
    public readonly codigo: string,
    public readonly customerId: number,
  ) {}

  static async vincular(
    customerId: number,
    codigo: string,
    lealtad: PuertoLealtad,
  ): Promise<IdentificadorLealtad> {
    const encontrado = lealtad.resolverIdentificador(codigo);
    if (!encontrado) {
      throw new BadRequestException("El identificador de lealtad no fue encontrado en el programa de lealtad");
    }
    return new IdentificadorLealtad(codigo, customerId);
  }
}
