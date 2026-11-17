import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { StaffRole } from "@prisma/client";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../prisma/prisma.service";

export interface JwtStaffPayload {
  sub: number; // StaffUser.id
  email: string;
  tipo: "staff";
  rol: StaffRole;
}

export interface StaffAutenticado {
  staffId: number;
  email: string;
  role: StaffRole;
}

// Sesión de la cuenta interna (alcance reducido, docs/alcance). Usa el mismo secreto que la del Cliente digital,
// pero solo acepta tokens con tipo "staff", y consulta la base en cada petición: una cuenta desactivada o borrada
// pierde el acceso aunque su token no haya vencido.
@Injectable()
export class JwtStaffStrategy extends PassportStrategy(Strategy, "jwt-staff") {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? "dev-secret-cambiar-en-produccion",
    });
  }

  async validate(payload: JwtStaffPayload): Promise<StaffAutenticado> {
    if (payload.tipo !== "staff") throw new UnauthorizedException();
    const staff = await this.prisma.staffUser.findUnique({ where: { id: payload.sub } });
    if (!staff || !staff.active) throw new UnauthorizedException();
    return { staffId: staff.id, email: staff.email, role: staff.role };
  }
}
