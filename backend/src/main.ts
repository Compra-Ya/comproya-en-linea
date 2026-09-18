import "reflect-metadata";
import { join } from "path";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  // Imágenes del catálogo curado (backend/public/**), servidas fuera del
  // prefijo /api porque no son un recurso de la API sino un archivo estático.
  app.useStaticAssets(join(__dirname, "..", "public"), { prefix: "/media" });
  // FRONTEND_ORIGIN admite una lista separada por comas — el dominio de
  // producción de Vercel más sus URLs de preview por rama, por ejemplo.
  const origenes = (process.env.FRONTEND_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim());
  app.enableCors({ origin: origenes });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  console.log(`ComproYa backend escuchando en http://localhost:${port}/api`);
}
bootstrap();
