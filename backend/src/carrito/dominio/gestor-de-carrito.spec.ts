import { Test } from "@nestjs/testing";
import { PrismaService } from "../../prisma/prisma.service";
import { resetDb } from "../../test-utils/reset-db";
import { CatalogoService } from "../../catalogo/catalogo.service";
import { AdaptadorErpSimulado } from "../../catalogo/puertos/adaptador-erp-simulado";
import { CarritoService } from "../carrito.service";
import { GestorDeCarrito } from "./gestor-de-carrito";

// Cubre el hueco de cobertura señalado en el plan: carrito.service.ts no
// tenía spec propio antes de esta entrega.
describe("GestorDeCarrito", () => {
  let prisma: PrismaService;
  let gestor: GestorDeCarrito;
  let productId: number;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [CarritoService, CatalogoService, AdaptadorErpSimulado, PrismaService, GestorDeCarrito],
    }).compile();
    prisma = moduleRef.get(PrismaService);
    gestor = moduleRef.get(GestorDeCarrito);
  });

  beforeEach(async () => {
    await resetDb(prisma);
    const category = await prisma.category.create({ data: { name: "Cat" } });
    const product = await prisma.product.create({
      data: { homologatedCode: "GDC-000001", name: "Producto de prueba", categoryId: category.id, cost: 1000, digitalPrice: 2000 },
    });
    productId = product.id;
  });
  afterAll(async () => prisma.$disconnect());

  it("obtenerCarrito() crea un carrito vacío de invitado si no existe", async () => {
    const carrito = await gestor.obtenerCarrito(null, "invitado-1");
    expect(carrito.estaVacio()).toBe(true);
    expect(carrito.total()).toBe(0);
  });

  it("agregarItem() agrega la línea y total()/subtotal() calculan correctamente", async () => {
    const carrito = await gestor.agregarItem(null, "invitado-2", { productId, quantity: 3 });

    expect(carrito.estaVacio()).toBe(false);
    expect(carrito.lineas[0].subtotal()).toBe(6000); // 2000 * 3
    expect(carrito.total()).toBe(6000);
  });

  it("actualizarItem() con cantidad 0 quita la línea del carrito", async () => {
    const carrito = await gestor.agregarItem(null, "invitado-3", { productId, quantity: 2 });
    const actualizado = await gestor.actualizarItem(carrito.id, productId, { quantity: 0 });
    expect(actualizado.estaVacio()).toBe(true);
  });

  it("quitarItem() elimina la línea indicada", async () => {
    const carrito = await gestor.agregarItem(null, "invitado-4", { productId, quantity: 1 });
    const actualizado = await gestor.quitarItem(carrito.id, productId);
    expect(actualizado.estaVacio()).toBe(true);
  });
});
