import { IsInt, Min } from "class-validator";

export class AgregarItemDto {
  @IsInt()
  productId!: number;

  @IsInt()
  @Min(1)
  quantity!: number;
}
