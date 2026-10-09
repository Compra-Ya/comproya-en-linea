import { INestApplication, ValidationPipe } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { PrismaService } from "../prisma/prisma.service";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { resetDb } from "../test-utils/reset-db";
import { CarritoService } from "../carrito/carrito.service";
import { PedidoModule } from "./pedido.module";
import { PedidoService } from "./pedido.service";

// CU-10: el cupón se valida antes de confirmar, con el descuento y el total reales del servidor; no se redime
// al validar (RN-07 se cumple al confirmar) y el pedido devuelve sus totales.
describe("Cupón de lealtad y totales del pedido", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let pedido: PedidoService;
  let carrito: CarritoService;
  let jwt: JwtService;
  const envio = { nombre: "Ana Pérez", telefono: "3001234567", direccion: "Calle 10 # 5-20", ciudad: "Bogotá" };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [PrismaModule, AuthModule, PedidoModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();
    prisma = moduleRef.get(PrismaService);
    pedido = moduleRef.get(PedidoService);
    carrito = moduleRef.get(CarritoService);
    jwt = moduleRef.get(JwtService);
  });
  beforeEach(async () => resetDb(prisma));
  afterAll(async () => {
    await resetDb(prisma);
    await app.close();
    await prisma.$disconnect();
  });

  async function escenario() {
    const category = await prisma.category.create({ data: { name: "Cat-CUPON" } });
    const product = await prisma.product.create({
      data: { homologatedCode: "CUP-000001", name: "Producto", categoryId: category.id, cost: 1000, digitalPrice: 50000 },
    });
    const branch = await prisma.branch.create({ data: { name: "Central", city: "Bogotá" } });
    await prisma.availability.create({
      data: { productId: product.id, branchId: branch.id, erpUnits: 50, safetyThreshold: 5, reservedUnits: 0, syncedAt: new Date() },
    });
    await prisma.loyaltyCoupon.create({ data: { code: "LEALTAD10", percentage: 10, active: true } });
    await prisma.loyaltyCoupon.create({ data: { code: "VIEJO", percentage: 50, active: false } });
    const customer = await prisma.customer.create({ data: { document: "CC-CUP", name: "Cliente", email: "cupon@test.com", passwordHash: "x" } });
    await carrito.agregarItem(customer.id, null, { productId: product.id, quantity: 2 });
    return { customer, token: jwt.sign({ sub: customer.id, email: customer.email }) };
  }

  it("POST /cupones/validar devuelve porcentaje, descuento y total reales sobre el carrito, sin redimir", async () => {
    const { token } = await escenario();
    const r = await request(app.getHttpServer()).post("/cupones/validar").set("Authorization", `Bearer ${token}`).send({ codigo: "lealtad10" }).expect(201);
    expect(r.body).toEqual({ codigo: "LEALTAD10", porcentaje: 10, subtotal: 100000, descuento: 10000, total: 90000 });
    expect(await prisma.couponRedemption.count()).toBe(0);
  });

  it("un cupón inexistente o inactivo responde 400 con un mensaje claro", async () => {
    const { token } = await escenario();
    for (const codigo of ["NOEXISTE", "VIEJO"]) {
      const r = await request(app.getHttpServer()).post("/cupones/validar").set("Authorization", `Bearer ${token}`).send({ codigo }).expect(400);
      expect(r.body.message).toMatch(/no existe o no está vigente/);
    }
  });

  it("exige sesión y un código escrito", async () => {
    const { token } = await escenario();
    await request(app.getHttpServer()).post("/cupones/validar").send({ codigo: "LEALTAD10" }).expect(401);
    const r = await request(app.getHttpServer()).post("/cupones/validar").set("Authorization", `Bearer ${token}`).send({ codigo: "" }).expect(400);
    expect(JSON.stringify(r.body.message)).toMatch(/código de tu cupón/);
  });

  it("al confirmar, el pedido trae subtotal, descuento y total del servidor (el mismo que se cobra)", async () => {
    const { customer } = await escenario();
    const order = await pedido.confirmar(customer.id, { tipoEntrega: "ENVIO", envio, couponCode: "lealtad10" });
    expect(order).toMatchObject({ subtotal: 100000, descuento: 10000, total: 90000, codigoCupon: "LEALTAD10", porcentajeCupon: 10 });
    expect(await pedido.calcularTotal(order.id)).toBe(90000);
  });

  it("el listado de pedidos incluye totales y los productos con su foto", async () => {
    const { customer } = await escenario();
    await pedido.confirmar(customer.id, { tipoEntrega: "ENVIO", envio });
    const [primero] = await pedido.listarPorCliente(customer.id);
    expect(primero).toMatchObject({ subtotal: 100000, descuento: 0, total: 100000 });
    expect(primero.items[0].product.name).toBe("Producto");
  });
});
