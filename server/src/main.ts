import "dotenv/config";
import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";

const DEFAULT_CORS_ORIGINS = [
  "http://localhost:1420",
  "http://localhost:5173",
];

function getCorsOrigins(): string[] {
  const corsOrigin = process.env.CORS_ORIGIN?.trim();

  if (corsOrigin) {
    return corsOrigin
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  return DEFAULT_CORS_ORIGINS;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: getCorsOrigins() });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

void bootstrap();
