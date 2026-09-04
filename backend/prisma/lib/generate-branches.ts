import type { AvailabilitySeed, BranchSeed } from "./types";

/**
 * Sucursales ficticias de la cadena de retail ComproYa. Fijas (no aleatorias)
 * para que la siembra sea reproducible. Son exactamente 8, la cifra oficial
 * de sucursales con ERP centralizado en el piloto (canon, sección 10) — no
 * agregar ni quitar sin actualizar esa cifra en el canon primero.
 */
export const BRANCHES: BranchSeed[] = [
  { name: "ComproYa Bogotá Centro", city: "Bogotá" },
  { name: "ComproYa Bogotá Norte", city: "Bogotá" },
  { name: "ComproYa Medellín", city: "Medellín" },
  { name: "ComproYa Cali", city: "Cali" },
  { name: "ComproYa Barranquilla", city: "Barranquilla" },
  { name: "ComproYa Bucaramanga", city: "Bucaramanga" },
  { name: "ComproYa Cartagena", city: "Cartagena" },
  { name: "ComproYa Pereira", city: "Pereira" },
];

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
