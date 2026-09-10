import { Injectable } from "@nestjs/common";
import { PuertoLealtad } from "./puerto-lealtad";

// Simula el programa de lealtad. Formato esperado: `LEALTAD-999999`. Para
// reproducir de forma determinística el 8-12% de registros sin
// correspondencia que documenta el canon (sección 10), los identificadores
// cuyo número termina en 0 se consideran "no encontrados" en el programa
// real (1 de cada 10 ≈ 10%, dentro del rango).
@Injectable()
export class AdaptadorLealtadSimulado implements PuertoLealtad {
  resolverIdentificador(loyaltyId: string): boolean {
    const match = /^LEALTAD-(\d{6})$/.exec(loyaltyId);
    if (!match) return false;
    return Number(match[1]) % 10 !== 0;
  }
}
