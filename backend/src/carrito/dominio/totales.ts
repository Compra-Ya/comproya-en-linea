import { MAX_UNIDADES_POR_PRODUCTO } from "../../comun/limites";

interface ItemConPrecio {
  quantity: number;
  product: { digitalPrice: unknown };
}

const aCentavos = (n: number) => Math.round(n * 100) / 100;

/**
 * Agrega al carrito los totales que calcula el servidor (la interfaz no recalcula): total de cada línea,
 * subtotal, unidades y el máximo de unidades por producto.
 */
export type ConTotales<T extends { items: ItemConPrecio[] }> = Omit<T, "items"> & {
  items: Array<T["items"][number] & { lineTotal: number }>;
  subtotal: number;
  unidades: number;
  maxPorProducto: number;
};

export function conTotales<T extends { items: ItemConPrecio[] }>(carrito: T): ConTotales<T> {
  const items = carrito.items.map((item) => ({
    ...item,
    lineTotal: aCentavos(Number(item.product.digitalPrice) * item.quantity),
  }));
  return {
    ...carrito,
    items,
    subtotal: aCentavos(items.reduce((acc, i) => acc + i.lineTotal, 0)),
    unidades: items.reduce((acc, i) => acc + i.quantity, 0),
    maxPorProducto: MAX_UNIDADES_POR_PRODUCTO,
  };
}
