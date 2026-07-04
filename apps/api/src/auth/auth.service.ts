import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly accessTtl: string;
  private readonly refreshTtl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessTtl = this.configService.get<string>('JWT_ACCESS_TTL') ?? '15m';
    this.refreshTtl = this.configService.get<string>('JWT_REFRESH_TTL') ?? '7d';
  }

  // ── Register ──

  async register(dto: { email: string; password: string; displayName: string; phone?: string; role?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await argon2.hash(dto.password);
    const role = (dto.role === 'AGENCY' ? 'AGENCY' : 'USER') as UserRole;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role,
        displayName: dto.displayName,
        phone: dto.phone,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { user: { id: user.id, email: user.email, role: user.role, displayName: user.displayName }, ...tokens };
  }

  // ── Login ──

  async login(dto: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Account is not active');
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { user: { id: user.id, email: user.email, role: user.role, displayName: user.displayName }, ...tokens };
  }

  // ── Refresh (with rotation) ──

  async refresh(token: string) {
    const hashedToken = this.hashToken(token);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { hashedToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.revokedAt) {
      // Token already revoked — likely a reuse attempt (rotation detected)
      // Revoke the entire chain for security
      await this.revokeTokenChain(storedToken.id);
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    const user = storedToken.user;
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Account is not active');
    }

    // Rotate: revoke old token, create new
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role, storedToken.id);
    return { user: { id: user.id, email: user.email, role: user.role, displayName: user.displayName }, ...tokens };
  }

  // ── Logout ──

  async logout(refreshToken: string) {
    const hashedToken = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { hashedToken, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ── Me ──

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, displayName: true, phone: true, status: true, createdAt: true },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  // ── Change Password ──

  async changePassword(userId: string, dto: { currentPassword: string; newPassword: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const currentValid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!currentValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newHash = await argon2.hash(dto.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { message: 'Password changed successfully' };
  }

  // ── Helpers ──

  private async generateTokens(userId: string, email: string, role: string, parentTokenId?: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.accessTtl as any,
    });

    const rawRefreshToken = crypto.randomBytes(48).toString('hex');
    const hashedToken = this.hashToken(rawRefreshToken);

    // Parse TTL like "7d" into a Date
    const expiresAt = this.parseTtlToDate(this.refreshTtl);

    await this.prisma.refreshToken.create({
      data: {
        hashedToken,
        userId,
        expiresAt,
        parentTokenId,
      },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseTtlToDate(ttl: string): Date {
    const match = ttl.match(/^(\d+)([smhd])$/);
    if (!match) {
      // Default to 7 days
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    const value = parseInt(match[1]!, 10);
    const unit = match[2] ?? 'd';
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return new Date(Date.now() + value * multipliers[unit]!);
  }

  private async revokeTokenChain(tokenId: string) {
    // Revoke this token and any that reference it as parent (rotation chain)
    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });
    // Also revoke children that were spawned from this token
    await this.prisma.refreshToken.updateMany({
      where: { parentTokenId: tokenId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}