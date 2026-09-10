import { IsInt, IsOptional, IsString } from "class-validator";

// CU-09 Confirmación del pedido. `couponCode` es la extensión de CU-10
// (Aplicación de cupón de lealtad) sobre este mismo caso de uso, tal como lo
// modela el mockup P-10 (campo de cupón dentro de la confirmación).
export class ConfirmarPedidoDto {
  @IsInt()
  branchId!: number;

  @IsOptional()
  @IsString()
  couponCode?: string;
}
