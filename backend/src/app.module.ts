import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { CatalogoModule } from "./catalogo/catalogo.module";
import { CuentaModule } from "./cuenta/cuenta.module";
import { CarritoModule } from "./carrito/carrito.module";
import { PedidoModule } from "./pedido/pedido.module";
import { PagoModule } from "./pago/pago.module";

// Monolito modular: un módulo de Nest por sub-problema del canon
// (docs/arquitectura.md sección 3). El módulo `operacion` (sprint 6,
// alistamiento y entrega) queda fuera de esta entrega — ver README.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    CatalogoModule,
    CuentaModule,
    CarritoModule,
    PedidoModule,
    PagoModule,
  ],
})
export class AppModule {}
