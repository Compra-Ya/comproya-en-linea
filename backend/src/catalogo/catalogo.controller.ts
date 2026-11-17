import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from "@nestjs/common";
import { StaffRole } from "@prisma/client";
import { AccesoInterno, StaffActual } from "../auth/acceso-interno";
import { StaffAutenticado } from "../auth/jwt-staff.strategy";
import { AuditoriaService } from "../auditoria/auditoria.service";
import { CatalogoService } from "./catalogo.service";
import { PublicarProductoDto } from "./dto/publicar-producto.dto";

// La consulta del catálogo es pública (Cliente digital, invitado incluido). Las operaciones internas (publicar un
// producto, sincronizar) exigen la sesión de la cuenta interna del Coordinador de Canal Digital (REQ-017); el sprint 1
// las dejó sin autenticación por la decisión D-01 del canon, que ya no aplica.
@Controller("catalogo")
export class CatalogoController {
  constructor(
    private readonly catalogo: CatalogoService,
    private readonly auditoria: AuditoriaService,
  ) {}

  // CU-01: crea y publica un producto. Queda auditado quién lo hizo.
  @AccesoInterno(StaffRole.CHANNEL_COORDINATOR)
  @Post("productos")
  async publicarProducto(@StaffActual() staff: StaffAutenticado, @Body() dto: PublicarProductoDto) {
    const producto = await this.catalogo.publicarProducto(dto);
    await this.auditoria.registrar({ action: `producto.publicar:${producto.homologatedCode}`, actor: `coordinador:${staff.staffId}` });
    return producto;
  }

  @Get("productos")
  buscarProductos(@Query("q") q?: string, @Query("page") page?: string, @Query("categoryId") categoryId?: string) {
    const pageNumber = page ? Number(page) : 1;
    const categoryIdNumber = categoryId ? Number(categoryId) : undefined;
    if (!q) {
      return this.catalogo.listarPublicados(pageNumber, 20, categoryIdNumber);
    }
    return this.catalogo.buscarProductos(q, pageNumber, 20, categoryIdNumber);
  }

  @Get("productos/:id")
  obtenerProducto(@Param("id", ParseIntPipe) id: number) {
    return this.catalogo.obtenerProducto(id);
  }

  @Get("categorias")
  listarCategorias() {
    return this.catalogo.listarCategorias();
  }

  @Get("sucursales")
  listarSucursales() {
    return this.catalogo.listarSucursales();
  }

  // Endpoint interno: en producción lo dispara Cloud Scheduler cada ≤ 5 min
  // (docs/arquitectura.md sección 8) imitando el proceso por lotes del ERP.
  @AccesoInterno(StaffRole.CHANNEL_COORDINATOR)
  @Post("sucursales/:id/sincronizar")
  sincronizar(@Param("id", ParseIntPipe) id: number) {
    return this.catalogo.sincronizarSucursal(id);
  }

  @Get("productos/:id/disponibilidad")
  disponibilidad(@Param("id", ParseIntPipe) id: number, @Query("sucursalId") sucursalId?: string) {
    if (sucursalId) {
      return this.catalogo.disponibilidadPorSucursal(id, Number(sucursalId));
    }
    return this.catalogo.disponibilidadPorProducto(id);
  }
}
