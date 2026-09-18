import { Test } from "@nestjs/testing";
import { OrderStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { resetDb } from "../test-utils/reset-db";
import { CatalogoService } from "../catalogo/catalogo.service";
import { AdaptadorErpSimulado } from "../catalogo/puertos/adaptador-erp-simulado";
import { CarritoService } from "../carrito/carrito.service";
import { PedidoService } from "./pedido.service";
import { Pedido } from "./dominio/pedido";

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

  it("PE-07: Creado + cancelar() antes de iniciar alistamiento (RN-09) -> Cancelado, reserva liberada", async () => {
    const { product, branch, customer } = await crearProductoConDisponibilidad(20);
    await carrito.agregarItem(customer.id, null, { productId: product.id, quantity: 2 });
    const order = await pedido.confirmar(customer.id, { branchId: branch.id });
    expect(Pedido.desde(order).puedeCancelarse()).toBe(true);

    const cancelado = await pedido.cancelar(order.id);

    expect(cancelado.status).toBe(OrderStatus.CANCELLED);
    const disponibilidad = await prisma.availability.findFirst({ where: { productId: product.id } });
    expect(disponibilidad?.reservedUnits).toBe(0);
  });

  it("RN-09: un pedido en alistamiento ya no puede cancelarse", async () => {
    const { product, branch, customer } = await crearProductoConDisponibilidad(20);
    await carrito.agregarItem(customer.id, null, { productId: product.id, quantity: 1 });
    const order = await pedido.confirmar(customer.id, { branchId: branch.id });
    await pedido.marcarEstado(order.id, OrderStatus.PAID);
    await pedido.iniciarAlistamiento(order.id);

    const enAlistamiento = await pedido.obtener(order.id);
    expect(Pedido.desde(enAlistamiento).puedeCancelarse()).toBe(false);
    await expect(pedido.cancelar(order.id)).rejects.toThrow(/RN-09/);
  });

  it("PE-09: En alistamiento + retiro en tienda -> Listo para retiro", async () => {
    const { product, branch, customer } = await crearProductoConDisponibilidad(20);
    await carrito.agregarItem(customer.id, null, { productId: product.id, quantity: 1 });
    const order = await pedido.confirmar(customer.id, { branchId: branch.id });
    await pedido.marcarEstado(order.id, OrderStatus.PAID);
    await pedido.iniciarAlistamiento(order.id);

    const listo = await pedido.marcarListoParaRetiro(order.id);

    expect(listo.status).toBe(OrderStatus.READY_FOR_PICKUP);
  });

  it("PE-10: Listo para retiro + retiro con código dentro de 5 días (RN-08) -> Entregado", async () => {
    const { product, branch, customer } = await crearProductoConDisponibilidad(20);
    await carrito.agregarItem(customer.id, null, { productId: product.id, quantity: 1 });
    const order = await pedido.confirmar(customer.id, { branchId: branch.id });
    await pedido.marcarEstado(order.id, OrderStatus.PAID);
    await pedido.iniciarAlistamiento(order.id);
    await pedido.marcarListoParaRetiro(order.id);

    const entregado = await pedido.retirarConCodigo(order.id, order.pickupCode, new Date());

    expect(entregado.status).toBe(OrderStatus.DELIVERED);
  });

  it("PE-10 (caso de frontera): código presentado después de 5 días -> se rechaza el retiro, no se completa la entrega", async () => {
    const { product, branch, customer } = await crearProductoConDisponibilidad(20);
    await carrito.agregarItem(customer.id, null, { productId: product.id, quantity: 1 });
    const order = await pedido.confirmar(customer.id, { branchId: branch.id });
    await pedido.marcarEstado(order.id, OrderStatus.PAID);
    await pedido.iniciarAlistamiento(order.id);
    await pedido.marcarListoParaRetiro(order.id);
    const seisDiasDespues = new Date(order.pickupCodeExpiresAt.getTime() + 24 * 60 * 60 * 1000);

    await expect(pedido.retirarConCodigo(order.id, order.pickupCode, seisDiasDespues)).rejects.toThrow(/venció/);

    const final = await pedido.obtener(order.id);
    expect(final.status).toBe(OrderStatus.READY_FOR_PICKUP); // no se completó la entrega
  });

  it("PI-04: confirmar() calcula el total y solicita las reservas correspondientes (Carrito y ReservaUnidades simulados)", async () => {
    const moduleAislado = await Test.createTestingModule({
      providers: [
        PedidoService,
        PrismaService,
        { provide: CarritoService, useValue: {} },
        { provide: CatalogoService, useValue: {} },
      ],
    }).compile();
    const prismaAislado = moduleAislado.get(PrismaService);
    const pedidoAislado = moduleAislado.get(PedidoService);
    const carritoSimulado = moduleAislado.get(CarritoService) as { obtenerOCrear?: jest.Mock };
    const catalogoSimulado = moduleAislado.get(CatalogoService) as { reservarUnidades?: jest.Mock };
    await resetDb(prismaAislado);
    const category = await prismaAislado.category.create({ data: { name: "CatPI04" } });
    const product = await prismaAislado.product.create({
      data: { homologatedCode: "PI04-000001", name: "P", categoryId: category.id, cost: 1000, digitalPrice: 15000 },
    });
    const branch = await prismaAislado.branch.create({ data: { name: "SucursalPI04", city: "Bogotá" } });
    // Fila real de Availability solo para que la FK de UnitsReservation sea
    // válida — la decisión de "hay unidades" la sigue tomando el simulado.
    const availability = await prismaAislado.availability.create({
      data: { productId: product.id, branchId: branch.id, erpUnits: 20, safetyThreshold: 5, reservedUnits: 0, syncedAt: new Date() },
    });
    const customer = await prismaAislado.customer.create({
      data: { document: "PI04-1", name: "Cliente", email: "pi04@test.com", passwordHash: "x" },
    });
    carritoSimulado.obtenerOCrear = jest.fn(async () => ({
      id: 1,
      items: [{ productId: product.id, quantity: 2, product: { digitalPrice: 15000 } }],
    }));
    catalogoSimulado.reservarUnidades = jest.fn(async () => availability.id); // ReservaUnidades simulada: siempre reserva con éxito.

    const order = await pedidoAislado.confirmar(customer.id, { branchId: branch.id });

    expect(catalogoSimulado.reservarUnidades).toHaveBeenCalledWith(product.id, branch.id, 2);
    const total = await pedidoAislado.calcularTotal(order.id);
    expect(total).toBe(30000); // 15000 * 2
    await prismaAislado.$disconnect();
  });
});
