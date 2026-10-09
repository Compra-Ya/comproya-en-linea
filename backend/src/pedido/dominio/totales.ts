interface PedidoConPrecios {
  items: Array<{ unitPrice: unknown; quantity: number }>;
  couponRedemption?: { coupon: { code: string; percentage: unknown } } | null;
}

const aCentavos = (n: number) => Math.round(n * 100) / 100;

export interface Totales {
  subtotal: number;
  descuento: number;
  total: number;
  codigoCupon: string | null;
  porcentajeCupon: number | null;
}

/** Aplica un porcentaje de cupón a un subtotal (RN-07: una sola redención por pedido). */
export function aplicarCupon(subtotal: number, porcentaje: number) {
  const total = aCentavos(subtotal * (1 - porcentaje / 100));
  return { total, descuento: aCentavos(subtotal - total) };
}

/**
 * Totales de un pedido a partir de los precios congelados en sus líneas (unitPrice) y del cupón redimido,
 * si lo hay. Es la única fórmula del sistema: el cobro en la pasarela y lo que muestra la interfaz salen de aquí.
 */
export function calcularTotales(pedido: PedidoConPrecios): Totales {
  const subtotal = aCentavos(pedido.items.reduce((acc, i) => acc + Number(i.unitPrice) * i.quantity, 0));
  const cupon = pedido.couponRedemption?.coupon;
  if (!cupon) return { subtotal, descuento: 0, total: subtotal, codigoCupon: null, porcentajeCupon: null };
  const porcentaje = Number(cupon.percentage);
  return { subtotal, ...aplicarCupon(subtotal, porcentaje), codigoCupon: cupon.code, porcentajeCupon: porcentaje };
}
