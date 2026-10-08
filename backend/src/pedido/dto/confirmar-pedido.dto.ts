import { Type } from "class-transformer";
import { IsDefined, IsIn, IsInt, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf, ValidateNested } from "class-validator";

// Datos de contacto y dirección de la venta digital con envío.
export class DatosEnvioDto {
  @IsString({ message: "Escribe tu nombre completo" })
  @MinLength(3, { message: "Escribe tu nombre completo" })
  @MaxLength(120)
  nombre!: string;

  @IsString({ message: "Escribe un teléfono de contacto" })
  @Matches(/^[0-9+()\s-]{7,20}$/, { message: "Escribe un teléfono válido, por ejemplo 300 123 4567" })
  telefono!: string;

  @IsString({ message: "Escribe tu dirección de envío" })
  @MinLength(6, { message: "Escribe la dirección completa, con calle y número" })
  @MaxLength(200)
  direccion!: string;

  @IsString({ message: "Escribe tu ciudad" })
  @MinLength(2, { message: "Escribe tu ciudad" })
  @MaxLength(80)
  ciudad!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notas?: string;
}

// CU-09 Confirmación del pedido. `couponCode` es la extensión de CU-10
// (Aplicación de cupón de lealtad) sobre este mismo caso de uso, tal como lo
// modela el mockup P-10 (campo de cupón dentro de la confirmación).
// `tipoEntrega`: RETIRO (canon, por defecto) exige `branchId`; ENVIO (venta digital) exige `envio`
// y la sucursal que despacha la elige el sistema.
export class ConfirmarPedidoDto {
  @IsOptional()
  @IsIn(["RETIRO", "ENVIO"])
  tipoEntrega?: "RETIRO" | "ENVIO";

  @ValidateIf((o: ConfirmarPedidoDto) => o.tipoEntrega !== "ENVIO")
  @IsInt({ message: "Elige una sucursal de retiro" })
  branchId?: number;

  @ValidateIf((o: ConfirmarPedidoDto) => o.tipoEntrega === "ENVIO")
  @IsDefined({ message: "Faltan los datos de envío" })
  @ValidateNested()
  @Type(() => DatosEnvioDto)
  envio?: DatosEnvioDto;

  @IsOptional()
  @IsString()
  couponCode?: string;
}
