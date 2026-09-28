import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { JwtService } from "@nestjs/jwt";
import { OrderStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { PrismaModule } from "../prisma/prisma.module";
import { resetDb } from "../test-utils/reset-db";
import { AuthModule } from "../auth/auth.module";
import { PedidoModule } from "./pedido.module";
import { CarritoService } from "../carrito/carrito.service";
import { PedidoService } from "./pedido.service";

// Cierra el hueco de seguridad "4 endpoints de transición de Pedido sin
// autenticación" (evaluación de funcionalidad ISO/IEC 9126-3, métrica de
// controlabilidad del acceso). Primera prueba del backend que arranca una
// aplicación Nest real (createNestApplication + supertest) en vez de probar
// el servicio directo — necesario porque los guards corren en la tubería
// HTTP, nunca dentro de un TestingModule que solo registra providers.
describe("PedidoController (autenticación, pertenencia y auditoría)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let carrito: CarritoService;
  let pedido: PedidoService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule, PedidoModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = moduleRef.get(PrismaService);
    jwt = moduleRef.get(JwtService);
    carrito = moduleRef.get(CarritoService);
    pedido = moduleRef.get(PedidoService);
  });

  beforeEach(async () => resetDb(prisma));
  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  async function crearPedidoPagado(documento: string) {
    const category = await prisma.category.create({ data: { name: `Cat-${documento}` } });
    const product = await prisma.product.create({
      data: { homologatedCode: `HC-${documento}`, name: "P", categoryId: category.id, cost: 10, digitalPrice: 20 },
    });
    const branch = await prisma.branch.create({ data: { name: `Suc-${documento}`, city: "Bogotá" } });
    await prisma.availability.create({
      data: { productId: product.id, branchId: branch.id, erpUnits: 20, safetyThreshold: 5, reservedUnits: 0, syncedAt: new Date() },
    });
    const customer = await prisma.customer.create({
      data: { document: documento, name: "Cliente", email: `${documento}@test.com`, passwordHash: "x" },
    });
    await carrito.agregarItem(customer.id, null, { productId: product.id, quantity: 1 });
    const order = await pedido.confirmar(customer.id, { branchId: branch.id });
    await pedido.marcarEstado(order.id, OrderStatus.PAID);
    const token = jwt.sign({ sub: customer.id, email: customer.email });
    return { customer, order, token };
  }

  it("POST /pedidos/:id/cancelar sin token -> 401", async () => {
    const { order } = await crearPedidoPagado("CC-AUTH-01");
    await request(app.getHttpServer()).post(`/pedidos/${order.id}/cancelar`).expect(401);
  });

  it("POST /pedidos/:id/cancelar con token de otro cliente -> 403, el pedido no cambia", async () => {
    const { order } = await crearPedidoPagado("CC-AUTH-02");
    const { token: tokenOtroCliente } = await crearPedidoPagado("CC-AUTH-03");
    await request(app.getHttpServer())
      .post(`/pedidos/${order.id}/cancelar`)
      .set("Authorization", `Bearer ${tokenOtroCliente}`)
      .expect(403);
    const sinCambio = await prisma.order.findUnique({ where: { id: order.id } });
    expect(sinCambio?.status).toBe(OrderStatus.PAID);
  });

  it("POST /pedidos/:id/cancelar con el token del dueño -> 201, cancela y queda auditado", async () => {
    const { order, token, customer } = await crearPedidoPagado("CC-AUTH-04");
    await request(app.getHttpServer())
      .post(`/pedidos/${order.id}/cancelar`)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);
    const actualizado = await prisma.order.findUnique({ where: { id: order.id } });
    expect(actualizado?.status).toBe(OrderStatus.CANCELLED);
    const auditoria = await prisma.auditLog.findFirst({ where: { orderId: order.id, action: "pedido.cancelar" } });
    expect(auditoria?.customerId).toBe(customer.id);
  });

  it("POST /pedidos/:id/iniciar-alistamiento sin token -> 401", async () => {
    const { order } = await crearPedidoPagado("CC-AUTH-05");
    await request(app.getHttpServer()).post(`/pedidos/${order.id}/iniciar-alistamiento`).expect(401);
  });

  it("POST /pedidos/:id/iniciar-alistamiento con cualquier cliente autenticado -> 201 (operación de sucursal, sin verificación de pertenencia) y queda auditado", async () => {
    const { order } = await crearPedidoPagado("CC-AUTH-06");
    const { token: tokenOtroCliente, customer: otroCliente } = await crearPedidoPagado("CC-AUTH-07");
    await request(app.getHttpServer())
      .post(`/pedidos/${order.id}/iniciar-alistamiento`)
      .set("Authorization", `Bearer ${tokenOtroCliente}`)
      .expect(201);
    const actualizado = await prisma.order.findUnique({ where: { id: order.id } });
    expect(actualizado?.status).toBe(OrderStatus.PREPARING);
    const auditoria = await prisma.auditLog.findFirst({
      where: { orderId: order.id, action: "pedido.iniciarAlistamiento" },
    });
    expect(auditoria?.customerId).toBe(otroCliente.id);
  });

  it("POST /pedidos/:id/listo-para-retiro sin token -> 401", async () => {
    const { order } = await crearPedidoPagado("CC-AUTH-08");
    await request(app.getHttpServer()).post(`/pedidos/${order.id}/listo-para-retiro`).expect(401);
  });

  it("POST /pedidos/:id/listo-para-retiro con cliente autenticado -> 201 y queda auditado", async () => {
    const { order, token, customer } = await crearPedidoPagado("CC-AUTH-09");
    await pedido.iniciarAlistamiento(order.id);
    await request(app.getHttpServer())
      .post(`/pedidos/${order.id}/listo-para-retiro`)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);
    const actualizado = await prisma.order.findUnique({ where: { id: order.id } });
    expect(actualizado?.status).toBe(OrderStatus.READY_FOR_PICKUP);
    const auditoria = await prisma.auditLog.findFirst({
      where: { orderId: order.id, action: "pedido.marcarListoParaRetiro" },
    });
    expect(auditoria?.customerId).toBe(customer.id);
  });

  it("POST /pedidos/:id/retirar sin token -> 401", async () => {
    const { order } = await crearPedidoPagado("CC-AUTH-10");
    await request(app.getHttpServer())
      .post(`/pedidos/${order.id}/retirar`)
      .send({ pickupCode: order.pickupCode })
      .expect(401);
  });

  it("POST /pedidos/:id/retirar con cliente autenticado -> 201 y queda auditado", async () => {
    const { order, token, customer } = await crearPedidoPagado("CC-AUTH-11");
    await pedido.iniciarAlistamiento(order.id);
    await pedido.marcarListoParaRetiro(order.id);
    await request(app.getHttpServer())
      .post(`/pedidos/${order.id}/retirar`)
      .set("Authorization", `Bearer ${token}`)
      .send({ pickupCode: order.pickupCode })
      .expect(201);
    const actualizado = await prisma.order.findUnique({ where: { id: order.id } });
    expect(actualizado?.status).toBe(OrderStatus.DELIVERED);
    const auditoria = await prisma.auditLog.findFirst({ where: { orderId: order.id, action: "pedido.retirar" } });
    expect(auditoria?.customerId).toBe(customer.id);
  });

  it("POST /pedidos/confirmar con cliente autenticado queda auditado", async () => {
    // A diferencia de crearPedidoPagado() (que llama pedido.confirmar()
    // directo, sin pasar por el controlador), aquí sí hay que pegarle al
    // endpoint real, porque el registro de auditoría vive en el controlador,
    // no en el servicio.
    const category = await prisma.category.create({ data: { name: "Cat-CONFIRM" } });
    const product = await prisma.product.create({
      data: { homologatedCode: "HC-CONFIRM", name: "P", categoryId: category.id, cost: 10, digitalPrice: 20 },
    });
    const branch = await prisma.branch.create({ data: { name: "Suc-CONFIRM", city: "Bogotá" } });
    await prisma.availability.create({
      data: { productId: product.id, branchId: branch.id, erpUnits: 20, safetyThreshold: 5, reservedUnits: 0, syncedAt: new Date() },
    });
    const customer = await prisma.customer.create({
      data: { document: "CC-AUTH-12", name: "Cliente", email: "cc-auth-12@test.com", passwordHash: "x" },
    });
    await carrito.agregarItem(customer.id, null, { productId: product.id, quantity: 1 });
    const token = jwt.sign({ sub: customer.id, email: customer.email });

    const respuesta = await request(app.getHttpServer())
      .post("/pedidos/confirmar")
      .set("Authorization", `Bearer ${token}`)
      .send({ branchId: branch.id })
      .expect(201);

    const auditoria = await prisma.auditLog.findFirst({
      where: { orderId: respuesta.body.id, action: "pedido.confirmar" },
    });
    expect(auditoria?.customerId).toBe(customer.id);
  });
});
