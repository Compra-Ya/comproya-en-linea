import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

// El carrito (CU-07) admite invitados (C-04). Si llega un token válido lo
// usa para identificar al cliente; si no llega, o es inválido, deja pasar la
// petición como invitado en vez de rechazarla con 401.
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  handleRequest<TUser = unknown>(_err: unknown, user: unknown): TUser {
    return (user ?? null) as TUser;
  }
}
