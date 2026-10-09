import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { resetDb } from "../test-utils/reset-db";
import { CatalogoService } from "../catalogo/catalogo.service";
import { AdaptadorErpSimulado } from "../catalogo/puertos/adaptador-erp-simulado";
import { CarritoService } from "./carrito.service";

// El carrito devuelve los totales que calcula el servidor y hace cumplir el tope de 10 unidades por producto.
describe("CarritoService: totales y tope por producto", () => {
  let prisma: PrismaService;
  let carrito: CarritoService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ providers: [CarritoService, CatalogoService, AdaptadorErpSimulado, PrismaService] }).compile();
    prisma = moduleRef.get(PrismaService);
    carrito = moduleRef.get(CarritoService);
  });
  beforeEach(async () => resetDb(prisma));
  afterAll(async () => prisma.$disconnect());

  async function productoYCliente() {
    const category = await prisma.category.create({ data: { name: "Cat-LIM" } });
    const product = await prisma.product.create({
      data: { homologatedCode: "LIM-000001", name: "P", categoryId: category.id, cost: 1000, digitalPrice: 179000 },
    });
    const customer = await prisma.customer.create({ data: { document: "CC-LIM", name: "C", email: "lim@test.com", passwordHash: "x" } });
    return { product, customer };
  }

  it("devuelve total por línea, subtotal y unidades calculados por el servidor", async () => {
    const { product, customer } = await productoYCliente();
    const c = await carrito.agregarItem(customer.id, null, { productId: product.id, quantity: 2 });
    expect(c.items[0].lineTotal).toBe(358000);
    expect(c).toMatchObject({ subtotal: 358000, unidades: 2, maxPorProducto: 10 });
  });

  it("no deja pasar de 10 unidades de un producto, sumando lo que ya hay en el carrito", async () => {
    const { product, customer } = await productoYCliente();
    await carrito.agregarItem(customer.id, null, { productId: product.id, quantity: 8 });
    await expect(carrito.agregarItem(customer.id, null, { productId: product.id, quantity: 3 })).rejects.toThrow(/ya tienes 8/);
    await expect(carrito.agregarItem(customer.id, null, { productId: product.id, quantity: 2 })).resolves.toMatchObject({ unidades: 10 });
  });

  it("actualizar la cantidad por encima de 10 también se rechaza", async () => {
    const { product, customer } = await productoYCliente();
    const c = await carrito.agregarItem(customer.id, null, { productId: product.id, quantity: 1 });
    await expect(carrito.actualizarItem(c.id, product.id, { quantity: 11 })).rejects.toThrow(/Máximo 10/);
  });

  it("al fusionar el carrito de invitado nadie queda por encima del tope", async () => {
    const { product, customer } = await productoYCliente();
    await carrito.agregarItem(customer.id, null, { productId: product.id, quantity: 7 });
    await carrito.agregarItem(null, "invitado-1", { productId: product.id, quantity: 6 });
    const fusionado = await carrito.fusionar(customer.id, "invitado-1");
    expect(fusionado.items[0].quantity).toBe(10);
  });
});
