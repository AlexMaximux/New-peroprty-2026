import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { FavouritesService } from './favourites.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';

describe('FavouritesService', () => {
  let module: TestingModule;
  let service: FavouritesService;
  let prisma: PrismaService;

  const cleanupIds: string[] = [];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' })],
      providers: [FavouritesService, PrismaService],
    }).compile();

    service = module.get<FavouritesService>(FavouritesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up in reverse dependency order
    for (const uid of cleanupIds) {
      await prisma.favourite.deleteMany({ where: { userId: uid } }).catch(() => {});
      await prisma.agencyDocument.deleteMany({ where: { agencyProfile: { userId: uid } } }).catch(() => {});
      await prisma.listing.deleteMany({ where: { agencyProfile: { userId: uid } } }).catch(() => {});
      await prisma.agencyProfile.deleteMany({ where: { userId: uid } }).catch(() => {});
      await prisma.user.delete({ where: { id: uid } }).catch(() => {});
    }
    cleanupIds.length = 0;
  });

  const createUser = async (role = 'USER') => {
    const hash = await argon2.hash('Passw0rd!');
    const user = await prisma.user.create({
      data: {
        email: `fav-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@propvest.test`,
        passwordHash: hash,
        role: role as any,
        displayName: 'Fav Test User',
      },
    });
    cleanupIds.push(user.id);
    return user;
  };

  const createAgencyUser = async () => {
    const user = await createUser('AGENCY');
    await prisma.agencyProfile.create({
      data: {
        userId: user.id,
        companyName: 'Fav Test Agency Ltd',
        companyNumber: '99999999',
        address: '1 Test Street, London',
        contactName: 'Fav Test',
        phone: '020 8888 0000',
        verificationStatus: 'APPROVED' as any,
      },
    });
    return user;
  };

  const createPublishedListing = async (userId: string) => {
    const profile = await prisma.agencyProfile.findUniqueOrThrow({ where: { userId } });
    const data: Record<string, unknown> = {
      agencyProfileId: profile.id,
      title: 'Test Listing for Favourites',
      category: 'RENT_TO_RENT',
      strategy: 'HMO',
      status: 'PUBLISHED',
      addressLine1: '99 Test Road',
      city: 'London',
      postcode: 'SW1A 1AA',
      bedrooms: 2,
      bathrooms: 1,
      askingPricePence: 25000000,
    };
    return prisma.listing.create({ data: data as any });
  };

  // ── Tests ──

  it('should add a favourite', async () => {
    const buyer = await createUser();
    const agency = await createAgencyUser();
    const listing = await createPublishedListing(agency.id);

    const result = await service.add(buyer.id, listing.id);

    expect(result.userId).toBe(buyer.id);
    expect(result.listingId).toBe(listing.id);
  });

  it('should be idempotent on duplicate add', async () => {
    const buyer = await createUser();
    const agency = await createAgencyUser();
    const listing = await createPublishedListing(agency.id);

    await service.add(buyer.id, listing.id);
    // Second add should not throw
    await expect(service.add(buyer.id, listing.id)).resolves.toBeDefined();
  });

  it('should throw NotFoundException for non-existent listing', async () => {
    const buyer = await createUser();
    await expect(
      service.add(buyer.id, '00000000-0000-0000-0000-000000000000'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should remove a favourite', async () => {
    const buyer = await createUser();
    const agency = await createAgencyUser();
    const listing = await createPublishedListing(agency.id);

    await service.add(buyer.id, listing.id);
    await service.remove(buyer.id, listing.id);

    // Verify it's gone
    const favs = await service.findByUser(buyer.id);
    expect(favs).toHaveLength(0);
  });

  it('should silently succeed on removing non-existent favourite', async () => {
    const buyer = await createUser();
    await expect(
      service.remove(buyer.id, '00000000-0000-0000-0000-000000000000'),
    ).resolves.toBeUndefined();
  });

  it('should list favourites for a user with listing details', async () => {
    const buyer = await createUser();
    const agency = await createAgencyUser();
    const listing = await createPublishedListing(agency.id);

    await service.add(buyer.id, listing.id);

    const favs = await service.findByUser(buyer.id);
    expect(favs).toHaveLength(1);
    expect(favs[0]!.listing.id).toBe(listing.id);
    expect(favs[0]!.listing.title).toBe('Test Listing for Favourites');
    expect(favs[0]!.listing.agencyProfile).toBeDefined();
  });

  it('should return empty list for user with no favourites', async () => {
    const buyer = await createUser();
    const favs = await service.findByUser(buyer.id);
    expect(favs).toHaveLength(0);
  });

  it('should not show another user\'s favourites', async () => {
    const buyer1 = await createUser();
    const buyer2 = await createUser();
    const agency = await createAgencyUser();
    const listing = await createPublishedListing(agency.id);

    await service.add(buyer1.id, listing.id);

    const favs2 = await service.findByUser(buyer2.id);
    expect(favs2).toHaveLength(0);
  });
});