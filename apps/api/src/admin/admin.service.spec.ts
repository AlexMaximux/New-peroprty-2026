import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';

describe('AdminService — permission failures', () => {
  let module: TestingModule;
  let adminService: AdminService;
  let prisma: PrismaService;

  const cleanupIds: string[] = [];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
      ],
      providers: [AdminService, PrismaService],
    }).compile();

    adminService = module.get<AdminService>(AdminService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    for (const id of cleanupIds) {
      await prisma.user.delete({ where: { id } }).catch(() => {});
    }
    cleanupIds.length = 0;
  });

  const createUser = async (role: string) => {
    const hash = await argon2.hash('Passw0rd!');
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@propvest.test`,
        passwordHash: hash,
        role: role as any,
        displayName: `Test ${role}`,
      },
    });
    cleanupIds.push(user.id);
    return user;
  };

  // ── Rejection requires reason ──

  describe('rejectAgency — requires reason', () => {
    it('should reject agency with a reason', async () => {
      const admin = await createUser('ADMIN');
      const agencyUser = await createUser('AGENCY');

      const profile = await prisma.agencyProfile.create({
        data: {
          userId: agencyUser.id,
          companyName: 'Bad Agency',
          address: '123 Street',
          contactName: 'Bad',
          phone: '000',
        },
      });

      const result = await adminService.rejectAgency(admin.id, profile.id, 'Incomplete documentation');
      expect(result.verificationStatus).toBe('REJECTED');
      expect(result.rejectionReason).toBe('Incomplete documentation');
    });

    it('should throw BadRequestException when rejection reason is empty', async () => {
      const admin = await createUser('ADMIN');
      const agencyUser = await createUser('AGENCY');

      const profile = await prisma.agencyProfile.create({
        data: {
          userId: agencyUser.id,
          companyName: 'Bad Agency',
          address: '123 Street',
          contactName: 'Bad',
          phone: '000',
        },
      });

      await expect(
        adminService.rejectAgency(admin.id, profile.id, ''),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when rejection reason is whitespace', async () => {
      const admin = await createUser('ADMIN');
      const agencyUser = await createUser('AGENCY');

      const profile = await prisma.agencyProfile.create({
        data: {
          userId: agencyUser.id,
          companyName: 'Bad Agency',
          address: '123 Street',
          contactName: 'Bad',
          phone: '000',
        },
      });

      await expect(
        adminService.rejectAgency(admin.id, profile.id, '   '),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── Non-existent targets ──

  describe('non-existent targets', () => {
    it('should throw NotFoundException when approving non-existent agency', async () => {
      const admin = await createUser('ADMIN');
      await expect(
        adminService.approveAgency(admin.id, '00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when rejecting non-existent agency', async () => {
      const admin = await createUser('ADMIN');
      await expect(
        adminService.rejectAgency(admin.id, '00000000-0000-0000-0000-000000000000', 'reason'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when moderating non-existent listing', async () => {
      const admin = await createUser('ADMIN');
      await expect(
        adminService.moderateListing(admin.id, '00000000-0000-0000-0000-000000000000', 'UNPUBLISH'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── AdminAuditLog logging ──

  describe('AdminAuditLog — actions are logged', () => {
    it('should log APPROVE_AGENCY action', async () => {
      const admin = await createUser('ADMIN');
      const agencyUser = await createUser('AGENCY');

      const profile = await prisma.agencyProfile.create({
        data: {
          userId: agencyUser.id,
          companyName: 'Log Test Agency',
          address: '123',
          contactName: 'Log',
          phone: '000',
        },
      });

      await adminService.approveAgency(admin.id, profile.id);

      const log = await prisma.adminAuditLog.findFirst({
        where: { targetId: profile.id, action: 'APPROVE_AGENCY' },
      });
      expect(log).not.toBeNull();
      expect(log!.adminUserId).toBe(admin.id);
    });

    it('should log REJECT_AGENCY action with reason in meta', async () => {
      const admin = await createUser('ADMIN');
      const agencyUser = await createUser('AGENCY');

      const profile = await prisma.agencyProfile.create({
        data: {
          userId: agencyUser.id,
          companyName: 'Log Test Reject',
          address: '123',
          contactName: 'Log',
          phone: '000',
        },
      });

      await adminService.rejectAgency(admin.id, profile.id, 'Missing documents');

      const log = await prisma.adminAuditLog.findFirst({
        where: { targetId: profile.id, action: 'REJECT_AGENCY' },
      });
      expect(log).not.toBeNull();
      expect((log!.meta as any)?.reason).toBe('Missing documents');
    });

    it('should log MODERATE_UNPUBLISH action', async () => {
      const admin = await createUser('ADMIN');
      const agencyUser = await createUser('AGENCY');
      const profile = await prisma.agencyProfile.create({
        data: {
          userId: agencyUser.id,
          companyName: 'Moderation Test',
          address: '123',
          contactName: 'Mod',
          phone: '000',
          verificationStatus: 'APPROVED',
        },
      });

      const listing = await prisma.listing.create({
        data: {
          agencyProfileId: profile.id,
          category: 'SELL_PROPERTY',
          strategy: 'SINGLE_LET',
          status: 'PUBLISHED',
          title: 'Moderation Test Listing',
          addressLine1: '1 Test Road',
          city: 'London',
          postcode: 'SW1A 1AA',
        },
      });

      await adminService.moderateListing(admin.id, listing.id, 'UNPUBLISH');

      const log = await prisma.adminAuditLog.findFirst({
        where: { targetId: listing.id, action: 'MODERATE_UNPUBLISH' },
      });
      expect(log).not.toBeNull();
      expect(log!.adminUserId).toBe(admin.id);
    });
  });

  // ── Listing moderation ──

  describe('moderateListing', () => {
    it('should unpublish and reinstate a listing', async () => {
      const admin = await createUser('ADMIN');
      const agencyUser = await createUser('AGENCY');
      const profile = await prisma.agencyProfile.create({
        data: {
          userId: agencyUser.id,
          companyName: 'Mod Agency',
          address: '123',
          contactName: 'Mod2',
          phone: '000',
          verificationStatus: 'APPROVED',
        },
      });

      const listing = await prisma.listing.create({
        data: {
          agencyProfileId: profile.id,
          category: 'SELL_PROPERTY',
          strategy: 'SINGLE_LET',
          title: 'Mod Test',
          addressLine1: '1 Test',
          city: 'London',
          postcode: 'SW1A 1AA',
        },
      });

      // Unpublish
      await adminService.moderateListing(admin.id, listing.id, 'UNPUBLISH');
      const unpublished = await prisma.listing.findUnique({ where: { id: listing.id } });
      expect(unpublished!.status).toBe('ARCHIVED');
      expect(unpublished!.archivedAt).not.toBeNull();

      // Reinstate
      await adminService.moderateListing(admin.id, listing.id, 'REINSTATE');
      const reinstated = await prisma.listing.findUnique({ where: { id: listing.id } });
      expect(reinstated!.status).toBe('PUBLISHED');
    });
  });
});