import { Controller, Get, Query } from "@nestjs/common";
import { StaffRole } from "@prisma/client";
import { AccesoInterno } from "../auth/acceso-interno";
import { ConsultarVentasDto } from "./dto/consultar-ventas.dto";
import { VentasService } from "./ventas.service";

// REQ-016 y REQ-017: la lista de ventas es solo para la cuenta interna del Coordinador de Canal Digital.
@Controller("ventas")
export class VentasController {
  constructor(private readonly ventas: VentasService) {}

  @AccesoInterno(StaffRole.CHANNEL_COORDINATOR)
  @Get()
  consultar(@Query() filtros: ConsultarVentasDto) {
    return this.ventas.consultar(filtros);
  }
}
