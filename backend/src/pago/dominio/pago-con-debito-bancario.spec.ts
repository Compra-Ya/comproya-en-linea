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

describe("PagoConDebitoBancario (PR-09)", () => {
  let prisma: PrismaService;
  let carrito: CarritoService;
  let pedido: PedidoService;
  let orquestador: OrquestadorDePago;

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
        { provide: AdaptadorStripe, useValue: {} },
      ],
    }).compile();
    prisma = moduleRef.get(PrismaService);
    carrito = moduleRef.get(CarritoService);
    pedido = moduleRef.get(PedidoService);
    orquestador = moduleRef.get(OrquestadorDePago);
  });

  beforeEach(async () => resetDb(prisma));
  afterAll(async () => prisma.$disconnect());

  it("PR-09: reserva exitosa, débito bancario sin confirmación pasados 30 minutos -> fallido, pedido cancelado, reserva liberada", async () => {
    const category = await prisma.category.create({ data: { name: "Cat" } });
    const product = await prisma.product.create({
      data: { homologatedCode: "PCD-000001", name: "P", categoryId: category.id, cost: 10, digitalPrice: 20 },
    });
    const branch = await prisma.branch.create({ data: { name: "Sucursal", city: "Bogotá" } });
    await prisma.availability.create({
      data: { productId: product.id, branchId: branch.id, erpUnits: 20, safetyThreshold: 5, reservedUnits: 0, syncedAt: new Date() },
    });
    const customer = await prisma.customer.create({
      data: { document: "PCD1", name: "Cliente", email: "pcd1@test.com", passwordHash: "x" },
    });
    await carrito.agregarItem(customer.id, null, { productId: product.id, quantity: 1 });
    const order = await pedido.confirmar(customer.id, { branchId: branch.id });

    const pagoConDebito = orquestador.crearPagoConDebito(order.id);
    await pagoConDebito.procesar(customer.id);

    // Sin confirmación pasados 30 minutos — se simula el paso del tiempo
    // manipulando `createdAt` directamente, nunca esperando de verdad.
    await prisma.payment.update({
      where: { orderId: order.id },
      data: { createdAt: new Date(Date.now() - 31 * 60 * 1000) },
    });

    const confirmado = await pagoConDebito.esperarConfirmacion(new Date());

    expect(confirmado).toBe(false);
    const paymentEnBd = await prisma.payment.findUnique({ where: { orderId: order.id } });
    expect(paymentEnBd?.status).toBe(PaymentStatus.FAILED);
    const ordenActualizada = await prisma.order.findUnique({ where: { id: order.id } });
    expect(ordenActualizada?.status).toBe(OrderStatus.CANCELLED);
    const disponibilidad = await prisma.availability.findFirst({ where: { productId: product.id } });
    expect(disponibilidad?.reservedUnits).toBe(0);
  });

  it("esperarConfirmacion() dentro del plazo, sin confirmar todavía, devuelve falso pero no cancela el pedido", async () => {
    const category = await prisma.category.create({ data: { name: "Cat2" } });
    const product = await prisma.product.create({
      data: { homologatedCode: "PCD-000002", name: "P2", categoryId: category.id, cost: 10, digitalPrice: 20 },
    });
    const branch = await prisma.branch.create({ data: { name: "Sucursal2", city: "Bogotá" } });
    await prisma.availability.create({
      data: { productId: product.id, branchId: branch.id, erpUnits: 20, safetyThreshold: 5, reservedUnits: 0, syncedAt: new Date() },
    });
    const customer = await prisma.customer.create({
      data: { document: "PCD2", name: "Cliente2", email: "pcd2@test.com", passwordHash: "x" },
    });
    await carrito.agregarItem(customer.id, null, { productId: product.id, quantity: 1 });
    const order = await pedido.confirmar(customer.id, { branchId: branch.id });

    const pagoConDebito = orquestador.crearPagoConDebito(order.id);
    await pagoConDebito.procesar(customer.id);

    const confirmado = await pagoConDebito.esperarConfirmacion(new Date());

    expect(confirmado).toBe(false);
    const ordenActualizada = await prisma.order.findUnique({ where: { id: order.id } });
    expect(ordenActualizada?.status).toBe(OrderStatus.CREATED); // todavía no vence el plazo
  });
});
