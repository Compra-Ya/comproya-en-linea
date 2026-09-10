import { IsBoolean } from "class-validator";

// CU-16 Pago con débito bancario. En la realidad este dato lo envía la
// pasarela de pagos como "notificación de débito bancario" (canon, sección
// 3); aquí se simula con un endpoint propio — ver AdaptadorDebitoSimulado.
export class NotificarDebitoDto {
  @IsBoolean()
  exitoso!: boolean;
}
