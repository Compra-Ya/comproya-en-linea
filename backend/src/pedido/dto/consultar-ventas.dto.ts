import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Matches, Min } from "class-validator";
import { ESTADOS_DE_VENTA } from "../dominio/ventas";

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

// REQ-016: filtros de la lista de ventas del Coordinador de Canal Digital.
export class ConsultarVentasDto {
  @IsOptional()
  @Matches(FECHA, { message: "La fecha inicial debe tener el formato AAAA-MM-DD" })
  desde?: string;

  @IsOptional()
  @Matches(FECHA, { message: "La fecha final debe tener el formato AAAA-MM-DD" })
  hasta?: string;

  @IsOptional()
  @IsIn(ESTADOS_DE_VENTA, { message: "El estado debe ser uno de: PAID, PREPARING, READY_FOR_PICKUP, DELIVERED" })
  estado?: (typeof ESTADOS_DE_VENTA)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "La página debe ser un número entero" })
  @Min(1, { message: "La página empieza en 1" })
  page?: number;
}
