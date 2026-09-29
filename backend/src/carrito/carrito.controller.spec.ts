import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { PrismaModule } from "../prisma/prisma.module";
import { resetDb } from "../test-utils/reset-db";
import { AuthModule } from "../auth/auth.module";
import { CarritoModule } from "./carrito.module";
import { CarritoService } from "./carrito.service";

// Corrección CU-2 #8 (segunda ronda): PATCH/DELETE /carrito/:cartId/items/:productId
// recibían el cartId de la URL sin verificar que fuera el que le corresponde
// a quien hace la solicitud (por su X-Cart-Token si es invitado, o por su
// sesión si está autenticado) — cualquiera con o adivinando un cartId ajeno
// podía modificarlo o vaciarlo. Primera prueba a nivel HTTP de este
// controlador (createNestApplication + supertest), porque el guard opcional
// y los encabezados solo se ejercitan en la tubería HTTP real.
describe("CarritoController (pertenencia)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let carrito: CarritoService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule, CarritoModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = moduleRef.get(PrismaService);
    jwt = moduleRef.get(JwtService);
    carrito = moduleRef.get(CarritoService);
  });

  beforeEach(async () => resetDb(prisma));
  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  async function crearProducto(codigo: string) {
    const category = await prisma.category.create({ data: { name: `Cat-${codigo}` } });
    return prisma.product.create({
      data: { homologatedCode: codigo, name: "P", categoryId: category.id, cost: 10, digitalPrice: 20, published: true },
    });
  }

  it("PATCH /carrito/:cartId/items/:productId con el X-Cart-Token de otro invitado -> 403, la cantidad no cambia", async () => {
    const product = await crearProducto("CART-01");
    const cartDueno = await carrito.agregarItem(null, "guest-token-dueno-1", { productId: product.id, quantity: 1 });
    await carrito.agregarItem(null, "guest-token-otro-1", { productId: product.id, quantity: 1 });

    await request(app.getHttpServer())
      .patch(`/carrito/${cartDueno.id}/items/${product.id}`)
      .set("X-Cart-Token", "guest-token-otro-1")
      .send({ quantity: 5 })
      .expect(403);

    const sinCambio = await carrito.obtenerPorId(cartDueno.id);
    expect(sinCambio.items[0].quantity).toBe(1);
  });

  it("PATCH /carrito/:cartId/items/:productId con el X-Cart-Token del dueño -> 200, actualiza la cantidad", async () => {
    const product = await crearProducto("CART-02");
    const cart = await carrito.agregarItem(null, "guest-token-dueno-2", { productId: product.id, quantity: 1 });

    await request(app.getHttpServer())
      .patch(`/carrito/${cart.id}/items/${product.id}`)
      .set("X-Cart-Token", "guest-token-dueno-2")
      .send({ quantity: 5 })
      .expect(200);

    const actualizado = await carrito.obtenerPorId(cart.id);
    expect(actualizado.items[0].quantity).toBe(5);
  });

  it("DELETE /carrito/:cartId/items/:productId con el token de otro cliente autenticado -> 403, el item no se borra", async () => {
    const product = await crearProducto("CART-03");
    const dueno = await prisma.customer.create({
      data: { document: "CART-DUENO", name: "Dueno", email: "dueno@test.com", passwordHash: "x" },
    });
    const otro = await prisma.customer.create({
      data: { document: "CART-OTRO", name: "Otro", email: "otro@test.com", passwordHash: "x" },
    });
    const cartDueno = await carrito.agregarItem(dueno.id, null, { productId: product.id, quantity: 1 });
    const tokenOtro = jwt.sign({ sub: otro.id, email: otro.email });

    await request(app.getHttpServer())
      .delete(`/carrito/${cartDueno.id}/items/${product.id}`)
      .set("Authorization", `Bearer ${tokenOtro}`)
      .expect(403);

    const sinCambio = await carrito.obtenerPorId(cartDueno.id);
    expect(sinCambio.items).toHaveLength(1);
  });

  it("DELETE /carrito/:cartId/items/:productId con el token del dueño -> 200, elimina el item", async () => {
    const product = await crearProducto("CART-04");
    const dueno = await prisma.customer.create({
      data: { document: "CART-DUENO-2", name: "Dueno2", email: "dueno2@test.com", passwordHash: "x" },
    });
    const cart = await carrito.agregarItem(dueno.id, null, { productId: product.id, quantity: 1 });
    const token = jwt.sign({ sub: dueno.id, email: dueno.email });

    await request(app.getHttpServer())
      .delete(`/carrito/${cart.id}/items/${product.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const actualizado = await carrito.obtenerPorId(cart.id);
    expect(actualizado.items).toHaveLength(0);
  });
});
