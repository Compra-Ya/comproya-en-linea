import { CouponRedemption, LoyaltyCoupon } from "@prisma/client";

type FilaCuponRedimido = CouponRedemption & { coupon: LoyaltyCoupon };

// Clase de diseño CuponRedimido (Plan_Pruebas_ComproYa.docx, Caso de Uso 2).
// Vista tipada sobre `CouponRedemption` — RN-07 (una sola redención por
// pedido) ya se refuerza con `@unique` en `orderId` (schema.prisma).
export class CuponRedimido {
  constructor(
    public readonly couponId: number,
    public readonly orderId: number,
    public readonly percentage: number,
  ) {}

  static desde(r: FilaCuponRedimido): CuponRedimido {
    return new CuponRedimido(r.couponId, r.orderId, Number(r.coupon.percentage));
  }
}
