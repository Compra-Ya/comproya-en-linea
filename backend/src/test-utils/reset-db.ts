import { PrismaClient } from "@prisma/client";

// Vacía todas las tablas transaccionales entre pruebas, en el orden que
// respeta las llaves foráneas, para que cada prueba parta de una base de
// datos real y limpia (CLAUDE.md: nada de mocks en memoria).
export async function resetDb(prisma: PrismaClient) {
  await prisma.$transaction([
    prisma.couponRedemption.deleteMany(),
    prisma.orderStatusHistory.deleteMany(),
    prisma.unitsReservation.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.loyaltyCoupon.deleteMany(),
    prisma.complementaryProduct.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.behaviorEvent.deleteMany(),
    prisma.deletionRequest.deleteMany(),
    prisma.consent.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.availability.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.branch.deleteMany(),
  ]);
}
