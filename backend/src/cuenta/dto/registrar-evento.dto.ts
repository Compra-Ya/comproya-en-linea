import { IsObject, IsString } from "class-validator";

// CU-06 Registro del comportamiento del cliente. `type`/`payload` son el
// "formato de eventos estable" que exige C-16.
export class RegistrarEventoDto {
  @IsString()
  type!: string;

  @IsObject()
  payload!: Record<string, unknown>;
}
