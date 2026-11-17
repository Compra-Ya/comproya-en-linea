import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import request from "supertest";
import { OrderStatus, StaffRole } from "@prisma/client";
import { PrismaModule } from "../prisma/prisma.module";
import { PrismaService } from "../prisma/prisma.service";
import { resetDb } from "../test-utils/reset-db";
import { AuthModule } from "../auth/auth.module";
import { PedidoModule } from "./pedido.module";

// REQ-016: la lista de ventas del Coordinador de Canal Digital — solo pedidos con pago confirmado y vigentes, filtrable
// por fecha (días de Colombia) y estado, con el total vendido calculado con la misma fórmula del cobro.
describe("Consulta de ventas (REQ-016)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let tokenInterno: string;
  let tokenCliente: string;
  let branchId: number;
  let productId: number;
  let customerId: number;
  let contador = 0;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [PrismaModule, AuthModule, PedidoModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();
    prisma = moduleRef.get(PrismaService);
    jwt = moduleRef.get(JwtService);
  });

  beforeEach(async () => {
    await resetDb(prisma);
    contador = 0;
    const category = await prisma.category.create({ data: { name: "Cat-VENTAS" } });
    const product = await prisma.product.create({
      data: { homologatedCode: "HC-VENTAS", name: "Licuadora", categoryId: category.id, cost: 50, digitalPrice: 100 },
    });
    const branch = await prisma.branch.create({ data: { name: "ComproYa", city: "Bogotá" } });
    const customer = await prisma.customer.create({
      data: { document: "CC-VENTAS", name: "Ana Pérez", email: "ana@prueba.local", passwordHash: "x" },
    });
    const staff = await prisma.staffUser.create({
      data: { email: "coordinador@prueba.local", name: "Coordinador", passwordHash: "x", role: StaffRole.CHANNEL_COORDINATOR },
    });
    productId = product.id;
    branchId = branch.id;
    customerId = customer.id;
    tokenInterno = jwt.sign({ sub: staff.id, email: staff.email, tipo: "staff", rol: staff.role });
    tokenCliente = jwt.sign({ sub: customer.id, email: customer.email });
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  async function crearPedido(opciones: { estado: OrderStatus; creado: string; cantidad?: number; precio?: number; cupon?: number; envio?: boolean }) {
    contador += 1;
    const pedido = await prisma.order.create({
      data: {
        customerId,
        branchId,
        status: opciones.estado,
        committedAt: new Date(opciones.creado),
        createdAt: new Date(opciones.creado),
        pickupCode: `RET-V${contador}`,
        pickupCodeExpiresAt: new Date("2027-01-01T00:00:00Z"),
        correlationId: `corr-ventas-${contador}`,
        ...(opciones.envio
          ? {
              deliveryMode: "SHIPPING" as const,
              shippingName: "Ana Pérez",
              shippingPhone: "300 123 4567",
              shippingAddress: "Calle 10 # 5-20",
              shippingCity: "Bogotá",
              shippingNotes: "Portería",
            }
          : {}),
        items: { create: [{ productId, quantity: opciones.cantidad ?? 2, unitPrice: opciones.precio ?? 100 }] },
      },
    });
    if (opciones.cupon) {
      const cupon = await prisma.loyaltyCoupon.upsert({
        where: { code: `DESC${opciones.cupon}` },
        update: {},
        create: { code: `DESC${opciones.cupon}`, percentage: opciones.cupon },
      });
      await prisma.couponRedemption.create({ data: { couponId: cupon.id, orderId: pedido.id } });
    }
    return pedido;
  }

  const consultar = (query = "", token = tokenInterno) =>
    request(app.getHttpServer()).get(`/ventas${query}`).set("Authorization", `Bearer ${token}`);

  it("sin sesión -> 401; con la sesión de un cliente -> 401", async () => {
    await request(app.getHttpServer()).get("/ventas").expect(401);
    await consultar("", tokenCliente).expect(401);
  });

  it("solo cuenta pedidos pagados y vigentes: no aparecen los creados, los cancelados ni los de pago fallido", async () => {
    await crearPedido({ estado: OrderStatus.PAID, creado: "2026-10-10T15:00:00-05:00" });
    await crearPedido({ estado: OrderStatus.DELIVERED, creado: "2026-10-11T15:00:00-05:00" });
    await crearPedido({ estado: OrderStatus.CREATED, creado: "2026-10-11T16:00:00-05:00" });
    await crearPedido({ estado: OrderStatus.CANCELLED, creado: "2026-10-11T17:00:00-05:00" });
    await crearPedido({ estado: OrderStatus.PAYMENT_FAILED, creado: "2026-10-11T18:00:00-05:00" });
    const res = await consultar().expect(200);
    expect(res.body.total).toBe(2);
    expect(res.body.items.map((v: { estado: string }) => v.estado).sort()).toEqual(["DELIVERED", "PAID"]);
  });

  it("el total vendido suma los totales reales de todo el filtro, con el descuento del código incluido", async () => {
    await crearPedido({ estado: OrderStatus.PAID, creado: "2026-10-10T15:00:00-05:00", cantidad: 2, precio: 100 }); // 200
    await crearPedido({ estado: OrderStatus.DELIVERED, creado: "2026-10-12T15:00:00-05:00", cantidad: 3, precio: 100, cupon: 10 }); // 300 - 10 % = 270
    const res = await consultar().expect(200);
    expect(res.body.totalVendido).toBe(470);
    const conCupon = res.body.items.find((v: { codigoCupon: string | null }) => v.codigoCupon === "DESC10");
    expect(conCupon).toMatchObject({ subtotal: 300, descuento: 30, total: 270, unidades: 3 });
  });

  it("filtra por fecha en días de Colombia: una venta de las 11:30 p. m. del 12 sigue siendo del 12", async () => {
    await crearPedido({ estado: OrderStatus.PAID, creado: "2026-10-11T23:59:00-05:00" });
    const tarde = await crearPedido({ estado: OrderStatus.PAID, creado: "2026-10-12T23:30:00-05:00" }); // ya es 13 en UTC
    await crearPedido({ estado: OrderStatus.PAID, creado: "2026-10-13T00:01:00-05:00" });
    const res = await consultar("?desde=2026-10-12&hasta=2026-10-12").expect(200);
    expect(res.body.items.map((v: { id: number }) => v.id)).toEqual([tarde.id]);
    expect(res.body.totalVendido).toBe(200);
  });

  it("filtra por estado, y rechaza un estado que no es de venta", async () => {
    await crearPedido({ estado: OrderStatus.PAID, creado: "2026-10-10T15:00:00-05:00" });
    await crearPedido({ estado: OrderStatus.DELIVERED, creado: "2026-10-10T16:00:00-05:00" });
    const res = await consultar("?estado=DELIVERED").expect(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].estado).toBe("DELIVERED");
    await consultar("?estado=CREATED").expect(400);
  });

  it("rechaza fechas inventadas o invertidas con un mensaje", async () => {
    const inexistente = await consultar("?desde=2026-02-31").expect(400);
    expect(inexistente.body.message).toMatch(/fechas reales/);
    const invertida = await consultar("?desde=2026-10-13&hasta=2026-10-12").expect(400);
    expect(invertida.body.message).toMatch(/no puede ser posterior/);
    await consultar("?desde=12/10/2026").expect(400);
  });

  it("pagina de a 20, la más reciente primero, y el total vendido cubre todas las páginas", async () => {
    for (let i = 0; i < 25; i++) {
      await crearPedido({ estado: OrderStatus.PAID, creado: `2026-10-${String(i + 1).padStart(2, "0")}T12:00:00-05:00`, cantidad: 1 });
    }
    const primera = await consultar().expect(200);
    expect(primera.body.items).toHaveLength(20);
    expect(primera.body.total).toBe(25);
    expect(primera.body.totalVendido).toBe(2500);
    const fechas = primera.body.items.map((v: { fecha: string }) => v.fecha);
    expect([...fechas].sort().reverse()).toEqual(fechas);
    const segunda = await consultar("?page=2").expect(200);
    expect(segunda.body.items).toHaveLength(5);
  });

  it("muestra productos, cliente y datos de envío para despachar; sin dirección si el pedido es de retiro", async () => {
    await crearPedido({ estado: OrderStatus.PAID, creado: "2026-10-10T15:00:00-05:00", envio: true });
    await crearPedido({ estado: OrderStatus.PAID, creado: "2026-10-09T15:00:00-05:00" });
    const res = await consultar().expect(200);
    const [conEnvio, sinEnvio] = res.body.items;
    expect(conEnvio.cliente).toEqual({ id: customerId, nombre: "Ana Pérez" });
    expect(conEnvio.productos).toEqual([{ nombre: "Licuadora", cantidad: 2 }]);
    expect(conEnvio.envio).toEqual({
      nombre: "Ana Pérez",
      telefono: "300 123 4567",
      direccion: "Calle 10 # 5-20",
      ciudad: "Bogotá",
      notas: "Portería",
    });
    expect(sinEnvio.envio).toBeNull();
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|ana@prueba/);
  });
});
