import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { resetDb } from "../test-utils/reset-db";
import { CatalogoService } from "./catalogo.service";
import { AdaptadorErpSimulado } from "./puertos/adaptador-erp-simulado";

// El catálogo trae, por producto, las unidades disponibles (RN-03) que una sola sucursal puede despachar y el
// máximo que se puede pedir de una vez (el menor entre esas unidades y el tope de 10 por producto).
describe("CatalogoService: unidades disponibles por producto", () => {
  let prisma: PrismaService;
  let catalogo: CatalogoService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ providers: [CatalogoService, AdaptadorErpSimulado, PrismaService] }).compile();
    prisma = moduleRef.get(PrismaService);
    catalogo = moduleRef.get(CatalogoService);
  });
  beforeEach(async () => resetDb(prisma));
  afterAll(async () => prisma.$disconnect());

  async function sembrar() {
    const category = await prisma.category.create({ data: { name: "Cat-UND" } });
    const mk = (n: number, nombre: string) =>
      prisma.product.create({ data: { homologatedCode: `UND-00000${n}`, name: nombre, categoryId: category.id, cost: 10, digitalPrice: 20 } });
    const [muchos, pocos, agotado, sinFilas] = [await mk(1, "Muchos"), await mk(2, "Pocos"), await mk(3, "Agotado"), await mk(4, "Sin filas")];
    const a = await prisma.branch.create({ data: { name: "A", city: "Bogotá" } });
    const b = await prisma.branch.create({ data: { name: "B", city: "Cali" } });
    const fila = (productId: number, branchId: number, erpUnits: number, reservedUnits = 0) =>
      prisma.availability.create({ data: { productId, branchId, erpUnits, safetyThreshold: 5, reservedUnits, syncedAt: new Date() } });
    await fila(muchos.id, a.id, 105); // 100 disponibles
    await fila(muchos.id, b.id, 25); // 20
    await fila(pocos.id, a.id, 12, 2); // 5
    await fila(pocos.id, b.id, 9); // 4
    await fila(agotado.id, a.id, 5); // 0
    return { category, muchos, pocos, agotado, sinFilas };
  }

  it("la lista trae las unidades de la sucursal que más tiene y el máximo por pedido", async () => {
    await sembrar();
    const { items } = await catalogo.listarPublicados();
    const por = Object.fromEntries(items.map((p) => [p.name, p]));
    expect(por["Muchos"]).toMatchObject({ unidadesDisponibles: 100, maximoPorPedido: 10 });
    expect(por["Pocos"]).toMatchObject({ unidadesDisponibles: 5, maximoPorPedido: 5 });
    expect(por["Agotado"]).toMatchObject({ unidadesDisponibles: 0, maximoPorPedido: 0 });
    expect(por["Sin filas"]).toMatchObject({ unidadesDisponibles: 0, maximoPorPedido: 0 });
  });

  it("la búsqueda y el detalle del producto también las traen", async () => {
    const { pocos } = await sembrar();
    const { items } = await catalogo.buscarProductos("Poc");
    expect(items[0]).toMatchObject({ name: "Pocos", unidadesDisponibles: 5 });
    expect(await catalogo.obtenerProducto(pocos.id)).toMatchObject({ unidadesDisponibles: 5, maximoPorPedido: 5 });
  });

  it("las unidades reservadas por otros pedidos ya están descontadas", async () => {
    const { muchos } = await sembrar();
    await prisma.availability.updateMany({ where: { productId: muchos.id }, data: { reservedUnits: 98 } });
    expect(await catalogo.obtenerProducto(muchos.id)).toMatchObject({ unidadesDisponibles: 2, maximoPorPedido: 2 });
  });
});
