import { faker } from "@faker-js/faker";
import type { OrderSeed, OrderStatus } from "./types";

const PICKUP_CODE_VALID_DAYS = 5; // RN-08

export function buildPickupCode(): string {
  const part1 = faker.string.alphanumeric(3).toUpperCase();
  const part2 = faker.string.alphanumeric(4).toUpperCase();
  return `${part1}-${part2}`;
}

export function buildCorrelationId(): string {
  return `COR-${faker.string.alphanumeric(6).toUpperCase()}`;
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function historyFor(status: OrderStatus, createdAt: Date): { status: OrderStatus; occurredAt: Date }[] {
  const order: OrderStatus[] = ["CREATED", "PAID", "PREPARING", "READY_FOR_PICKUP", "DELIVERED"];
  const upTo = order.indexOf(status);
  if (upTo === -1) {
    // CANCELLED o PAYMENT_FAILED: solo el estado inicial + el final.
    return [
      { status: "CREATED", occurredAt: createdAt },
      { status, occurredAt: new Date(createdAt.getTime() + 10 * 60_000) },
    ];
  }
  return order.slice(0, upTo + 1).map((s, i) => ({
    status: s,
    occurredAt: new Date(createdAt.getTime() + i * 20 * 60_000),
  }));
}

interface OrderRefs {
  customerDocument: string;
  branchName: string;
  items: { productHomologatedCode: string; quantity: number; unitPrice: number }[];
}

/**
 * Escenarios fijos que los mockups necesitan poder mostrar con datos reales:
 * un pedido en riesgo (C-13, > 4 horas hábiles sin avanzar, para P-14), uno
 * en alistamiento (P-12), dos cancelables antes de alistar (RN-09, para
 * P-13) y uno ya entregado con comprobante completo (P-17).
 */
function fixedScenarios(refs: OrderRefs[]): OrderSeed[] {
  const scenarios: { status: OrderStatus; createdHoursAgo: number }[] = [
    { status: "PREPARING", createdHoursAgo: 6 }, // en riesgo: > 4h sin avanzar
    { status: "PREPARING", createdHoursAgo: 1 }, // alistamiento normal, no en riesgo
    { status: "PAID", createdHoursAgo: 0.5 }, // cancelable
    { status: "CREATED", createdHoursAgo: 0.1 }, // cancelable
    { status: "DELIVERED", createdHoursAgo: 30 },
    { status: "PAYMENT_FAILED", createdHoursAgo: 2 },
  ];

  return scenarios.map((scenario, i) => {
    const ref = refs[i % refs.length];
    const createdAt = hoursAgo(scenario.createdHoursAgo);
    return buildOrder(ref, scenario.status, createdAt);
  });
}

function buildOrder(ref: OrderRefs, status: OrderStatus, createdAt: Date): OrderSeed {
  return {
    customerDocument: ref.customerDocument,
    branchName: ref.branchName,
    status,
    committedAt: new Date(createdAt.getTime() + 4 * 60 * 60_000),
    pickupCode: buildPickupCode(),
    pickupCodeExpiresAt: new Date(createdAt.getTime() + PICKUP_CODE_VALID_DAYS * 24 * 60 * 60_000),
    correlationId: buildCorrelationId(),
    createdAt,
    statusHistory: historyFor(status, createdAt),
    items: ref.items,
  };
}

/**
 * Genera pedidos de prueba: primero los escenarios fijos que necesitan los
 * mockups (ver `fixedScenarios`), luego `extraCount` pedidos adicionales con
 * estados y antigüedad aleatorios, para tener volumen.
 */
export function generateOrders(
  customerDocuments: string[],
  branchNames: string[],
  productCodes: string[],
  extraCount = 20
): OrderSeed[] {
  const buildRef = (): OrderRefs => ({
    customerDocument: faker.helpers.arrayElement(customerDocuments),
    branchName: faker.helpers.arrayElement(branchNames),
    items: faker.helpers
      .arrayElements(productCodes, Math.min(3, productCodes.length))
      .map((code) => ({
        productHomologatedCode: code,
        quantity: 1 + Math.floor(Math.random() * 2),
        unitPrice: Number(faker.commerce.price({ min: 8000, max: 2000000, dec: 0 })),
      })),
  });

  const fixedRefs = Array.from({ length: 6 }, buildRef);
  const orders = fixedScenarios(fixedRefs);

  const allStatuses: OrderStatus[] = [
    "CREATED", "PAID", "PREPARING", "READY_FOR_PICKUP", "DELIVERED", "CANCELLED", "PAYMENT_FAILED",
  ];
  for (let i = 0; i < extraCount; i++) {
    const status = faker.helpers.arrayElement(allStatuses);
    const createdAt = hoursAgo(faker.number.int({ min: 0, max: 72 }));
    orders.push(buildOrder(buildRef(), status, createdAt));
  }

  return orders;
}
