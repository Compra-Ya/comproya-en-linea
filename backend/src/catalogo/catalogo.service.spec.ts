import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { resetDb } from "../test-utils/reset-db";
import { CatalogoService } from "./catalogo.service";
import { AdaptadorErpSimulado } from "./puertos/adaptador-erp-simulado";

describe("CatalogoService (RN-01, RN-02, RN-03, RN-04)", () => {
  let prisma: PrismaService;
  let catalogo: CatalogoService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [CatalogoService, AdaptadorErpSimulado, PrismaService],
    }).compile();
    prisma = moduleRef.get(PrismaService);
    catalogo = moduleRef.get(CatalogoService);
  });

  beforeEach(async () => resetDb(prisma));
  afterAll(async () => prisma.$disconnect());

  it("RN-01: rechaza publicar un producto cuyo código no está homologado en el maestro", async () => {
    await expect(
      catalogo.publicarProducto({
        homologatedCode: "codigo-invalido",
        name: "Producto",
        categoryName: "Categoría",
        cost: 10,
        digitalPrice: 20,
      }),
    ).rejects.toThrow(/no existe en el maestro/);
  });

  it("RN-01: publica un producto con código homologado válido", async () => {
    const producto = await catalogo.publicarProducto({
      homologatedCode: "ABC-000001",
      name: "Producto válido",
      categoryName: "Categoría",
      cost: 10,
      digitalPrice: 20,
    });
    expect(producto.published).toBe(true);
  });

  it("CU-01: con existencias, el producto queda comprable en la sucursal única: unidades = existencias - umbral (RN-03)", async () => {
    const producto = await catalogo.publicarProducto({
      homologatedCode: "ABC-000010",
      name: "Producto con existencias",
      categoryName: "Categoría",
      cost: 10,
      digitalPrice: 20,
      existencias: 20,
    });
    expect(producto.unidadesDisponibles).toBe(15); // 20 - umbral de seguridad 5 - 0 reservas
    expect(await prisma.branch.count()).toBe(1);
    const detalle = await catalogo.obtenerProducto(producto.id);
    expect(detalle.unidadesDisponibles).toBe(15);

    // Volver a publicar con otras existencias las reemplaza en la misma fila, sin crear otra sucursal ni otra fila.
    const republicado = await catalogo.publicarProducto({
      homologatedCode: "ABC-000010",
      name: "Producto con existencias",
      categoryName: "Categoría",
      cost: 10,
      digitalPrice: 20,
      existencias: 8,
    });
    expect(republicado.unidadesDisponibles).toBe(3);
    expect(await prisma.availability.count()).toBe(1);
    expect(await prisma.branch.count()).toBe(1);
  });

  it("CU-01: sin existencias el producto se publica pero no se puede comprar (0 unidades) y no crea sucursal", async () => {
    const producto = await catalogo.publicarProducto({
      homologatedCode: "ABC-000011",
      name: "Producto sin existencias",
      categoryName: "Categoría",
      cost: 10,
      digitalPrice: 20,
    });
    expect(producto.unidadesDisponibles).toBe(0);
    expect(await prisma.branch.count()).toBe(0);
  });

  it("CU-01: usa la sucursal que ya existe en vez de crear otra", async () => {
    const sucursal = await prisma.branch.create({ data: { name: "ComproYa", city: "Bogotá" } });
    const producto = await catalogo.publicarProducto({
      homologatedCode: "ABC-000012",
      name: "Producto en la sucursal existente",
      categoryName: "Categoría",
      cost: 10,
      digitalPrice: 20,
      existencias: 12,
    });
    const fila = await prisma.availability.findFirstOrThrow({ where: { productId: producto.id } });
    expect(fila.branchId).toBe(sucursal.id);
    expect(await prisma.branch.count()).toBe(1);
  });

  it("RN-02: rechaza un precio digital inferior al costo sin aprobación de gerencia comercial", async () => {
    await expect(
      catalogo.publicarProducto({
        homologatedCode: "ABC-000002",
        name: "Producto barato",
        categoryName: "Categoría",
        cost: 100,
        digitalPrice: 50,
      }),
    ).rejects.toThrow(/aprobación de gerencia comercial/);
  });

  it("RN-02: permite un precio digital inferior al costo con aprobación explícita", async () => {
    const producto = await catalogo.publicarProducto({
      homologatedCode: "ABC-000003",
      name: "Producto con descuento aprobado",
      categoryName: "Categoría",
      cost: 100,
      digitalPrice: 50,
      aprobacionGerencialComercial: true,
    });
    expect(Number(producto.digitalPrice)).toBe(50);
  });

  it("RN-03: las unidades disponibles restan el umbral de seguridad y las reservas vigentes", async () => {
    const category = await prisma.category.create({ data: { name: "Cat" } });
    const product = await prisma.product.create({
      data: { homologatedCode: "ABC-000010", name: "P", categoryId: category.id, cost: 1, digitalPrice: 2 },
    });
    const branch = await prisma.branch.create({ data: { name: "Sucursal", city: "Bogotá" } });
    await prisma.availability.create({
      data: { productId: product.id, branchId: branch.id, erpUnits: 20, safetyThreshold: 5, reservedUnits: 3, syncedAt: new Date() },
    });

    const disponibilidad = await catalogo.disponibilidadPorSucursal(product.id, branch.id);
    // RN-03: 20 - 5 - 3 = 12.
    expect(disponibilidad.unidadesDisponibles).toBe(12);
  });

  it("RN-04: una sucursal con más de 15 minutos sin sincronizar no ofrece retiro", async () => {
    const category = await prisma.category.create({ data: { name: "Cat2" } });
    const product = await prisma.product.create({
      data: { homologatedCode: "ABC-000011", name: "P2", categoryId: category.id, cost: 1, digitalPrice: 2 },
    });
    const branch = await prisma.branch.create({ data: { name: "Sucursal desincronizada", city: "Bogotá" } });
    const haceVeinteMinutos = new Date(Date.now() - 20 * 60 * 1000);
    await prisma.availability.create({
      data: { productId: product.id, branchId: branch.id, erpUnits: 20, safetyThreshold: 5, reservedUnits: 0, syncedAt: haceVeinteMinutos },
    });

    const disponibilidad = await catalogo.disponibilidadPorSucursal(product.id, branch.id);
    expect(disponibilidad.puedeRetirar).toBe(false);
  });

  it("RN-04: al reservar, una sucursal desincronizada hace más de 15 minutos se rechaza aunque haya unidades", async () => {
    const category = await prisma.category.create({ data: { name: "Cat3" } });
    const product = await prisma.product.create({
      data: { homologatedCode: "ABC-000012", name: "P3", categoryId: category.id, cost: 1, digitalPrice: 2 },
    });
    const branch = await prisma.branch.create({ data: { name: "Sucursal desincronizada 2", city: "Bogotá" } });
    const haceVeinteMinutos = new Date(Date.now() - 20 * 60 * 1000);
    await prisma.availability.create({
      data: { productId: product.id, branchId: branch.id, erpUnits: 20, safetyThreshold: 5, reservedUnits: 0, syncedAt: haceVeinteMinutos },
    });

    await expect(catalogo.reservarUnidades(product.id, branch.id, 1)).rejects.toThrow(/sin sincronizar/);
  });
});
