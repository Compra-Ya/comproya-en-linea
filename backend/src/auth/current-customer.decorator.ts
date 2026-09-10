import { createParamDecorator, ExecutionContext } from "@nestjs/common";

// Extrae el cliente digital autenticado que dejó JwtAuthGuard en la petición.
export const CurrentCustomer = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as { customerId: number; email: string };
  },
);
