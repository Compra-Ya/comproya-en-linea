import { IsEmail, IsString, MinLength } from "class-validator";

// CU-04 Registro de cuenta. Actor: Cliente digital.
export class RegistrarClienteDto {
  @IsString()
  @MinLength(5)
  document!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
