import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AdaptadorErpSimulado } from "./puertos/adaptador-erp-simulado";
import { PublicarProductoDto } from "./dto/publicar-producto.dto";

// Módulo catalogo: sub-problemas SP-01 (gobierno del catálogo) y SP-02
// (disponibilidad) — docs/arquitectura.md sección 3. Sprint 1, sin
// autenticación (decisión D-01 del canon).
@Injectable()
export class CatalogoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly erp: AdaptadorErpSimulado,
  ) {}

  // CU-01 Publicación de producto en el catálogo.
  async publicarProducto(dto: PublicarProductoDto) {
    // RN-01: código homologado en el maestro (formato validado en el DTO) +
    // publicación explícita (el `published: true` de más abajo).
    if (!this.erp.esCodigoHomologado(dto.homologatedCode)) {
      throw new BadRequestException("El código homologado no existe en el maestro de códigos homologados");
    }
    // RN-02: el precio digital nunca es inferior al costo del ERP sin
    // aprobación de gerencia comercial.
    if (dto.digitalPrice < dto.cost && !dto.aprobacionGerencialComercial) {
      throw new BadRequestException(
        "El precio digital no puede ser inferior al costo registrado en el ERP sin aprobación de gerencia comercial",
      );
    }

    const category = await this.prisma.category.upsert({
      where: { name: dto.categoryName },
      update: {},
      create: { name: dto.categoryName },
    });

    return this.prisma.product.upsert({
      where: { homologatedCode: dto.homologatedCode },
      update: {
        name: dto.name,
        categoryId: category.id,
        brand: dto.brand,
        cost: dto.cost,
        digitalPrice: dto.digitalPrice,
        published: true,
      },
      create: {
        homologatedCode: dto.homologatedCode,
        name: dto.name,
        categoryId: category.id,
        brand: dto.brand,
        cost: dto.cost,
        digitalPrice: dto.digitalPrice,
        published: true,
      },
    });
  }

  // CU-02 Búsqueda de productos. Umbral del canon: P95 ≤ 1,5 s desde 3
  // caracteres, hasta 40.000 productos publicados (canon, sección 10). El
  // índice `pg_trgm` que sostiene ese umbral se agrega en la migración de
  // este módulo (docs/arquitectura.md sección 10); aquí solo se exige el
  // mínimo de caracteres para no lanzar búsquedas de 1-2 letras contra todo
  // el catálogo.
  async buscarProductos(query: string, page = 1, pageSize = 20, categoryId?: number) {
    if (query.trim().length < 3) {
      throw new BadRequestException("La búsqueda requiere al menos 3 caracteres");
    }
    const where = {
      published: true,
      name: { contains: query, mode: "insensitive" as const },
      ...(categoryId ? { categoryId } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      this.prisma.product.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async listarPublicados(page = 1, pageSize = 20, categoryId?: number) {
    const where = { published: true, ...(categoryId ? { categoryId } : {}) };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      this.prisma.product.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async obtenerProducto(id: number) {
    const producto = await this.prisma.product.findUnique({ where: { id }, include: { category: true } });
    if (!producto || !producto.published) {
      throw new NotFoundException("El producto no existe o no está publicado en el canal");
    }
    return producto;
  }

  // CU-03 Consulta de disponibilidad por sucursal.
  async disponibilidadPorSucursal(productId: number, branchId: number) {
    return this.erp.calcularDisponibilidad(productId, branchId);
  }

  async disponibilidadPorProducto(productId: number) {
    return this.erp.listarDisponibilidadPorProducto(productId);
  }

  // Para la grilla de categorías del catálogo (P-2) — cuenta real de
  // productos publicados por categoría, no una cifra decorativa.
  async listarCategorias() {
    const categorias = await this.prisma.category.findMany({
      include: { _count: { select: { products: { where: { published: true } } } } },
      orderBy: { name: "asc" },
    });
    return categorias
      .map((c) => ({ id: c.id, name: c.name, productCount: c._count.products }))
      .filter((c) => c.productCount > 0);
  }

  async listarSucursales() {
    return this.prisma.branch.findMany({ orderBy: { name: "asc" } });
  }

  // Puente hacia AdaptadorErpSimulado para otros módulos (pedido). Nunca se
  // expone el adaptador ni `Availability` directamente fuera de catalogo —
  // solo este servicio de aplicación (docs/arquitectura.md sección 3).
  async reservarUnidades(
    productId: number,
    branchId: number,
    quantity: number,
    opciones?: { exigirSincronizacion?: boolean },
  ) {
    return this.erp.reservarUnidades(productId, branchId, quantity, opciones);
  }

  // Venta con envío: elige la sucursal que despacha. Es la que tiene unidades disponibles (RN-03)
  // para TODAS las líneas del carrito y, entre ellas, la de más unidades. No exige sincronización
  // de retiro (RN-04 aplica al retiro, no al despacho). Si ninguna alcanza, falla con el mismo
  // mensaje de RN-03 que ya conoce el cliente.
  async elegirSucursalDeDespacho(lineas: Array<{ productId: number; quantity: number }>): Promise<number> {
    const porSucursal = new Map<number, { alcanza: boolean; unidades: number }>();
    for (const [indice, linea] of lineas.entries()) {
      const filas = await this.erp.listarDisponibilidadPorProducto(linea.productId);
      if (filas.length === 0) {
        throw new NotFoundException("No hay disponibilidad registrada para ese producto");
      }
      const maximo = Math.max(...filas.map((f) => f.unidadesDisponibles));
      if (maximo < linea.quantity) {
        throw new BadRequestException(
          `Solo hay ${maximo} unidades disponibles para el producto ${linea.productId} en la sucursal que despacha`,
        );
      }
      for (const fila of filas) {
        const previo = porSucursal.get(fila.branchId) ?? { alcanza: true, unidades: 0 };
        porSucursal.set(fila.branchId, {
          alcanza: (indice === 0 || previo.alcanza) && fila.unidadesDisponibles >= linea.quantity,
          unidades: previo.unidades + fila.unidadesDisponibles,
        });
      }
    }
    const candidatas = [...porSucursal.entries()].filter(([, v]) => v.alcanza).sort((a, b) => b[1].unidades - a[1].unidades);
    if (candidatas.length === 0) {
      throw new BadRequestException("Ninguna sucursal tiene unidades disponibles para todo el pedido; ajusta las cantidades");
    }
    return candidatas[0][0];
  }

  async liberarReserva(availabilityId: number, quantity: number) {
    return this.erp.liberarReserva(availabilityId, quantity);
  }

  // Endpoint interno de sincronización (RN-04) — ver AdaptadorErpSimulado.
  async sincronizarSucursal(branchId: number) {
    return this.erp.sincronizarSucursal(branchId);
  }
}
