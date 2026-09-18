import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CuentaService } from "../cuenta.service";
import { RegistrarClienteDto } from "../dto/registrar-cliente.dto";
import { Cliente } from "./cliente";
import { Cuenta } from "./cuenta";

// Clase de control GestorDeRegistro (Plan_Pruebas_ComproYa.docx, PR-01/PR-02,
// PI-02). Envuelve CuentaService.registrar() sin duplicar su lógica — la
// validación de duplicado (E-1) y la creación real de Cliente + Cuenta ya
// viven ahí (RN de unicidad de documento).
@Injectable()
export class GestorDeRegistro {
  constructor(
    private readonly cuentaService: CuentaService,
    private readonly prisma: PrismaService,
  ) {}

  // PR-01: expone la validación de duplicado como paso independiente, tal
  // como lo pide la ruta del diagrama de actividad ("validarDuplicado()
  // devuelve verdadero; no se crea Cuenta").
  async validarDuplicado(document: string): Promise<boolean> {
    const existente = await this.prisma.customer.findUnique({ where: { document } });
    return existente !== null;
  }

  async registrarCliente(
    dto: RegistrarClienteDto,
  ): Promise<{ cliente: Cliente; cuenta: Cuenta; accessToken: string }> {
    const { customer, accessToken } = await this.cuentaService.registrar(dto);
    const cuenta = new Cuenta();
    cuenta.activar();
    return { cliente: Cliente.desde(customer), cuenta, accessToken };
  }
}
