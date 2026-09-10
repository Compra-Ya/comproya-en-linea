import { IsInt, Min } from "class-validator";

export class ActualizarItemDto {
  @IsInt()
  @Min(0)
  quantity!: number;
}
