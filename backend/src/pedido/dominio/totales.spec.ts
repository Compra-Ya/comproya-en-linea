import { conTotales } from "../../carrito/dominio/totales";
import { aplicarCupon, calcularTotales } from "./totales";

describe("calcularTotales (totales del pedido, calculados por el servidor)", () => {
  const items = [
    { unitPrice: "1899900.00", quantity: 1 },
    { unitPrice: "179000.00", quantity: 2 },
  ];

  it("sin cupón: total = subtotal y sin descuento", () => {
    expect(calcularTotales({ items })).toEqual({ subtotal: 2257900, descuento: 0, total: 2257900, codigoCupon: null, porcentajeCupon: null });
  });

  it("RN-07: con cupón descuenta el porcentaje y devuelve código y porcentaje", () => {
    const t = calcularTotales({ items, couponRedemption: { coupon: { code: "LEALTAD10", percentage: "10.00" } } });
    expect(t).toEqual({ subtotal: 2257900, descuento: 225790, total: 2032110, codigoCupon: "LEALTAD10", porcentajeCupon: 10 });
  });

  it("subtotal = descuento + total (nunca se desfasa un centavo)", () => {
    const t = calcularTotales({ items: [{ unitPrice: "33333.33", quantity: 3 }], couponRedemption: { coupon: { code: "X", percentage: "7.00" } } });
    expect(Math.round((t.descuento + t.total) * 100) / 100).toBe(t.subtotal);
  });

  it("aplicarCupon usa la misma fórmula que el cobro en la pasarela", () => {
    expect(aplicarCupon(100000, 15)).toEqual({ total: 85000, descuento: 15000 });
  });
});

describe("conTotales (totales del carrito)", () => {
  it("agrega total por línea, subtotal, unidades y el máximo por producto", () => {
    const carrito = conTotales({
      id: 1,
      items: [
        { id: 1, quantity: 2, product: { digitalPrice: "179000.00" } },
        { id: 2, quantity: 1, product: { digitalPrice: "1899900.00" } },
      ],
    });
    expect(carrito.items.map((i) => i.lineTotal)).toEqual([358000, 1899900]);
    expect(carrito.subtotal).toBe(2257900);
    expect(carrito.unidades).toBe(3);
    expect(carrito.maxPorProducto).toBe(10);
  });

  it("un carrito vacío da cero", () => {
    expect(conTotales({ items: [] })).toMatchObject({ subtotal: 0, unidades: 0 });
  });
});
