import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { DisponibilidadCalculada, PuertoErp } from "./puerto-erp";

// Simula el ERP centralizado y el maestro de códigos homologados (canon,
// sección 3 y docs/arquitectura.md sección 6). El proceso por lotes nocturno
// real se imita con `sincronizarSucursal`, que un job o un endpoint interno
// dispara cada ≤ 5 minutos en vez de una vez por noche.
const QUINCE_MINUTOS_MS = 15 * 60 * 1000;

@Injectable()
export class AdaptadorErpSimulado implements PuertoErp {
  constructor(private readonly prisma: PrismaService) {}

  // RN-01: el maestro de códigos homologados no es una tabla propia de este
  // proyecto académico (fuera de alcance, el canal solo lo consume) — se
  // simula con el formato que ya usa `backend/prisma/lib/generate-catalog.ts`
  // para todo el catálogo sembrado: dos a seis letras, guion, seis dígitos.
  esCodigoHomologado(homologatedCode: string): boolean {
    return /^[A-Z]{2,6}-\d{6}$/.test(homologatedCode);
  }

  private calcular(row: {
    id: number;
    productId: number;
    branchId: number;
    erpUnits: number;
    safetyThreshold: number;
    reservedUnits: number;
    syncedAt: Date;
  }): DisponibilidadCalculada {
    // RN-03: unidades ofrecidas = existencias ERP - umbral de seguridad -
    // reservas vigentes, nunca negativo.
    const unidadesDisponibles = Math.max(0, row.erpUnits - row.safetyThreshold - row.reservedUnits);
    // RN-04: sucursal desincronizada hace más de 15 minutos no ofrece retiro.
    const puedeRetirar = Date.now() - row.syncedAt.getTime() <= QUINCE_MINUTOS_MS;
    return {
      productId: row.productId,
      branchId: row.branchId,
      availabilityId: row.id,
      erpUnits: row.erpUnits,
      safetyThreshold: row.safetyThreshold,
      reservedUnits: row.reservedUnits,
      unidadesDisponibles,
      syncedAt: row.syncedAt,
      puedeRetirar,
    };
  }

  async calcularDisponibilidad(productId: number, branchId: number): Promise<DisponibilidadCalculada> {
    const row = await this.prisma.availability.findUnique({
      where: { productId_branchId: { productId, branchId } },
    });
    if (!row) {
      throw new NotFoundException("No hay disponibilidad registrada para ese producto en esa sucursal");
    }
    return this.calcular(row);
  }

  async listarDisponibilidadPorProducto(productId: number): Promise<DisponibilidadCalculada[]> {
    const rows = await this.prisma.availability.findMany({ where: { productId } });
    return rows.map((row) => this.calcular(row));
  }

  async reservarUnidades(productId: number, branchId: number, quantity: number): Promise<number> {
    const row = await this.prisma.availability.findUnique({
      where: { productId_branchId: { productId, branchId } },
    });
    if (!row) {
      throw new NotFoundException("No hay disponibilidad registrada para ese producto en esa sucursal");
    }
    const disponibilidad = this.calcular(row);
    if (!disponibilidad.puedeRetirar) {
      // RN-04.
      throw new BadRequestException(
        `La sucursal ${branchId} lleva más de 15 minutos sin sincronizar con el ERP y no ofrece retiro`,
      );
    }
    if (disponibilidad.unidadesDisponibles < quantity) {
      // RN-03.
      throw new BadRequestException(
        `Solo hay ${disponibilidad.unidadesDisponibles} unidades disponibles para el producto ${productId} en la sucursal ${branchId}`,
      );
    }
    // Reserva atómica: el UPDATE solo aplica si sigue habiendo unidades
    // suficientes en el momento de escribir, para no perder la carrera entre
    // dos confirmaciones simultáneas del mismo producto (RN-05).
    const actualizados = await this.prisma.availability.updateMany({
      where: {
        id: row.id,
        erpUnits: { gte: row.reservedUnits + row.safetyThreshold + quantity },
      },
      data: { reservedUnits: { increment: quantity } },
    });
    if (actualizados.count === 0) {
      throw new BadRequestException("Las unidades disponibles cambiaron antes de completar la reserva; vuelve a intentarlo");
    }
    return row.id;
  }

  async liberarReserva(availabilityId: number, quantity: number): Promise<void> {
    await this.prisma.availability.update({
      where: { id: availabilityId },
      data: { reservedUnits: { decrement: quantity } },
    });
  }

  // Imita el proceso por lotes del ERP: refresca `syncedAt` de una sucursal.
  // Lo usa un endpoint interno / job (docs/arquitectura.md sección 8), nunca
  // el flujo de compra en sí.
  async sincronizarSucursal(branchId: number): Promise<void> {
    await this.prisma.availability.updateMany({
      where: { branchId },
      data: { syncedAt: new Date() },
    });
  }
}
