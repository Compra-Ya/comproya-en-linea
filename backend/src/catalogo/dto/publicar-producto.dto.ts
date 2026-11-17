import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Matches, Max, Min } from "class-validator";

// CU-01 Publicación de producto en el catálogo. Actor: Coordinador de Canal
// Digital (canon, sección 4). `aprobacionGerencialComercial` simula la
// aprobación de gerencia comercial que exige RN-02 cuando el precio digital
// queda por debajo del costo del ERP — no hay un flujo de aprobación propio
// en el alcance de este sprint, se modela como el visto bueno explícito que
// firma quien publica.
export class PublicarProductoDto {
  @Matches(/^[A-Z]{2,6}-\d{6}$/, {
    message: "El código homologado debe existir en el maestro (formato AAAA-999999)",
  })
  homologatedCode!: string;

  @IsString()
  name!: string;

  @IsString()
  categoryName!: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsNumber()
  @Min(0)
  cost!: number;

  @IsNumber()
  @Min(0)
  digitalPrice!: number;

  @IsOptional()
  @IsBoolean()
  aprobacionGerencialComercial?: boolean;

  // Existencias iniciales: las que reportaría el ERP simulado (alcance reducido: una sola sucursal, ERP simulado). Si se indican, quedan como las existencias
  // del producto; si no, no se toca lo que ya haya. Las unidades que se pueden vender salen de RN-03.
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Las existencias deben ser un número entero" })
  @Min(0, { message: "Las existencias no pueden ser negativas" })
  @Max(100000, { message: "Las existencias no pueden pasar de 100.000 unidades" })
  existencias?: number;
}
