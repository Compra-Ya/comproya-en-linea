import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

// Global: cada módulo de sub-problema lo necesita para su propio repositorio
// de datos, y no tiene sentido re-importarlo módulo por módulo.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
