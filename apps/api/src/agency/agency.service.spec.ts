import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AgencyService } from './agency.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';

describe('AgencyService + Admin integration', () => {
  let module: TestingModule;
  let agencyService: AgencyService;
  let prisma: PrismaService;

  const cleanupUserIds: string[] = [];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
      ],
      providers: [AgencyService, PrismaService, StorageService],
    }).compile();

    agencyService = module.get<AgencyService>(AgencyService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    for (const uid of cleanupUserIds) {
      await prisma.user.delete({ where: { id: uid } }).catch(() => {});
    }
    cleanupUserIds.length = 0;
  });

  const createUser = async (overrides?: {
    role?: string;
    agencyStatus?: string;
  }) => {
    const hash = await argon2.hash('Passw0rd!');
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@propvest.test`,
        passwordHash: hash,
        role: (overrides?.role ?? 'AGENCY') as any,
        displayName: 'Test User',
      },
    });
    cleanupUserIds.push(user.id);
    return user;
  };

  const createAgencyProfile = async (userId: string, status = 'PENDING') => {
    return prisma.agencyProfile.create({
      data: {
        userId,
        companyName: 'Test Agency Ltd',
        companyNumber: '12345678',
        address: '123 Test Street, London',
        contactName: 'Test Contact',
        phone: '020 1234 5678',
        verificationStatus: status as any,
      },
    });
  };

  // ── Agency Profile ──

  describe('AgencyService.createProfile', () => {
    it('should create an agency profile', async () => {
      const user = await createUser();
      const profile = await agencyService.createProfile(user.id, {
        companyName: 'New Agency Ltd',
        companyNumber: '87654321',
        address: '45 High Street, Manchester',
        contactName: 'John Doe',
        phone: '0161 234 5678',
      });

      expect(profile.companyName).toBe('New Agency Ltd');
      expect(profile.verificationStatus).toBe('PENDING');

      const found = await prisma.agencyProfile.findUnique({ where: { id: profile.id } });
      expect(found).not.toBeNull();
    });

    it('should update existing profile and reset to PENDING', async () => {
      const user = await createUser();
      await createAgencyProfile(user.id, 'REJECTED');

      const updated = await agencyService.createProfile(user.id, {
        companyName: 'Updated Ltd',
        address: 'New Address',
        contactName: 'Jane',
        phone: '020 9999 8888',
      });

      expect(updated.companyName).toBe('Updated Ltd');
      expect(updated.verificationStatus).toBe('PENDING');
      expect(updated.rejectionReason).toBeNull();
    });
  });

  describe('AgencyService.getMyProfile', () => {
    it('should return own profile with documents', async () => {
      const user = await createUser();
      const profile = await createAgencyProfile(user.id);

      const result = await agencyService.getMyProfile(user.id);
      expect(result.id).toBe(profile.id);
      expect(result.documents).toEqual([]);
    });

    it('should throw NotFoundException if no profile', async () => {
      const user = await createUser();
      await expect(agencyService.getMyProfile(user.id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('AgencyService.listDocuments', () => {
    it('should list own documents', async () => {
      const user = await createUser();
      const profile = await createAgencyProfile(user.id);

      await prisma.agencyDocument.create({
        data: {
          agencyProfileId: profile.id,
          fileKey: 'test-key.pdf',
          originalName: 'test.pdf',
          type: 'COMPANY_REGISTRATION',
        },
      });

      const docs = await agencyService.listDocuments(user.id);
      expect(docs).toHaveLength(1);
      expect(docs[0]!.originalName).toBe('test.pdf');
    });
  });

  // ── Permission failure cases ──

  describe('permission failures', () => {
    it('should reject document access from another agency', async () => {
      // Agency A creates profile and document
      const userA = await createUser();
      const profileA = await createAgencyProfile(userA.id);
      const doc = await prisma.agencyDocument.create({
        data: {
          agencyProfileId: profileA.id,
          fileKey: 'a-key.pdf',
          originalName: 'a-doc.pdf',
          type: 'ID',
        },
      });

      // Agency B tries to read Agency A's document
      const userB = await createUser();
      await createAgencyProfile(userB.id);

      await expect(
        agencyService.getDocumentDownloadUrl(userB.id, doc.id),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject document download for non-existent document', async () => {
      const user = await createUser();
      await createAgencyProfile(user.id);

      await expect(
        agencyService.getDocumentDownloadUrl(user.id, '00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});