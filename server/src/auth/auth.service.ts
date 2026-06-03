import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { createHash, randomBytes } from "node:crypto";

import { PrismaService } from "../prisma/prisma.service";
import { LoginDto, RegisterDto } from "./auth.dto";

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_BYTES = 32;

function parseDurationMs(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());

  if (!match) {
    throw new Error(`Invalid duration: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case "s":
      return amount * 1000;
    case "m":
      return amount * 60_000;
    case "h":
      return amount * 3_600_000;
    case "d":
      return amount * 86_400_000;
    default:
      return amount * 1000;
  }
}

function getRefreshExpiresAt(): Date {
  const duration = process.env.JWT_REFRESH_EXPIRES_IN ?? "30d";
  return new Date(Date.now() + parseDurationMs(duration));
}

function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw new ConflictException("Email already registered");
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: dto.name?.trim() || null,
      },
    });

    return this.toAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const isValidPassword = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return this.toAuthResponse(user);
  }

  async refresh(refreshToken: string) {
    const tokenHash = hashRefreshToken(refreshToken);
    const session = await this.prisma.refreshSession.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: { id: true, email: true, name: true, createdAt: true },
        },
      },
    });

    if (!session || session.expiresAt.getTime() <= Date.now()) {
      if (session) {
        await this.prisma.refreshSession.delete({ where: { id: session.id } });
      }

      throw new UnauthorizedException("Invalid refresh token");
    }

    await this.prisma.refreshSession.delete({ where: { id: session.id } });

    return this.toAuthResponse(session.user);
  }

  async logout(refreshToken: string) {
    const tokenHash = hashRefreshToken(refreshToken);

    await this.prisma.refreshSession.deleteMany({ where: { tokenHash } });

    return { success: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid access token");
    }

    return user;
  }

  private signAccessToken(user: { id: string; email: string }) {
    return this.jwtService.sign(
      { id: user.id, email: user.email },
      {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
      },
    );
  }

  private async createRefreshToken(userId: string) {
    const refreshToken = randomBytes(REFRESH_TOKEN_BYTES).toString("base64url");
    const tokenHash = hashRefreshToken(refreshToken);

    await this.prisma.refreshSession.create({
      data: {
        userId,
        tokenHash,
        expiresAt: getRefreshExpiresAt(),
      },
    });

    return refreshToken;
  }

  private async toAuthResponse(user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
  }) {
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      accessToken: this.signAccessToken(user),
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
    };
  }
}
