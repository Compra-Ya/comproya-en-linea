import { Injectable } from "@nestjs/common";
import { CatalogoService } from "../catalogo.service";

// Clase de control VerificadorDeDisponibilidad (Plan_Pruebas_ComproYa.docx,
// PR-05/PR-06). Envuelve CatalogoService, que a su vez delega en
// AdaptadorErpSimulado (RN-03, RN-04) — no duplica el cálculo.
@Injectable()
export class VerificadorDeDisponibilidad {
  constructor(private readonly catalogo: CatalogoService) {}

  // PR-06: unidades disponibles (RN-03) suficientes para la cantidad pedida.
  async verificar(productId: number, branchId: number, quantity: number): Promise<boolean> {
    const disponibilidad = await this.catalogo.disponibilidadPorSucursal(productId, branchId);
    return disponibilidad.unidadesDisponibles >= quantity;
  }

  // PR-05: RN-04 — sucursal sin sincronizar hace más de 15 minutos no ofrece
  // retiro; el resto del flujo (otras sucursales, el carrito) sigue igual.
  async validarSincronizacion(productId: number, branchId: number): Promise<boolean> {
    const disponibilidad = await this.catalogo.disponibilidadPorSucursal(productId, branchId);
    return disponibilidad.puedeRetirar;
  }
}
