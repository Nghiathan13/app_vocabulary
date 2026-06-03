import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { AuthController } from "./auth/auth.controller";
import { AuthService } from "./auth/auth.service";
import { AudioController } from "./audio/audio.controller";
import { HealthController } from "./health/health.controller";
import { AudioService } from "./audio/audio.service";
import { PrismaService } from "./prisma/prisma.service";
import { VocabController } from "./vocab/vocab.controller";
import { VocabService } from "./vocab/vocab.service";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "dev-only-secret",
      signOptions: {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
      },
    }),
  ],
  controllers: [HealthController, AuthController, AudioController, VocabController],
  providers: [AuthService, AudioService, PrismaService, VocabService],
})
export class AppModule {}
