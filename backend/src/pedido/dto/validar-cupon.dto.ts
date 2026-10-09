import { IsString, MaxLength, MinLength } from "class-validator";

// Validación del cupón de lealtad antes de confirmar el pedido (CU-10), contra el carrito del cliente.
export class ValidarCuponDto {
  @IsString({ message: "Escribe el código de tu cupón" })
  @MinLength(1, { message: "Escribe el código de tu cupón" })
  @MaxLength(40)
  codigo!: string;
}
