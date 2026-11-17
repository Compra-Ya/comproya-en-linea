import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

export interface JwtPayload {
  sub: number; // Customer.id
  email: string;
  // Solo lo traen los tokens de la cuenta interna (jwt-staff.strategy.ts). Esta estrategia los rechaza: una sesión
  // interna no puede actuar como Cliente digital, aunque su id coincida con el de un cliente.
  tipo?: "staff";
}

// Infraestructura transversal de autenticación (no es un sub-problema propio
// del canon; sostiene CU-04 y a partir de sprint 2 protege carrito/pedido).
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? "dev-secret-cambiar-en-produccion",
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.tipo === "staff") throw new UnauthorizedException();
    return { customerId: payload.sub, email: payload.email };
  }
}
