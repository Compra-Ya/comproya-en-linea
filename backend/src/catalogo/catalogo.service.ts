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
  async reservarUnidades(productId: number, branchId: number, quantity: number) {
    return this.erp.reservarUnidades(productId, branchId, quantity);
  }

  async liberarReserva(availabilityId: number, quantity: number) {
    return this.erp.liberarReserva(availabilityId, quantity);
  }

  // Endpoint interno de sincronización (RN-04) — ver AdaptadorErpSimulado.
  async sincronizarSucursal(branchId: number) {
    return this.erp.sincronizarSucursal(branchId);
  }
}
