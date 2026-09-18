import { IsString, MinLength } from "class-validator";

// RN-08: retiro en tienda con el código de un solo uso emitido en CU-17.
export class RetirarPedidoDto {
  @IsString()
  @MinLength(1)
  pickupCode!: string;
}
