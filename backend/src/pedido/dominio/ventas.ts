import { BadRequestException } from "@nestjs/common";
import { OrderStatus } from "@prisma/client";

// REQ-016: una venta es un pedido con pago confirmado que sigue vigente. Un pedido pagado y luego cancelado (RN-09)
// deja de contar: el reembolso no está definido en este alcance (docs/alcance), así que no se suma como vendido.
export const ESTADOS_DE_VENTA = [
  OrderStatus.PAID,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.DELIVERED,
] as const;

// Las fechas del filtro son días de Colombia (UTC−5, sin horario de verano), no días UTC: una venta de las 11 p. m. del
// 19 de octubre en Bogotá pertenece al 19, aunque en UTC ya sea el 20.
const OFFSET_COLOMBIA = "-05:00";

// «2026-02-31» no existe, pero Date lo acepta y lo corre a marzo: se comprueba aparte para rechazarlo.
function esFechaReal(fecha: string): boolean {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const d = new Date(Date.UTC(anio, mes - 1, dia));
  return d.getUTCFullYear() === anio && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
}

function inicioDeDia(fecha: string): Date {
  return new Date(`${fecha}T00:00:00.000${OFFSET_COLOMBIA}`);
}

function finDeDia(fecha: string): Date {
  return new Date(`${fecha}T23:59:59.999${OFFSET_COLOMBIA}`);
}

/** Rango [desde, hasta] inclusivo, en días de Colombia, a partir de fechas AAAA-MM-DD. Cualquiera de los dos extremos es opcional. */
export function rangoDeFechas(desde?: string, hasta?: string): { gte?: Date; lte?: Date } {
  const rango: { gte?: Date; lte?: Date } = {};
  if ((desde && !esFechaReal(desde)) || (hasta && !esFechaReal(hasta))) {
    throw new BadRequestException("Escribe fechas reales con el formato AAAA-MM-DD");
  }
  if (desde) rango.gte = inicioDeDia(desde);
  if (hasta) rango.lte = finDeDia(hasta);
  if (rango.gte && rango.lte && rango.gte > rango.lte) {
    throw new BadRequestException("La fecha inicial no puede ser posterior a la final");
  }
  return rango;
}
