import type { DisponibilidadSemilla, SucursalSemilla } from "./tipos";

/**
 * Sucursales ficticias de la cadena de retail ComproYa. Fijas (no aleatorias)
 * para que la siembra sea reproducible; ajusta la lista si tu equipo necesita
 * más o menos sucursales.
 */
export const SUCURSALES: SucursalSemilla[] = [
  { nombre: "ComproYa Bogotá Centro", ciudad: "Bogotá" },
  { nombre: "ComproYa Bogotá Norte", ciudad: "Bogotá" },
  { nombre: "ComproYa Medellín", ciudad: "Medellín" },
  { nombre: "ComproYa Cali", ciudad: "Cali" },
  { nombre: "ComproYa Barranquilla", ciudad: "Barranquilla" },
  { nombre: "ComproYa Bucaramanga", ciudad: "Bucaramanga" },
];

/**
 * Genera una fila de disponibilidad por sucursal. RN-04: aproximadamente
 * 1 de cada 6 filas queda con una sincronización "vencida" (más de 15
 * minutos), a propósito, para poder probar esa regla contra datos reales.
 */
export function generarDisponibilidad(): DisponibilidadSemilla {
  const existenciasErp = Math.floor(Math.random() * 400);
  const umbralSeguridad = 5 + Math.floor(Math.random() * 10);
  const unidadesReservadas = Math.floor(Math.random() * Math.min(20, existenciasErp + 1));

  const sincronizacionVencida = Math.random() < (1 / 6);
  const minutosDesdeSync = sincronizacionVencida
    ? 16 + Math.floor(Math.random() * 120) // entre 16 min y 2h - vencida
    : Math.floor(Math.random() * 15); // dentro de la ventana válida

  const sincronizadoEn = new Date(Date.now() - minutosDesdeSync * 60_000);

  return { existenciasErp, umbralSeguridad, unidadesReservadas, sincronizadoEn };
}
