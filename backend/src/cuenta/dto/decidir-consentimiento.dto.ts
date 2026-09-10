import { IsBoolean, IsOptional, IsString, Matches } from "class-validator";

// CU-05 Administración del consentimiento. El cliente decide aceptar o
// rechazar la política de datos personales vigente; si acepta, puede vincular
// opcionalmente su identificador de lealtad (C-14).
export class DecidirConsentimientoDto {
  @IsBoolean()
  activo!: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^LEALTAD-\d{6}$/, { message: "Formato de identificador de lealtad inválido (LEALTAD-999999)" })
  loyaltyId?: string;
}
