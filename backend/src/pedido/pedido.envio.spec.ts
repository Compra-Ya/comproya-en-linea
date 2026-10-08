import { INestApplication, ValidationPipe } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { DeliveryMode, OrderStatus } from "@prisma/client";
import request from "supertest";
import { PrismaService } from "../prisma/prisma.service";
import { resetDb } from "../test-utils/reset-db";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { PedidoModule } from "./pedido.module";
import { CarritoService } from "../carrito/carrito.service";
import { PedidoService } from "./pedido.service";

// Venta digital con envío (modo de la prueba de usabilidad, docs/modo-venta-digital.md): el pedido
// guarda los datos de envío, no pide sucursal de retiro, la sucursal que despacha la elige el
// sistema y RN-04 (sincronización de retiro) no aplica al despacho. RN-03 y RN-05 siguen.
describe("Confirmar pedido con envío", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let pedido: PedidoService;
  let carrito: CarritoService;
  let jwt: JwtService;

  const envio = { nombre: "Ana Pérez", telefono: "300 123 4567", direccion: "Calle 10 # 5-20, apto 301", ciudad: "Bogotá", notas: "Portería" };

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

  async function escenario(unidadesPorSucursal: Array<{ nombre: string; erpUnits: number; sincronizada: boolean }>) {
    const category = await prisma.category.create({ data: { name: "Cat-ENVIO" } });
    const product = await prisma.product.create({
      data: { homologatedCode: "ENV-000001", name: "Silla de prueba", categoryId: category.id, cost: 10, digitalPrice: 20 },
    });
    const sucursales: Array<{ id: number; nombre: string }> = [];
    for (const s of unidadesPorSucursal) {
      const branch = await prisma.branch.create({ data: { name: s.nombre, city: "Bogotá" } });
      await prisma.availability.create({
        data: {
          productId: product.id,
          branchId: branch.id,
          erpUnits: s.erpUnits,
          safetyThreshold: 5,
          reservedUnits: 0,
          syncedAt: s.sincronizada ? new Date() : new Date(Date.now() - 3 * 60 * 60 * 1000),
        },
      });
      sucursales.push({ id: branch.id, nombre: s.nombre });
    }
    const customer = await prisma.customer.create({
      data: { document: "CC-ENV", name: "Cliente", email: "cliente-envio@test.com", passwordHash: "x" },
    });
    return { product, sucursales, customer };
  }

  it("guarda los datos de envío y no exige sucursal de retiro", async () => {
    const { product, customer } = await escenario([{ nombre: "Central", erpUnits: 30, sincronizada: true }]);
    await carrito.agregarItem(customer.id, null, { productId: product.id, quantity: 2 });

    const order = await pedido.confirmar(customer.id, { tipoEntrega: "ENVIO", envio });

    expect(order.deliveryMode).toBe(DeliveryMode.SHIPPING);
    expect(order).toMatchObject({
      shippingName: "Ana Pérez",
      shippingPhone: "300 123 4567",
      shippingAddress: "Calle 10 # 5-20, apto 301",
      shippingCity: "Bogotá",
      shippingNotes: "Portería",
      status: OrderStatus.CREATED,
    });
  });

  it("RN-04 no aplica al despacho: una sucursal sin sincronizar puede despachar", async () => {
    const { product, customer } = await escenario([{ nombre: "Bodega vieja", erpUnits: 30, sincronizada: false }]);
    await carrito.agregarItem(customer.id, null, { productId: product.id, quantity: 1 });
    await expect(pedido.confirmar(customer.id, { tipoEntrega: "ENVIO", envio })).resolves.toMatchObject({ status: OrderStatus.CREATED });
  });

  it("despacha la sucursal con más unidades disponibles que alcance para todo el pedido", async () => {
    const { product, sucursales, customer } = await escenario([
      { nombre: "Chica", erpUnits: 10, sincronizada: true }, // 5 disponibles
      { nombre: "Grande", erpUnits: 100, sincronizada: false }, // 95 disponibles
    ]);
    await carrito.agregarItem(customer.id, null, { productId: product.id, quantity: 3 });
    const order = await pedido.confirmar(customer.id, { tipoEntrega: "ENVIO", envio });
    expect(order.branchId).toBe(sucursales[1].id);
    const reservada = await prisma.availability.findFirst({ where: { branchId: sucursales[1].id } });
    expect(reservada?.reservedUnits).toBe(3); // RN-05: se reserva antes de cobrar
  });

  it("RN-03: si ninguna sucursal tiene las unidades pedidas, no crea el pedido y dice cuántas hay", async () => {
    const { product, customer } = await escenario([{ nombre: "Única", erpUnits: 8, sincronizada: true }]); // 3 disponibles
    await carrito.agregarItem(customer.id, null, { productId: product.id, quantity: 4 });
    await expect(pedido.confirmar(customer.id, { tipoEntrega: "ENVIO", envio })).rejects.toThrow(/Solo hay 3 unidades disponibles/);
    expect(await prisma.order.count()).toBe(0);
  });

  it("el retiro sigue funcionando como antes y exige sucursal", async () => {
    const { product, sucursales, customer } = await escenario([{ nombre: "Sede", erpUnits: 30, sincronizada: true }]);
    await carrito.agregarItem(customer.id, null, { productId: product.id, quantity: 1 });
    await expect(pedido.confirmar(customer.id, {})).rejects.toThrow(/sucursal de retiro/);
    const order = await pedido.confirmar(customer.id, { branchId: sucursales[0].id });
    expect(order.deliveryMode).toBe(DeliveryMode.PICKUP);
    expect(order.shippingAddress).toBeNull();
  });

  describe("POST /pedidos/confirmar (validación de los datos)", () => {
    async function conCarrito() {
      const e = await escenario([{ nombre: "Central", erpUnits: 30, sincronizada: true }]);
      await carrito.agregarItem(e.customer.id, null, { productId: e.product.id, quantity: 1 });
      return jwt.sign({ sub: e.customer.id, email: e.customer.email });
    }

    it("sin datos de envío responde 400 en español", async () => {
      const token = await conCarrito();
      const r = await request(app.getHttpServer()).post("/pedidos/confirmar").set("Authorization", `Bearer ${token}`).send({ tipoEntrega: "ENVIO" }).expect(400);
      expect(JSON.stringify(r.body.message)).toMatch(/datos de envío/);
    });

    it("con un teléfono inválido responde 400 con el mensaje del campo", async () => {
      const token = await conCarrito();
      const r = await request(app.getHttpServer())
        .post("/pedidos/confirmar")
        .set("Authorization", `Bearer ${token}`)
        .send({ tipoEntrega: "ENVIO", envio: { ...envio, telefono: "abc" } })
        .expect(400);
      expect(JSON.stringify(r.body.message)).toMatch(/teléfono válido/);
    });

    it("con datos completos responde 201 y devuelve el pedido con su dirección", async () => {
      const token = await conCarrito();
      const r = await request(app.getHttpServer()).post("/pedidos/confirmar").set("Authorization", `Bearer ${token}`).send({ tipoEntrega: "ENVIO", envio }).expect(201);
      expect(r.body).toMatchObject({ deliveryMode: "SHIPPING", shippingCity: "Bogotá" });
    });
  });
});
