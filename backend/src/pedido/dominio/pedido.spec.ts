import { OrderStatus } from "@prisma/client";
import { Pedido } from "./pedido";
import { ESTADOS_DE_VENTA } from "./ventas";

// Pruebas de ruta del sprint 2 (sin base de datos): reglas de estado del Pedido que usan CU-10 (cancelación) y CU-09 (ventas).
function pedidoEn(status: OrderStatus): Pedido {
  return new Pedido(1, status, "ABC123", new Date("2026-11-30T00:00:00-05:00"), []);
}

describe("Pedido.puedeCancelarse (RN-07: solo mientras no se haya pagado)", () => {
  it.each([OrderStatus.CREATED, OrderStatus.PAYMENT_FAILED])("%s se puede cancelar", (estado) => {
    expect(pedidoEn(estado).puedeCancelarse()).toBe(true);
  });

  it.each([
    OrderStatus.PAID,
    OrderStatus.PREPARING,
    OrderStatus.READY_FOR_PICKUP,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ])("%s no se puede cancelar", (estado) => {
    expect(pedidoEn(estado).puedeCancelarse()).toBe(false);
  });

  it("cubre los 7 estados del pedido: ninguno queda sin decidir", () => {
    const decididos = [
      OrderStatus.CREATED,
      OrderStatus.PAYMENT_FAILED,
      OrderStatus.PAID,
      OrderStatus.PREPARING,
      OrderStatus.READY_FOR_PICKUP,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
    ];
    expect(new Set(decididos)).toEqual(new Set(Object.values(OrderStatus)));
  });
});

describe("ESTADOS_DE_VENTA (REQ-016: venta = pedido pagado que sigue vigente)", () => {
  it("incluye Pagado y los estados posteriores al pago", () => {
    expect([...ESTADOS_DE_VENTA]).toEqual([
      OrderStatus.PAID,
      OrderStatus.PREPARING,
      OrderStatus.READY_FOR_PICKUP,
      OrderStatus.DELIVERED,
    ]);
  });

  it("excluye Creado, Pago fallido y Cancelado", () => {
    for (const estado of [OrderStatus.CREATED, OrderStatus.PAYMENT_FAILED, OrderStatus.CANCELLED]) {
      expect(ESTADOS_DE_VENTA).not.toContain(estado);
    }
  });

  it("un pedido que puede cancelarse nunca cuenta como venta", () => {
    for (const estado of Object.values(OrderStatus)) {
      if (pedidoEn(estado).puedeCancelarse()) expect(ESTADOS_DE_VENTA).not.toContain(estado);
    }
  });
});
