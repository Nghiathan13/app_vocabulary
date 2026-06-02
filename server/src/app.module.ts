import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { AuthController } from "./auth/auth.controller";
import { AuthService } from "./auth/auth.service";
import { PrismaService } from "./prisma/prisma.service";
import { VocabController } from "./vocab/vocab.controller";
import { VocabService } from "./vocab/vocab.service";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "dev-only-secret",
      signOptions: { expiresIn: "7d" },
    }),
  ],
  controllers: [AuthController, VocabController],
  providers: [AuthService, PrismaService, VocabService],
})
export class AppModule {}
