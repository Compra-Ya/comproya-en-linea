import { Test } from "@nestjs/testing";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { resetDb } from "../../test-utils/reset-db";
import { CatalogoService } from "../../catalogo/catalogo.service";
import { AdaptadorErpSimulado } from "../../catalogo/puertos/adaptador-erp-simulado";
import { CarritoService } from "../../carrito/carrito.service";
import { PedidoService } from "../../pedido/pedido.service";
import { PagoService } from "../pago.service";
import { AdaptadorStripe } from "../puertos/adaptador-stripe";
import { OrquestadorDePago } from "./orquestador-de-pago";
import { GeneradorDeComprobante } from "./generador-de-comprobante";
import { Token } from "./token";

describe("OrquestadorDePago (PR-07, PR-08, PI-05)", () => {
  let prisma: PrismaService;
  let carrito: CarritoService;
  let pedido: PedidoService;
  let orquestador: OrquestadorDePago;
  let generadorComprobante: GeneradorDeComprobante;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PagoService,
        PedidoService,
        CarritoService,
        CatalogoService,
        AdaptadorErpSimulado,
        PrismaService,
        OrquestadorDePago,
        GeneradorDeComprobante,
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
    carrito = moduleRef.get(CarritoService);
    pedido = moduleRef.get(PedidoService);
    orquestador = moduleRef.get(OrquestadorDePago);
    generadorComprobante = moduleRef.get(GeneradorDeComprobante);
  });

  beforeEach(async () => resetDb(prisma));
  afterAll(async () => prisma.$disconnect());

  async function crearPedidoConfirmado() {
    const category = await prisma.category.create({ data: { name: "Cat" } });
    const product = await prisma.product.create({
      data: { homologatedCode: "OP-000001", name: "P", categoryId: category.id, cost: 10, digitalPrice: 20 },
    });
    const branch = await prisma.branch.create({ data: { name: "Sucursal", city: "Bogotá" } });
    await prisma.availability.create({
      data: { productId: product.id, branchId: branch.id, erpUnits: 20, safetyThreshold: 5, reservedUnits: 0, syncedAt: new Date() },
    });
    const customer = await prisma.customer.create({
      data: { document: "OP1", name: "Cliente", email: "op1@test.com", passwordHash: "x" },
    });
    await carrito.agregarItem(customer.id, null, { productId: product.id, quantity: 2 });
    const order = await pedido.confirmar(customer.id, { branchId: branch.id });
    return { order, customer, product };
  }

  it("PR-07: reserva exitosa, autorización rechazada -> Pago.estado fallido, reserva liberada, sin comprobante", async () => {
    const { order, customer, product } = await crearPedidoConfirmado();

    const pago = await orquestador.procesarPago(customer.id, order.id, "tarjeta", {
      type: "payment_intent.payment_failed",
      data: { object: { metadata: { orderId: String(order.id) } } },
    } as any);

    expect(pago.status).toBe(PaymentStatus.FAILED);
    const ordenActualizada = await prisma.order.findUnique({ where: { id: order.id } });
    expect(ordenActualizada?.status).toBe(OrderStatus.PAYMENT_FAILED);
    const disponibilidad = await prisma.availability.findFirst({ where: { productId: product.id } });
    expect(disponibilidad?.reservedUnits).toBe(0); // reserva liberada

    await expect(generadorComprobante.generar(customer.id, order.id)).rejects.toThrow(/no está disponible/);
  });

  it("PR-08 / PI-05: reserva exitosa, autorización aprobada -> Comprobante con código de retiro y Pago vinculado 1:1 con Token", async () => {
    const { order, customer } = await crearPedidoConfirmado();

    const pago = await orquestador.procesarPago(customer.id, order.id, "tarjeta", {
      type: "checkout.session.completed",
      data: { object: { metadata: { orderId: String(order.id) }, payment_intent: "pi_test_falso", id: "cs_test_falso" } },
    } as any);

    expect(pago.status).toBe(PaymentStatus.CONFIRMED);
    const ordenActualizada = await prisma.order.findUnique({ where: { id: order.id } });
    expect(ordenActualizada?.status).toBe(OrderStatus.PAID); // PI-05: Pedido.estado actualizado

    const paymentEnBd = await prisma.payment.findUnique({ where: { orderId: order.id } });
    const token = new Token(paymentEnBd!.gatewayToken);
    expect(token.gatewayToken).toBe("pi_test_falso"); // Payment 1:1 con Token (orderId único)

    const comprobante = await generadorComprobante.generar(customer.id, order.id);
    expect(comprobante.pickupCode).toBe(order.pickupCode);
    expect(comprobante.vigente(new Date())).toBe(true); // RN-08: válido por 5 días
  });
});
