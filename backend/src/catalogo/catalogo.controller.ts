import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from "@nestjs/common";
import { CatalogoService } from "./catalogo.service";
import { PublicarProductoDto } from "./dto/publicar-producto.dto";

// Sprint 1 — sin autenticación (decisión D-01 del canon). El control de que
// solo el Coordinador de Canal Digital publique productos queda para cuando
// el módulo cuenta (sprint 2) agregue roles internos; por ahora el endpoint
// existe para que CU-01 sea ejercitable.
@Controller("catalogo")
export class CatalogoController {
  constructor(private readonly catalogo: CatalogoService) {}

  @Post("productos")
  publicarProducto(@Body() dto: PublicarProductoDto) {
    return this.catalogo.publicarProducto(dto);
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
