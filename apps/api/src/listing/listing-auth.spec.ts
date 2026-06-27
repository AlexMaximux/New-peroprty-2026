import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

describe('Listing Auth Guard (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let module: TestingModule;
  let agencyUserId: string;
  let accessToken: string;

  const validListingBody = {
    category: 'RENT_TO_RENT',
    strategy: 'HMO',
    status: 'PUBLISHED',
    base: {
      title: 'Test HMO via API',
      addressLine1: '123 Test Street',
      city: 'Manchester',
      postcode: 'M1 1AA',
      bedrooms: 5,
    },
    hmoRooms: [
      { name: 'Room 1', roomType: 'DOUBLE_EN_SUITE', monthlyRentPence: 60000 },
      { name: 'Room 2', roomType: 'SINGLE_SHARED', monthlyRentPence: 45000 },
    ],
    strategySpecificData: {
      rentToLandlordPence: 150000,
      depositPence: 150000,
    },
  };

  beforeAll(async () => {
    const { AppModule } = await import('../app.module');
    const { NestFactory } = await import('@nestjs/core');

    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);

    // Create a real Nest app instance for HTTP testing
    app = await NestFactory.create(AppModule);
    // Match main.ts setup
    app.setGlobalPrefix('api/v1', { exclude: ['health'] });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // Create APPROVED agency user
    const passwordHash = await argon2.hash('Passw0rd!');
    const user = await prisma.user.create({
      data: {
        email: 'agency1@demo.test',
        passwordHash,
        role: 'AGENCY',
        displayName: 'Demo Agency',
        status: 'ACTIVE',
      },
    });
    agencyUserId = user.id;

    await prisma.agencyProfile.create({
      data: {
        userId: user.id,
        companyName: 'Demo Agency Ltd',
        address: '1 Demo Street',
        contactName: 'Demo Contact',
        phone: '01234567890',
        verificationStatus: 'APPROVED',
      },
    });

    // Generate JWT token matching the API's secret
    const { ConfigService } = await import('@nestjs/config');
    const configService = module.get(ConfigService);
    const jwtSecret = configService.get('JWT_ACCESS_SECRET') ?? 'test-secret';

    // Generate token manually with the same logic JWT strategy uses
    const payload = { sub: user.id, email: user.email, role: user.role };
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.createHmac('sha256', jwtSecret).update(`${header}.${payloadB64}`).digest('base64url');
    accessToken = `${header}.${payloadB64}.${signature}`;
  });

  afterAll(async () => {
    await prisma.listing.deleteMany({ where: { agencyProfile: { userId: agencyUserId } } });
    await prisma.agencyProfile.deleteMany({ where: { userId: agencyUserId } });
    await prisma.user.delete({ where: { id: agencyUserId } });
    await prisma.$disconnect();
    await app.close();
  });

  describe('/listings POST (publish flow)', () => {
    it('should create listing with valid token (201)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/listings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validListingBody);

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.category).toBe('RENT_TO_RENT');
      expect(response.body.hmoRooms).toHaveLength(2);
    });

    it('should reject with 401 for missing token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/listings')
        .send(validListingBody);

      expect(response.status).toBe(401);
    });

    it('should reject with 401 for invalid token format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/listings')
        .set('Authorization', 'Bearer invalid-token-12345')
        .send(validListingBody);

      expect(response.status).toBe(401);
    });

    it('should reject with 403 for pending agency (not APPROVED)', async () => {
      // Create a PENDING agency user
      const passwordHash = await argon2.hash('Passw0rd!');
      const pendingUser = await prisma.user.create({
        data: {
          email: `pending-${Date.now()}@demo.test`,
          passwordHash,
          role: 'AGENCY',
          displayName: 'Pending Agency',
          status: 'ACTIVE',
        },
      });
      await prisma.agencyProfile.create({
        data: {
          userId: pendingUser.id,
          companyName: 'Pending Agency Ltd',
          address: '1 Pending Street',
          contactName: 'Pending Contact',
          phone: '01234567890',
          verificationStatus: 'PENDING',
        },
      });

      // Generate token manually for pending user
      const { ConfigService } = await import('@nestjs/config');
      const configService = module.get(ConfigService);
      const jwtSecret = configService.get('JWT_ACCESS_SECRET') ?? 'test-secret';
      const payload = { sub: pendingUser.id, email: pendingUser.email, role: pendingUser.role };
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const signature = crypto.createHmac('sha256', jwtSecret).update(`${header}.${payloadB64}`).digest('base64url');
      const pendingToken = `${header}.${payloadB64}.${signature}`;

      const response = await request(app.getHttpServer())
        .post('/api/v1/listings')
        .set('Authorization', `Bearer ${pendingToken}`)
        .send(validListingBody);

      expect(response.status).toBe(403);

      // Cleanup
      await prisma.user.delete({ where: { id: pendingUser.id } });
    });
  });
});