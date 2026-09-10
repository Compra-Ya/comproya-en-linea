import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

// El sprint 1 (catálogo) declaró explícitamente que no lleva autenticación
// (decisión D-01 del canon). A partir del sprint 2, carrito y pedido usan
// este guard para saber qué cliente digital está operando.
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
