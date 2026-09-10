import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/optional-jwt-auth.guard";
import { CurrentCustomer } from "../auth/current-customer.decorator";
import { CuentaService } from "./cuenta.service";
import { RegistrarClienteDto } from "./dto/registrar-cliente.dto";
import { LoginDto } from "./dto/login.dto";
import { DecidirConsentimientoDto } from "./dto/decidir-consentimiento.dto";
import { RegistrarEventoDto } from "./dto/registrar-evento.dto";

@Controller("cuenta")
export class CuentaController {
  constructor(private readonly cuenta: CuentaService) {}

  @Post("registro")
  registrar(@Body() dto: RegistrarClienteDto) {
    return this.cuenta.registrar(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.cuenta.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post("consentimiento")
  decidirConsentimiento(
    @CurrentCustomer() customer: { customerId: number },
    @Body() dto: DecidirConsentimientoDto,
  ) {
    return this.cuenta.decidirConsentimiento(customer.customerId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("consentimiento")
  consultarConsentimiento(@CurrentCustomer() customer: { customerId: number }) {
    return this.cuenta.consultarConsentimiento(customer.customerId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("supresion")
  solicitarSupresion(@CurrentCustomer() customer: { customerId: number }) {
    return this.cuenta.solicitarSupresion(customer.customerId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("supresion")
  listarSolicitudesSupresion(@CurrentCustomer() customer: { customerId: number }) {
    return this.cuenta.listarSolicitudesSupresion(customer.customerId);
  }

  // Sin exigir autenticación: un evento de comportamiento también puede
  // venir de un visitante no registrado, y siempre se guarda anónimo (RN-10).
  @UseGuards(OptionalJwtAuthGuard)
  @Post("eventos")
  registrarEvento(
    @CurrentCustomer() customer: { customerId: number } | null,
    @Body() dto: RegistrarEventoDto,
  ) {
    return this.cuenta.registrarEvento(customer?.customerId ?? null, dto);
  }
}
