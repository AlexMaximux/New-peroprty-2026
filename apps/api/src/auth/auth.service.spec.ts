import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

// Use the real PrismaService with the test/seed database
describe('AuthService', () => {
  let module: TestingModule;
  let authService: AuthService;
  let prisma: PrismaService;

  // Track created user IDs for cleanup
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
          useFactory: () => ({
            secret: 'test-access-secret',
            signOptions: { expiresIn: '15m' as any },
          }),
        }),
      ],
      providers: [AuthService, PrismaService],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up created test users and their associated data
    for (const uid of createdUserIds) {
      // Cascade delete will handle refresh tokens, etc.
      await prisma.user.delete({ where: { id: uid } }).catch(() => {});
    }
    createdUserIds.length = 0;
  });

  // ── Helpers ──

  const uniqueEmail = () => `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@propvest.test`;

  // ── Register ──

  describe('register', () => {
    it('should register a new user and return tokens', async () => {
      const email = uniqueEmail();
      const result = await authService.register({
        email,
        password: 'Password123!',
        displayName: 'Test User',
      });

      expect(result.user.email).toBe(email);
      expect(result.user.role).toBe('USER');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      // Password hash is never included in response
      expect(result.user).not.toHaveProperty('passwordHash');

      createdUserIds.push(result.user.id);
    });

    it('should register an agency user', async () => {
      const email = uniqueEmail();
      const result = await authService.register({
        email,
        password: 'Password123!',
        displayName: 'Test Agency',
        role: 'AGENCY',
      });

      expect(result.user.role).toBe('AGENCY');
      createdUserIds.push(result.user.id);
    });

    it('should reject duplicate email', async () => {
      const email = uniqueEmail();
      await authService.register({
        email,
        password: 'Password123!',
        displayName: 'First User',
      });

      await expect(
        authService.register({
          email,
          password: 'AnotherPass1!',
          displayName: 'Second User',
        }),
      ).rejects.toThrow('Email already registered');

      // Clean up the first user
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) createdUserIds.push(user.id);
    });
  });

  // ── Login ──

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const email = uniqueEmail();
      const password = 'Password123!';

      // Create user directly
      const hash = await argon2.hash(password);
      const user = await prisma.user.create({
        data: { email, passwordHash: hash, displayName: 'Login Test' },
      });
      createdUserIds.push(user.id);

      const result = await authService.login({ email, password });
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe(email);
    });

    it('should reject wrong password', async () => {
      const email = uniqueEmail();
      const hash = await argon2.hash('Password123!');
      const user = await prisma.user.create({
        data: { email, passwordHash: hash, displayName: 'Wrong Pass Test' },
      });
      createdUserIds.push(user.id);

      await expect(
        authService.login({ email, password: 'WrongPassword!' }),
      ).rejects.toThrow('Invalid email or password');
    });

    it('should reject non-existent email', async () => {
      await expect(
        authService.login({ email: 'nonexistent@test.com', password: 'Anything1!' }),
      ).rejects.toThrow('Invalid email or password');
    });

    it('should reject suspended user', async () => {
      const email = uniqueEmail();
      const hash = await argon2.hash('Password123!');
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: hash,
          displayName: 'Suspended User',
          status: 'SUSPENDED',
        },
      });
      createdUserIds.push(user.id);

      await expect(
        authService.login({ email, password: 'Password123!' }),
      ).rejects.toThrow('Account is not active');
    });
  });

  // ── Refresh (rotation) ──

  describe('refresh', () => {
    it('should rotate refresh token and return new pair', async () => {
      const email = uniqueEmail();
      const hash = await argon2.hash('Password123!');
      const user = await prisma.user.create({
        data: { email, passwordHash: hash, displayName: 'Refresh Test' },
      });
      createdUserIds.push(user.id);

      const loginResult = await authService.login({ email, password: 'Password123!' });
      const oldRefreshToken = loginResult.refreshToken;

      // Refresh — this rotates
      const refreshResult = await authService.refresh(oldRefreshToken);
      expect(refreshResult.accessToken).toBeDefined();
      expect(refreshResult.refreshToken).toBeDefined();
      expect(refreshResult.refreshToken).not.toBe(oldRefreshToken);

      // Old token should be revoked — reusing it must fail
      await expect(
        authService.refresh(oldRefreshToken),
      ).rejects.toThrow('Refresh token has been revoked');
    });

    it('should reject revoked token', async () => {
      const email = uniqueEmail();
      const hash = await argon2.hash('Password123!');
      const user = await prisma.user.create({
        data: { email, passwordHash: hash, displayName: 'Revoke Test' },
      });
      createdUserIds.push(user.id);

      // Generate a token directly for testing
      const rawToken = crypto.randomBytes(48).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      await prisma.refreshToken.create({
        data: {
          hashedToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          revokedAt: new Date(), // Already revoked
        },
      });

      await expect(
        authService.refresh(rawToken),
      ).rejects.toThrow('Refresh token has been revoked');
    });

    it('should reject invalid (non-existent) token', async () => {
      await expect(
        authService.refresh('totally-fake-token'),
      ).rejects.toThrow('Invalid refresh token');
    });

    it('should reject expired token', async () => {
      const email = uniqueEmail();
      const hash = await argon2.hash('Password123!');
      const user = await prisma.user.create({
        data: { email, passwordHash: hash, displayName: 'Expiry Test' },
      });
      createdUserIds.push(user.id);

      const rawToken = crypto.randomBytes(48).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      await prisma.refreshToken.create({
        data: {
          hashedToken,
          userId: user.id,
          expiresAt: new Date(Date.now() - 1000), // Already expired
        },
      });

      await expect(
        authService.refresh(rawToken),
      ).rejects.toThrow('Refresh token has expired');
    });
  });

  // ── Logout ──

  describe('logout', () => {
    it('should revoke the refresh token', async () => {
      const email = uniqueEmail();
      const hash = await argon2.hash('Password123!');
      const user = await prisma.user.create({
        data: { email, passwordHash: hash, displayName: 'Logout Test' },
      });
      createdUserIds.push(user.id);

      const loginResult = await authService.login({ email, password: 'Password123!' });

      // Logout
      await authService.logout(loginResult.refreshToken);

      // Token should now be revoked
      await expect(
        authService.refresh(loginResult.refreshToken),
      ).rejects.toThrow('Refresh token has been revoked');
    });
  });

  // ── Me ──

  describe('me', () => {
    it('should return user info for valid user', async () => {
      const email = uniqueEmail();
      const hash = await argon2.hash('Password123!');
      const user = await prisma.user.create({
        data: { email, passwordHash: hash, displayName: 'Me Test' },
      });
      createdUserIds.push(user.id);

      const result = await authService.me(user.id);
      expect(result.email).toBe(email);
      expect(result.displayName).toBe('Me Test');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw for non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await expect(authService.me(fakeId)).rejects.toThrow('User not found');
    });
  });

  // ── Permission failure cases ──

  describe('permission failures', () => {
    it('should reject login for deactivated user', async () => {
      const email = uniqueEmail();
      const hash = await argon2.hash('Password123!');
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: hash,
          displayName: 'Deactivated User',
          status: 'DEACTIVATED',
        },
      });
      createdUserIds.push(user.id);

      await expect(
        authService.login({ email, password: 'Password123!' }),
      ).rejects.toThrow('Account is not active');
    });

    it('should reject refresh for suspended user even with valid token', async () => {
      const email = uniqueEmail();
      const hash = await argon2.hash('Password123!');
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: hash,
          displayName: 'Suspended Refresh',
          status: 'SUSPENDED',
        },
      });
      createdUserIds.push(user.id);

      // Create a valid, non-revoked token
      const rawToken = crypto.randomBytes(48).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      await prisma.refreshToken.create({
        data: {
          hashedToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      await expect(
        authService.refresh(rawToken),
      ).rejects.toThrow('Account is not active');
    });
  });
});