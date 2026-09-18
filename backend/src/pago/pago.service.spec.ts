import { Test } from "@nestjs/testing";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { resetDb } from "../test-utils/reset-db";
import { CatalogoService } from "../catalogo/catalogo.service";
import { AdaptadorErpSimulado } from "../catalogo/puertos/adaptador-erp-simulado";
import { CarritoService } from "../carrito/carrito.service";
import { PedidoService } from "../pedido/pedido.service";
import { PagoService } from "./pago.service";
import { AdaptadorStripe } from "./puertos/adaptador-stripe";

// RN-06: en ninguna de estas pruebas entra ni sale un número de tarjeta —
// solo se ejercitan tokens. `AdaptadorStripe` se sustituye por un doble que
// nunca llama a la red de Stripe (no hay llaves reales en pruebas), pero
// respeta el mismo contrato (`PuertoPasarelaDePagos`).
const NUMERO_DE_TARJETA = /\b(?:\d[ -]*?){13,19}\b/;

describe("PagoService (RN-06, CU-15, CU-16, CU-17)", () => {
  let prisma: PrismaService;
  let pago: PagoService;
  let pedido: PedidoService;
  let carrito: CarritoService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PagoService,
        PedidoService,
        CarritoService,
        CatalogoService,
        AdaptadorErpSimulado,
        PrismaService,
        {
          provide: AdaptadorStripe,
          useValue: {
            crearCobroConTarjeta: jest.fn(async (orderId: number) => ({
              gatewayToken: `cs_test_falso_${orderId}`,
              redirectUrl: "https://checkout.stripe.com/test",
            })),
          },
        },
      ],
    }).compile();
    prisma = moduleRef.get(PrismaService);
    pago = moduleRef.get(PagoService);
    pedido = moduleRef.get(PedidoService);
    carrito = moduleRef.get(CarritoService);
  });

  beforeEach(async () => resetDb(prisma));
  afterAll(async () => prisma.$disconnect());

  async function crearPedidoConfirmado() {
    const category = await prisma.category.create({ data: { name: "Cat" } });
    const product = await prisma.product.create({
      data: { homologatedCode: "ABC-000001", name: "P", categoryId: category.id, cost: 10, digitalPrice: 20 },
    });
    const branch = await prisma.branch.create({ data: { name: "Sucursal", city: "Bogotá" } });
    await prisma.availability.create({
      data: { productId: product.id, branchId: branch.id, erpUnits: 20, safetyThreshold: 5, reservedUnits: 0, syncedAt: new Date() },
    });
    const customer = await prisma.customer.create({
      data: { document: "CC1", name: "Cliente", email: "c@test.com", passwordHash: "x" },
    });
    await carrito.agregarItem(customer.id, null, { productId: product.id, quantity: 2 });
    const order = await pedido.confirmar(customer.id, { branchId: branch.id });
    return { order, customer, product, branch };
  }

  it("RN-06: crear la sesión de tarjeta solo guarda el token de Stripe, nunca un número de tarjeta", async () => {
    const { order, customer } = await crearPedidoConfirmado();
    const { redirectUrl } = await pago.crearSesionTarjeta(customer.id, order.id);
    expect(redirectUrl).toContain("checkout.stripe.com");

    const payment = await prisma.payment.findUnique({ where: { orderId: order.id } });
    expect(payment?.gatewayToken).toBe(`cs_test_falso_${order.id}`);
    expect(NUMERO_DE_TARJETA.test(payment?.gatewayToken ?? "")).toBe(false);
  });

  it("PE-06 / CU-15/CU-17: el webhook checkout.session.completed confirma el pago (Creado -> Pagado) y habilita el comprobante", async () => {
    const { order, customer } = await crearPedidoConfirmado();
    await pago.crearSesionTarjeta(customer.id, order.id);

    await expect(pago.obtenerComprobante(customer.id, order.id)).rejects.toThrow(/no está disponible/);

    await pago.manejarEventoStripe({
      type: "checkout.session.completed",
      data: { object: { metadata: { orderId: String(order.id) }, payment_intent: "pi_test_falso", id: "cs_test_falso" } },
    } as any);

    const actualizado = await prisma.order.findUnique({ where: { id: order.id } });
    expect(actualizado?.status).toBe(OrderStatus.PAID);
    const comprobante = await pago.obtenerComprobante(customer.id, order.id);
    expect(comprobante.pickupCode).toBe(order.pickupCode);
  });

  it("CU-15 (E-2): checkout.session.expired marca el pago fallido y libera la reserva dentro de 15 minutos", async () => {
    const { order, customer, product } = await crearPedidoConfirmado();
    await pago.crearSesionTarjeta(customer.id, order.id);

    await pago.manejarEventoStripe({
      type: "checkout.session.expired",
      data: { object: { metadata: { orderId: String(order.id) } } },
    } as any);

    const actualizado = await prisma.order.findUnique({ where: { id: order.id } });
    expect(actualizado?.status).toBe(OrderStatus.PAYMENT_FAILED);
    const disponibilidad = await prisma.availability.findFirst({ where: { productId: product.id } });
    expect(disponibilidad?.reservedUnits).toBe(0); // Reserva liberada.
  });

  it("PE-08: autorización de pago rechazada (payment_intent.payment_failed) -> Pedido en Pago fallido", async () => {
    const { order, customer, product } = await crearPedidoConfirmado();
    await pago.crearSesionTarjeta(customer.id, order.id);

    await pago.manejarEventoStripe({
      type: "payment_intent.payment_failed",
      data: { object: { metadata: { orderId: String(order.id) } } },
    } as any);

    const actualizado = await prisma.order.findUnique({ where: { id: order.id } });
    expect(actualizado?.status).toBe(OrderStatus.PAYMENT_FAILED);
    const disponibilidad = await prisma.availability.findFirst({ where: { productId: product.id } });
    expect(disponibilidad?.reservedUnits).toBe(0);
  });

  it("CU-16: la notificación de débito bancario exitosa confirma el pago", async () => {
    const { order, customer } = await crearPedidoConfirmado();
    await pago.crearIntentoDebito(customer.id, order.id);
    await pago.notificarDebito(order.id, true);

    const actualizado = await prisma.order.findUnique({ where: { id: order.id } });
    expect(actualizado?.status).toBe(OrderStatus.PAID);
  });

  it("CU-16: sin confirmación (notificación negativa), el pedido se cancela y libera la reserva", async () => {
    const { order, customer, product } = await crearPedidoConfirmado();
    await pago.crearIntentoDebito(customer.id, order.id);
    await pago.notificarDebito(order.id, false);

    const actualizado = await prisma.order.findUnique({ where: { id: order.id } });
    expect(actualizado?.status).toBe(OrderStatus.CANCELLED);
    const disponibilidad = await prisma.availability.findFirst({ where: { productId: product.id } });
    expect(disponibilidad?.reservedUnits).toBe(0);
  });

  it("Job de red de seguridad: un pago con tarjeta pendiente hace más de 15 minutos se libera aunque no llegue el webhook", async () => {
    const { order, customer, product } = await crearPedidoConfirmado();
    await pago.crearSesionTarjeta(customer.id, order.id);
    await prisma.payment.update({
      where: { orderId: order.id },
      data: { createdAt: new Date(Date.now() - 16 * 60 * 1000) },
    });

    const liberados = await pago.liberarPagosVencidos();

    expect(liberados).toBe(1);
    const actualizado = await prisma.order.findUnique({ where: { id: order.id } });
    expect(actualizado?.status).toBe(OrderStatus.PAYMENT_FAILED);
    const disponibilidad = await prisma.availability.findFirst({ where: { productId: product.id } });
    expect(disponibilidad?.reservedUnits).toBe(0);
  });
});
