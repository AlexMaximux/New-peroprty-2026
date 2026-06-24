import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ApprovedAgencyGuard, RequireApprovedAgency } from './approved-agency.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import * as argon2 from 'argon2';

describe('ApprovedAgencyGuard', () => {
  let module: TestingModule;
  let guard: ApprovedAgencyGuard;
  let prisma: PrismaService;

  const cleanupUserIds: string[] = [];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' })],
      providers: [ApprovedAgencyGuard, PrismaService, Reflector],
    }).compile();

    guard = module.get<ApprovedAgencyGuard>(ApprovedAgencyGuard);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    for (const uid of cleanupUserIds) {
      await prisma.agencyDocument.deleteMany({ where: { agencyProfile: { userId: uid } } }).catch(() => {});
      await prisma.agencyProfile.deleteMany({ where: { userId: uid } }).catch(() => {});
      await prisma.user.delete({ where: { id: uid } }).catch(() => {});
    }
    cleanupUserIds.length = 0;
  });

  const createUser = async (role = 'AGENCY') => {
    const hash = await argon2.hash('Passw0rd!');
    const user = await prisma.user.create({
      data: {
        email: `guard-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@propvest.test`,
        passwordHash: hash,
        role: role as any,
        displayName: 'Guard Test User',
      },
    });
    cleanupUserIds.push(user.id);
    return user;
  };

  const createAgencyProfile = async (userId: string, status: string) => {
    return prisma.agencyProfile.create({
      data: {
        userId,
        companyName: 'Guard Test Agency Ltd',
        companyNumber: '87654321',
        address: '99 Test Avenue, London',
        contactName: 'Guard Test',
        phone: '020 9999 0000',
        verificationStatus: status as any,
      },
    });
  };

  // The target for metadata reflection — apply the decorator to it
  @RequireApprovedAgency()
  class GuardedHandler {}

  it('should allow APPROVED agency through', async () => {
    const user = await createUser();
    await createAgencyProfile(user.id, 'APPROVED');

    const context = {
      getHandler: () => GuardedHandler,
      getClass: () => GuardedHandler,
      switchToHttp: () => ({
        getRequest: () => ({
          user: { sub: user.id, role: 'AGENCY' },
        }),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should block PENDING agency with ForbiddenException', async () => {
    const user = await createUser();
    await createAgencyProfile(user.id, 'PENDING');

    const context = {
      getHandler: () => GuardedHandler,
      getClass: () => GuardedHandler,
      switchToHttp: () => ({
        getRequest: () => ({
          user: { sub: user.id, role: 'AGENCY' },
        }),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(context)).rejects.toThrow(/PENDING/);
  });

  it('should block REJECTED agency with ForbiddenException', async () => {
    const user = await createUser();
    await createAgencyProfile(user.id, 'REJECTED');

    const context = {
      getHandler: () => GuardedHandler,
      getClass: () => GuardedHandler,
      switchToHttp: () => ({
        getRequest: () => ({
          user: { sub: user.id, role: 'AGENCY' },
        }),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(context)).rejects.toThrow(/REJECTED/);
  });

  it('should allow ADMIN to bypass', async () => {
    const context = {
      getHandler: () => GuardedHandler,
      getClass: () => GuardedHandler,
      switchToHttp: () => ({
        getRequest: () => ({
          user: { sub: 'admin-id', role: 'ADMIN' },
        }),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should throw ForbiddenException if no user in request', async () => {
    const context = {
      getHandler: () => GuardedHandler,
      getClass: () => GuardedHandler,
      switchToHttp: () => ({
        getRequest: () => ({
          user: null,
        }),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(context)).rejects.toThrow(/Authentication required/);
  });

  it('should return true if guard is not enabled (no decorator)', async () => {
    // A handler without @RequireApprovedAgency()
    class UnguardedHandler {}

    const context = {
      getHandler: () => UnguardedHandler,
      getClass: () => UnguardedHandler,
      switchToHttp: () => ({
        getRequest: () => ({
          user: { sub: 'any', role: 'AGENCY' },
        }),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});