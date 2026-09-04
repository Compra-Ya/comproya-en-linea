import { faker } from "@faker-js/faker";
import type { LoyaltyCouponSeed, OrderSeed, PaymentSeed } from "./types";

const ORDER_STATUSES_WITH_PAYMENT: OrderSeed["status"][] = [
  "PAID", "PREPARING", "READY_FOR_PICKUP", "DELIVERED", "CANCELLED",
];

/**
 * Un pago por cada pedido que ya alcanzó a pagarse (RN-05: la reserva de
 * unidades ocurre antes de cobrar, así que un pedido `CREATED` todavía no
 * tiene fila de pago). RN-06: nunca se guarda número de tarjeta, solo un
 * token simulado de la pasarela.
 */
export function generatePayments(orders: OrderSeed[]): PaymentSeed[] {
  return orders
    .filter((o) => ORDER_STATUSES_WITH_PAYMENT.includes(o.status) || o.status === "PAYMENT_FAILED")
    .map((order) => {
      const method = faker.helpers.arrayElement<PaymentSeed["method"]>(["CARD", "BANK_DEBIT"]);
      const failed = order.status === "PAYMENT_FAILED";
      return {
        orderPickupCode: order.pickupCode,
        method,
        status: failed ? "FAILED" : "CONFIRMED",
        gatewayToken: `tok_${faker.string.alphanumeric(24)}`,
        confirmedAt: failed ? null : new Date(order.createdAt.getTime() + 60_000),
      };
    });
}

/**
 * Cupones de lealtad de prueba (C-07), para ejercitar RN-07 (redención
 * única por pedido) contra datos reales.
 */
export function generateLoyaltyCoupons(): LoyaltyCouponSeed[] {
  return [
    { code: "LEALTAD10", percentage: 10, active: true },
    { code: "LEALTAD15", percentage: 15, active: true },
    { code: "BIENVENIDA5", percentage: 5, active: true },
    { code: "PROMOVENCIDA20", percentage: 20, active: false },
  ];
}
