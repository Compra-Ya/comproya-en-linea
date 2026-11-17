import {
  applyDecorators,
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UseGuards,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { StaffRole } from "@prisma/client";
import { StaffAutenticado } from "./jwt-staff.strategy";

const ROLES_PERMITIDOS = "roles-internos-permitidos";

// Exige una sesión de la cuenta interna (no la del Cliente digital).
@Injectable()
export class JwtStaffAuthGuard extends AuthGuard("jwt-staff") {}

// Con sesión interna válida, comprueba el rol. Sin roles indicados basta con tener cualquier cuenta interna activa.
@Injectable()
export class RolInternoGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permitidos = this.reflector.getAllAndOverride<StaffRole[]>(ROLES_PERMITIDOS, [context.getHandler(), context.getClass()]);
    if (!permitidos || permitidos.length === 0) return true;
    const staff = context.switchToHttp().getRequest().user as StaffAutenticado | undefined;
    if (!staff || !permitidos.includes(staff.role)) {
      throw new ForbiddenException("Tu cuenta interna no tiene permiso para esta acción");
    }
    return true;
  }
}

/**
 * Protege una ruta interna: sesión de la cuenta interna + rol (REQ-017). Ejemplo: @AccesoInterno(StaffRole.CHANNEL_COORDINATOR).
 * Un token de Cliente digital responde 401; una cuenta interna con otro rol responde 403.
 */
export const AccesoInterno = (...roles: StaffRole[]) =>
  applyDecorators(SetMetadata(ROLES_PERMITIDOS, roles), UseGuards(JwtStaffAuthGuard, RolInternoGuard));

/** Cuenta interna autenticada que dejó JwtStaffAuthGuard en la petición. */
export const StaffActual = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest().user as StaffAutenticado;
});
