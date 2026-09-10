import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Matches, Min } from "class-validator";

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
}
