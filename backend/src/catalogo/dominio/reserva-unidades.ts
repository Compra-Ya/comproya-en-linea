import { BadRequestException, Injectable } from "@nestjs/common";
import { CatalogoService } from "../catalogo.service";

// Clase de diseño/control ReservaUnidades (Plan_Pruebas_ComproYa.docx,
// PR-06). Envuelve CatalogoService.reservarUnidades/liberarReserva, que ya
// implementan RN-03 (unidades disponibles) y RN-05 (reserva atómica antes de
// cobrar) contra AdaptadorErpSimulado. El contrato de esta clase es devolver
// `false` cuando la reserva no procede (en vez de relanzar la excepción),
// tal como lo pide la ruta de PR-06 ("reservar() devuelve falso").
@Injectable()
export class ReservaUnidades {
  constructor(private readonly catalogo: CatalogoService) {}

  async reservar(productId: number, branchId: number, quantity: number): Promise<false | number> {
    try {
      return await this.catalogo.reservarUnidades(productId, branchId, quantity);
    } catch (error) {
      if (error instanceof BadRequestException) return false;
      throw error;
    }
  }

  async liberar(availabilityId: number, quantity: number): Promise<void> {
    await this.catalogo.liberarReserva(availabilityId, quantity);
  }
}
