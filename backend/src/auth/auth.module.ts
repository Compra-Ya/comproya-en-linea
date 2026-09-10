import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "./jwt.strategy";

// Infraestructura transversal (no un módulo de sub-problema): emite y valida
// los JWT propios que exige docs/arquitectura.md sección 7 (registro/login
// propios, sin proveedor externo, porque C-14 vincula lealtad al registro).
@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "dev-secret-cambiar-en-produccion",
      signOptions: { expiresIn: "7d" },
    }),
  ],
  providers: [JwtStrategy],
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
