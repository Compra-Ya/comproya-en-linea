import { Test } from "@nestjs/testing";
import { OrderStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { resetDb } from "../test-utils/reset-db";
import { CatalogoService } from "../catalogo/catalogo.service";
import { AdaptadorErpSimulado } from "../catalogo/puertos/adaptador-erp-simulado";
import { CarritoService } from "../carrito/carrito.service";
import { PedidoService } from "./pedido.service";

describe("PedidoService (RN-05, RN-07, RN-08, RN-09)", () => {
  let prisma: PrismaService;
  let pedido: PedidoService;
  let carrito: CarritoService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [PedidoService, CarritoService, CatalogoService, AdaptadorErpSimulado, PrismaService],
    }).compile();
    prisma = moduleRef.get(PrismaService);
    pedido = moduleRef.get(PedidoService);
    carrito = moduleRef.get(CarritoService);
  });

  beforeEach(async () => resetDb(prisma));
  afterAll(async () => prisma.$disconnect());

  async function crearProductoConDisponibilidad(erpUnits: number) {
    const category = await prisma.category.create({ data: { name: "Cat" } });
    const product = await prisma.product.create({
      data: { homologatedCode: "ABC-000001", name: "P", categoryId: category.id, cost: 10, digitalPrice: 20 },
    });
    const branch = await prisma.branch.create({ data: { name: "Sucursal", city: "Bogotá" } });
    await prisma.availability.create({
      data: { productId: product.id, branchId: branch.id, erpUnits, safetyThreshold: 5, reservedUnits: 0, syncedAt: new Date() },
    });
    const customer = await prisma.customer.create({
      data: { document: "CC1", name: "Cliente", email: "c1@test.com", passwordHash: "x" },
    });
    return { product, branch, customer };
  }

  it("RN-05: confirmar el pedido reserva las unidades en el ERP antes de que exista la posibilidad de cobrar", async () => {
    const { product, branch, customer } = await crearProductoConDisponibilidad(20);
    await carrito.agregarItem(customer.id, null, { productId: product.id, quantity: 3 });

    const order = await pedido.confirmar(customer.id, { branchId: branch.id });

    expect(order.status).toBe(OrderStatus.CREATED);
    const disponibilidad = await prisma.availability.findFirst({ where: { productId: product.id } });
    expect(disponibilidad?.reservedUnits).toBe(3);
    const reserva = await prisma.unitsReservation.findFirst({ where: { orderId: order.id } });
    expect(reserva).not.toBeNull();
  });

  it("RN-05: si no hay unidades suficientes, no se crea el pedido ni se cobra reserva alguna", async () => {
    const { product, branch, customer } = await crearProductoConDisponibilidad(5); // 5 - 5 (umbral) = 0 disponibles.
    await carrito.agregarItem(customer.id, null, { productId: product.id, quantity: 1 });

    await expect(pedido.confirmar(customer.id, { branchId: branch.id })).rejects.toThrow(/disponibles/);
    const ordenes = await prisma.order.findMany({ where: { customerId: customer.id } });
    expect(ordenes).toHaveLength(0);
  });

  it("RN-08: el código de retiro es único y vence a los 5 días calendario", async () => {
    const { product, branch, customer } = await crearProductoConDisponibilidad(20);
    await carrito.agregarItem(customer.id, null, { productId: product.id, quantity: 1 });
    const antes = Date.now();

    const order = await pedido.confirmar(customer.id, { branchId: branch.id });

    expect(order.pickupCode).toMatch(/^RET-/);
    const cincoDiasMs = 5 * 24 * 60 * 60 * 1000;
    const vencimiento = new Date(order.pickupCodeExpiresAt).getTime();
    expect(vencimiento).toBeGreaterThanOrEqual(antes + cincoDiasMs - 5000);
    expect(vencimiento).toBeLessThanOrEqual(antes + cincoDiasMs + 5000);

    // Único por construcción: el segundo pedido no puede repetir el código.
    await carrito.agregarItem(customer.id, null, { productId: product.id, quantity: 1 });
    const segundo = await pedido.confirmar(customer.id, { branchId: branch.id });
    expect(segundo.pickupCode).not.toBe(order.pickupCode);
  });

  it("RN-07: un cupón de lealtad no puede redimirse dos veces sobre el mismo pedido", async () => {
    const { product, branch, customer } = await crearProductoConDisponibilidad(20);
    await prisma.loyaltyCoupon.create({ data: { code: "DESC10", percentage: 10, active: true } });
    await carrito.agregarItem(customer.id, null, { productId: product.id, quantity: 1 });

    const order = await pedido.confirmar(customer.id, { branchId: branch.id, couponCode: "DESC10" });
    const redenciones = await prisma.couponRedemption.findMany({ where: { orderId: order.id } });
    expect(redenciones).toHaveLength(1);

    // Reintentar redimir el mismo cupón sobre el mismo pedido debe chocar con
    // la restricción única de `couponRedemption.orderId` (RN-07).
    await expect(
      prisma.couponRedemption.create({ data: { couponId: redenciones[0].couponId, orderId: order.id } }),
    ).rejects.toThrow();
  });

  it("RN-09: el modelo de pedido incluye el estado cancelado y no lo alcanza automáticamente tras confirmar", async () => {
    // RN-09 solo se modela en esta entrega (CU-13 de cancelación es sprint 6,
    // fuera de alcance) — se verifica que el estado existe y que un pedido
    // recién confirmado queda en CREATED, nunca CANCELLED.
    expect(Object.values(OrderStatus)).toContain(OrderStatus.CANCELLED);
    const { product, branch, customer } = await crearProductoConDisponibilidad(20);
    await carrito.agregarItem(customer.id, null, { productId: product.id, quantity: 1 });
    const order = await pedido.confirmar(customer.id, { branchId: branch.id });
    expect(order.status).toBe(OrderStatus.CREATED);
  });
});
