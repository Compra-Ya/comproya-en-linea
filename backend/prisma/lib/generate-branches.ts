import type { AvailabilitySeed, BranchSeed } from "./types";

/**
 * La sucursal única de ComproYa (alcance reducido, docs/alcance, CHG-001): la tienda tiene un solo punto de venta y
 * una sola cifra de existencias por producto. El canon (sección 10) hablaba de 8 sucursales con ERP centralizado;
 * ese alcance se redujo y el esquema conserva Branch/Availability, pero la siembra crea una sola fila.
 * Para dejar una base ya sembrada con 8 sucursales en este estado: npm run sucursal-unica.
 */
export const BRANCHES: BranchSeed[] = [{ name: "ComproYa", city: "Bogotá" }];

/**
 * Genera una fila de disponibilidad por sucursal. RN-04: aproximadamente
 * 1 de cada 6 filas queda con una sincronización "vencida" (más de 15
 * minutos), a propósito, para poder probar esa regla contra datos reales.
 */
export function generateAvailability(): AvailabilitySeed {
  const erpUnits = Math.floor(Math.random() * 400);
  const safetyThreshold = 5 + Math.floor(Math.random() * 10);
  const reservedUnits = Math.floor(Math.random() * Math.min(20, erpUnits + 1));

  const staleSync = Math.random() < (1 / 6);
  const minutesSinceSync = staleSync
    ? 16 + Math.floor(Math.random() * 120) // entre 16 min y 2h - vencida
    : Math.floor(Math.random() * 15); // dentro de la ventana válida

  const syncedAt = new Date(Date.now() - minutesSinceSync * 60_000);

  return { erpUnits, safetyThreshold, reservedUnits, syncedAt };
}
