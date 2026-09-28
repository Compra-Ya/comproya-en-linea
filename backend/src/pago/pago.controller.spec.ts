import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { JwtService } from "@nestjs/jwt";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { PrismaModule } from "../prisma/prisma.module";
import { resetDb } from "../test-utils/reset-db";
import { AuthModule } from "../auth/auth.module";
import { CarritoService } from "../carrito/carrito.service";
import { PedidoService } from "../pedido/pedido.service";
import { PagoModule } from "./pago.module";
import { AdaptadorStripe } from "./puertos/adaptador-stripe";

// Cierra el hueco de seguridad "notificación de débito bancario sin verificar
// origen" (evaluación de funcionalidad ISO/IEC 9126-3, métrica de prevención
// de acceso ilegal). Mismo patrón que pedido.controller.spec.ts: aplicación
// Nest real + supertest, porque el guard/verificación corre en la tubería
// HTTP. `AdaptadorStripe` se sustituye por un doble que nunca llama a la red
// de Stripe, igual que ya hace pago.service.spec.ts — estas pruebas no
// ejercitan la pasarela real, solo la autenticación/verificación de origen y
// la auditoría de los endpoints de pago.
describe("PagoController (verificación de origen y auditoría)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let carrito: CarritoService;
  let pedido: PedidoService;
  const SECRETO = process.env.DEBITO_NOTIFICATION_SECRET as string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule, PagoModule],
    })
      .overrideProvider(AdaptadorStripe)
      .useValue({
        crearCobroConTarjeta: jest.fn(async (orderId: number) => ({
          gatewayToken: `cs_test_falso_${orderId}`,
          redirectUrl: "https://checkout.stripe.com/test",
        })),
      })
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = moduleRef.get(PrismaService);
    jwt = moduleRef.get(JwtService);
    carrito = moduleRef.get(CarritoService);
    pedido = moduleRef.get(PedidoService);
    expect(SECRETO).toBeTruthy(); // si falta en .env.test, mejor fallar aquí que dar un falso negativo abajo.
  });

  beforeEach(async () => resetDb(prisma));
  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  async function crearPedidoConfirmado(documento: string) {
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
    const token = jwt.sign({ sub: customer.id, email: customer.email });
    return { customer, order, token };
  }

  it("POST /pagos/tarjeta/:orderId sin token -> 401", async () => {
    const { order } = await crearPedidoConfirmado("CC-PAGO-01");
    await request(app.getHttpServer()).post(`/pagos/tarjeta/${order.id}`).expect(401);
  });

  it("POST /pagos/tarjeta/:orderId con token del dueño -> 201 y queda auditado", async () => {
    const { order, token, customer } = await crearPedidoConfirmado("CC-PAGO-02");
    await request(app.getHttpServer())
      .post(`/pagos/tarjeta/${order.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);
    const auditoria = await prisma.auditLog.findFirst({
      where: { orderId: order.id, action: "pago.crearSesionTarjeta" },
    });
    expect(auditoria?.customerId).toBe(customer.id);
  });

  it("POST /pagos/debito/:orderId sin token -> 401", async () => {
    const { order } = await crearPedidoConfirmado("CC-PAGO-03");
    await request(app.getHttpServer()).post(`/pagos/debito/${order.id}`).expect(401);
  });

  it("POST /pagos/debito/:orderId con token del dueño -> 201 y queda auditado", async () => {
    const { order, token, customer } = await crearPedidoConfirmado("CC-PAGO-04");
    await request(app.getHttpServer())
      .post(`/pagos/debito/${order.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);
    const auditoria = await prisma.auditLog.findFirst({
      where: { orderId: order.id, action: "pago.crearIntentoDebito" },
    });
    expect(auditoria?.customerId).toBe(customer.id);
  });

  it("POST /pagos/debito/:orderId/notificacion sin el encabezado X-Debito-Secreto -> 401, el pago no cambia", async () => {
    const { order, token } = await crearPedidoConfirmado("CC-PAGO-05");
    await request(app.getHttpServer()).post(`/pagos/debito/${order.id}`).set("Authorization", `Bearer ${token}`);

    await request(app.getHttpServer())
      .post(`/pagos/debito/${order.id}/notificacion`)
      .send({ exitoso: true })
      .expect(401);

    const pago = await prisma.payment.findUnique({ where: { orderId: order.id } });
    expect(pago?.status).toBe(PaymentStatus.PENDING);
  });

  it("POST /pagos/debito/:orderId/notificacion con secreto incorrecto -> 401, el pago no cambia", async () => {
    const { order, token } = await crearPedidoConfirmado("CC-PAGO-06");
    await request(app.getHttpServer()).post(`/pagos/debito/${order.id}`).set("Authorization", `Bearer ${token}`);

    await request(app.getHttpServer())
      .post(`/pagos/debito/${order.id}/notificacion`)
      .set("X-Debito-Secreto", "secreto-que-no-es")
      .send({ exitoso: true })
      .expect(401);

    const pago = await prisma.payment.findUnique({ where: { orderId: order.id } });
    expect(pago?.status).toBe(PaymentStatus.PENDING);
  });

  it("POST /pagos/debito/:orderId/notificacion con el secreto correcto -> 201, confirma el pago y queda auditado sin identidad de cliente", async () => {
    const { order, token } = await crearPedidoConfirmado("CC-PAGO-07");
    await request(app.getHttpServer()).post(`/pagos/debito/${order.id}`).set("Authorization", `Bearer ${token}`);

    await request(app.getHttpServer())
      .post(`/pagos/debito/${order.id}/notificacion`)
      .set("X-Debito-Secreto", SECRETO)
      .send({ exitoso: true })
      .expect(201);

    const pago = await prisma.payment.findUnique({ where: { orderId: order.id } });
    expect(pago?.status).toBe(PaymentStatus.CONFIRMED);
    const pedidoActualizado = await prisma.order.findUnique({ where: { id: order.id } });
    expect(pedidoActualizado?.status).toBe(OrderStatus.PAID);

    const auditoria = await prisma.auditLog.findFirst({
      where: { orderId: order.id, action: "pago.notificarDebito" },
    });
    expect(auditoria).not.toBeNull();
    expect(auditoria?.customerId).toBeNull();
  });
});
