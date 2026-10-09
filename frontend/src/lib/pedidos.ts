import type { OrderStatusKey } from "@/components/ui";
import type { EstadoPedido } from "./types";

/** Estado del servidor → estado del sistema de diseño. "Listo para retiro" no existe en la venta con envío. */
export function estadoDePedido(estado: EstadoPedido): OrderStatusKey {
  switch (estado) {
    case "CREATED":
      return "creado";
    case "PAID":
      return "pagado";
    case "PREPARING":
    case "READY_FOR_PICKUP":
      return "en-alistamiento";
    case "DELIVERED":
      return "entregado";
    case "CANCELLED":
      return "cancelado";
    case "PAYMENT_FAILED":
      return "pago-fallido";
  }
}

/** "8 de octubre de 2026" */
export function fechaLarga(iso: string): string {
  return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}

/** Primer nombre de una persona ("Duvan Serrano" → "Duvan"). */
export function primerNombre(nombre: string | undefined | null): string | undefined {
  return nombre?.trim().split(/\s+/)[0] || undefined;
}
