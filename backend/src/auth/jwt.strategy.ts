import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

export interface JwtPayload {
  sub: number; // Customer.id
  email: string;
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
    return { customerId: payload.sub, email: payload.email };
  }
}
