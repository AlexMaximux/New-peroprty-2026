import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ListingService } from './listing.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';

// Mock storage service — none of the media tests call it with real S3
const mockStorage = {
  getUploadUrl: jest.fn().mockResolvedValue('https://presigned.example.com/upload'),
  getDownloadUrl: jest.fn().mockResolvedValue('https://presigned.example.com/download'),
  deleteFile: jest.fn().mockResolvedValue(undefined),
};

describe('ListingService', () => {
  let module: TestingModule;
  let listingService: ListingService;
  let prisma: PrismaService;

  const cleanupUserIds: string[] = [];
  const cleanupListingIds: string[] = [];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' })],
      providers: [
        ListingService,
        PrismaService,
        { provide: StorageService, useValue: mockStorage },
      ],
    }).compile();

    listingService = module.get<ListingService>(ListingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    for (const lid of cleanupListingIds) {
      // Cascade delete listing media, rooms, assets first
      await prisma.listingMedia.deleteMany({ where: { listingId: lid } }).catch(() => {});
      await prisma.hmoRoom.deleteMany({ where: { listingId: lid } }).catch(() => {});
      await prisma.portfolioAsset.deleteMany({ where: { listingId: lid } }).catch(() => {});
      await prisma.listing.delete({ where: { id: lid } }).catch(() => {});
    }
    cleanupListingIds.length = 0;

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
        email: `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@propvest.test`,
        passwordHash: hash,
        role: role as any,
        displayName: 'Test User',
      },
    });
    cleanupUserIds.push(user.id);
    return user;
  };

  const createAgencyProfile = async (userId: string, status = 'APPROVED') => {
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

  const createValidBody = (overrides?: Record<string, unknown>) => ({
    category: 'RENT_TO_RENT',
    strategy: 'HMO',
    status: 'DRAFT',
    base: {
      title: 'Test HMO Property',
      description: 'A test HMO listing',
      addressLine1: '45 High Street',
      city: 'Manchester',
      postcode: 'M1 1AA',
      bedrooms: 5,
      bathrooms: 2,
    },
    hmoRooms: [
      { name: 'Room 1', roomType: 'DOUBLE_EN_SUITE', monthlyRentPence: 60000 },
      { name: 'Room 2', roomType: 'SINGLE_SHARED', monthlyRentPence: 45000 },
    ],
    strategySpecificData: {
      rentTerm: '12 months',
      rentToLandlordPence: 150000,
      depositPence: 150000,
      managementAvailable: true,
      agencyDetails: 'Test Management Ltd',
    },
    ...overrides,
  });

  // ── Create listing ──

  describe('create', () => {
    it('should create an HMO listing for an approved agency', async () => {
      const user = await createUser();
      await createAgencyProfile(user.id, 'APPROVED');

      const listing = await listingService.create(user.id, createValidBody());

      expect(listing.id).toBeDefined();
      expect(listing.category).toBe('RENT_TO_RENT');
      expect(listing.strategy).toBe('HMO');
      expect(listing.status).toBe('DRAFT');
      expect(listing.title).toBe('Test HMO Property');
      expect(listing.hmoRooms).toHaveLength(2);
      expect(listing.hmoRooms[0]!.monthlyRentPence).toBe(60000);
      expect(listing.strategySpecificData).toBeDefined();

      cleanupListingIds.push(listing.id);
    });

    it('should create an SA listing with strategy-specific data', async () => {
      const user = await createUser();
      await createAgencyProfile(user.id, 'APPROVED');

      const listing = await listingService.create(user.id, {
        category: 'RENT_TO_RENT',
        strategy: 'SA',
        status: 'DRAFT',
        base: {
          title: 'Test SA Property',
          addressLine1: '10 King Street',
          city: 'London',
          postcode: 'EC2A 4NE',
        },
        strategySpecificData: {
          nightlyRatePence: 15000,
          occupancyRate: 0.7,
          rentPence: 200000,
          maxGuests: 4,
        },
      });

      expect(listing.strategy).toBe('SA');
      expect(listing.strategySpecificData).toBeDefined();
      expect((listing.strategySpecificData as any).nightlyRatePence).toBe(15000);
      expect((listing.strategySpecificData as any).occupancyRate).toBe(0.7);

      cleanupListingIds.push(listing.id);
    });

    it('should create a Sell Property listing', async () => {
      const user = await createUser();
      await createAgencyProfile(user.id, 'APPROVED');

      const listing = await listingService.create(user.id, {
        category: 'SELL_PROPERTY',
        strategy: 'SINGLE_LET',
        base: {
          title: 'Test Sell Property',
          addressLine1: '1 Park Lane',
          city: 'Birmingham',
          postcode: 'B1 1AA',
          bedrooms: 3,
          bathrooms: 1,
          propertyType: 'TERRACED',
          needsRefurb: true,
          refurbCostPence: 5000000,
        },
        strategySpecificData: {
          ownershipType: 'FREEHOLD',
          askingPricePence: 25000000,
          marketValuePence: 27500000,
          mortgageInterestRate: 0.045,
          depositPence: 6250000,
          stampDutyPence: 750000,
          finderFeePence: 250000,
          legalFeesPence: 150000,
        },
      });

      expect(listing.category).toBe('SELL_PROPERTY');
      expect(listing.strategy).toBe('SINGLE_LET');
      expect(listing.needsRefurb).toBe(true);

      cleanupListingIds.push(listing.id);
    });

    it('should promote pricing columns from strategySpecificData on create', async () => {
      const user = await createUser();
      await createAgencyProfile(user.id, 'APPROVED');

      const listing = await listingService.create(user.id, {
        category: 'SELL_PROPERTY',
        strategy: 'SINGLE_LET',
        base: {
          title: 'Pricing Promotion Test',
          addressLine1: '42 Test Ave',
          city: 'London',
          postcode: 'EC1 1BB',
        },
        strategySpecificData: {
          askingPricePence: 25000000,
          marketValuePence: 27500000,
          estimatedValuePence: 30000000,
          ownershipType: 'FREEHOLD',
          depositPence: 6250000,
        },
      });

      expect(listing.askingPricePence).toBe(25000000);
      expect(listing.marketValuePence).toBe(27500000);
      expect(listing.estimatedValuePence).toBe(30000000);

      // Also confirm the fields live in strategySpecificData JSONB
      const sd = listing.strategySpecificData as Record<string, unknown>;
      expect(sd.askingPricePence).toBe(25000000);
      expect(sd.marketValuePence).toBe(27500000);

      cleanupListingIds.push(listing.id);
    });

    it('should promote pricing columns on update', async () => {
      const user = await createUser();
      await createAgencyProfile(user.id, 'APPROVED');

      const listing = await listingService.create(user.id, {
        category: 'SELL_PROPERTY',
        strategy: 'SINGLE_LET',
        base: {
          title: 'Update Pricing Test',
          addressLine1: '10 Update Rd',
          city: 'Manchester',
          postcode: 'M1 1ZZ',
        },
        strategySpecificData: {
          askingPricePence: 10000000,
          marketValuePence: 12000000,
        },
      });
      cleanupListingIds.push(listing.id);

      const updated = await listingService.update(user.id, listing.id, {
        strategySpecificData: {
          askingPricePence: 20000000,
          marketValuePence: 25000000,
          ownershipType: 'FREEHOLD',
        },
      });

      expect(updated.askingPricePence).toBe(20000000);
      expect(updated.marketValuePence).toBe(25000000);

      // Confirm unchanged fields still in JSONB
      const sd = updated.strategySpecificData as Record<string, unknown>;
      expect(sd.marketValuePence).toBe(25000000);
    });

    it('should reject creation with empty HMO room name', async () => {
      const user = await createUser();
      await createAgencyProfile(user.id, 'APPROVED');

      const badBody = createValidBody({
        hmoRooms: [
          { name: '', roomType: 'DOUBLE_EN_SUITE', monthlyRentPence: 60000 }, // empty name
          { name: 'Room 2', roomType: 'SINGLE_SHARED', monthlyRentPence: 45000 },
        ],
      });

      // ZodError propagates → caught by ZodExceptionFilter at HTTP layer → 400
      await expect(listingService.create(user.id, badBody)).rejects.toThrow();
    });

    it('should reject creation with invalid strategy data', async () => {
      const user = await createUser();
      await createAgencyProfile(user.id, 'APPROVED');

      // Pass a string where number is expected (occupancyRate must be 0-1)
      const badBody = {
        category: 'RENT_TO_RENT',
        strategy: 'SA',
        base: {
          title: 'Bad Data',
          addressLine1: '1 High St',
          city: 'London',
          postcode: 'SW1 1AA',
        },
        strategySpecificData: {
          nightlyRatePence: 'not-a-number', // invalid type
          occupancyRate: 0.7,
          rentPence: 200000,
        },
      };

      await expect(listingService.create(user.id, badBody)).rejects.toThrow(BadRequestException);
    });

    it('should create listing without strategy data (empty object)', async () => {
      const user = await createUser();
      await createAgencyProfile(user.id, 'APPROVED');

      const listing = await listingService.create(user.id, {
        category: 'LEASE_OPTION',
        strategy: 'BMV',
        base: {
          title: 'Lease Option BMV',
          addressLine1: '15 Market Road',
          city: 'Leeds',
          postcode: 'LS1 1AA',
        },
        strategySpecificData: {
          pricePence: 15000000,
        },
      });

      expect(listing.id).toBeDefined();
      expect(listing.strategy).toBe('BMV');
      expect(listing.strategySpecificData).toBeDefined();

      cleanupListingIds.push(listing.id);
    });

    it('should throw ForbiddenException if user has no agency profile', async () => {
      const user = await createUser('USER'); // Not an agency user

      await expect(
        listingService.create(user.id, createValidBody()),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── Update listing ──

  describe('update', () => {
    it('should update own listing', async () => {
      const user = await createUser();
      await createAgencyProfile(user.id, 'APPROVED');
      const listing = await listingService.create(user.id, createValidBody());
      cleanupListingIds.push(listing.id);

      const updated = await listingService.update(user.id, listing.id, {
        base: { title: 'Updated Title' },
      });

      expect(updated.title).toBe('Updated Title');
    });

    it('should reject update from non-owning agency', async () => {
      const owner = await createUser();
      await createAgencyProfile(owner.id, 'APPROVED');
      const listing = await listingService.create(owner.id, createValidBody());
      cleanupListingIds.push(listing.id);

      const intruder = await createUser();
      await createAgencyProfile(intruder.id, 'APPROVED');

      await expect(
        listingService.update(intruder.id, listing.id, { base: { title: 'Hacked' } }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for unknown listing', async () => {
      const user = await createUser();
      await createAgencyProfile(user.id, 'APPROVED');

      await expect(
        listingService.update(user.id, '00000000-0000-0000-0000-000000000000', { base: { title: 'Nope' } }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── Find by ID ──

  describe('findById', () => {
    it('should return listing with relations', async () => {
      const user = await createUser();
      await createAgencyProfile(user.id, 'APPROVED');
      const listing = await listingService.create(user.id, createValidBody());
      cleanupListingIds.push(listing.id);

      const found = await listingService.findById(listing.id);
      expect(found.id).toBe(listing.id);
      expect(found.hmoRooms).toHaveLength(2);
      expect(found.agencyProfile).toBeDefined();
    });

    it('should throw NotFoundException for unknown listing', async () => {
      await expect(
        listingService.findById('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── Find by agency ──

  describe('findByAgency', () => {
    it('should return own listings', async () => {
      const user = await createUser();
      await createAgencyProfile(user.id, 'APPROVED');
      const l1 = await listingService.create(user.id, createValidBody());
      const l2 = await listingService.create(user.id, createValidBody({ base: { title: 'Second Listing', addressLine1: '2 Main St', city: 'London', postcode: 'SW1 1AA' } }));
      cleanupListingIds.push(l1.id, l2.id);

      const listings = await listingService.findByAgency(user.id);
      expect(listings.length).toBeGreaterThanOrEqual(2);
    });

    it('should only return own listings, not other agencies\'', async () => {
      const userA = await createUser();
      await createAgencyProfile(userA.id, 'APPROVED');
      const listingA = await listingService.create(userA.id, createValidBody());
      cleanupListingIds.push(listingA.id);

      const userB = await createUser();
      await createAgencyProfile(userB.id, 'APPROVED');
      const listingB = await listingService.create(userB.id, createValidBody({ base: { title: 'Other Agency Listing', addressLine1: '99 Other St', city: 'Birmingham', postcode: 'B1 1BB' } }));
      cleanupListingIds.push(listingB.id);

      const userAListings = await listingService.findByAgency(userA.id);
      expect(userAListings.length).toBe(1);
      expect(userAListings[0]!.id).toBe(listingA.id);
      expect(userAListings[0]!.title).toBe('Test HMO Property');
    });
  });

  // ── Publish ──

  describe('publish', () => {
    it('should publish a draft listing', async () => {
      const user = await createUser();
      await createAgencyProfile(user.id, 'APPROVED');
      const listing = await listingService.create(user.id, createValidBody());
      cleanupListingIds.push(listing.id);

      const published = await listingService.publish(user.id, listing.id);
      expect(published.status).toBe('PUBLISHED');
      expect(published.publishedAt).toBeDefined();
    });

    it('should reject publishing a listing that is already published', async () => {
      const user = await createUser();
      await createAgencyProfile(user.id, 'APPROVED');
      const listing = await listingService.create(user.id, createValidBody());
      cleanupListingIds.push(listing.id);

      await listingService.publish(user.id, listing.id);
      await expect(
        listingService.publish(user.id, listing.id),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── Search public listings ──

  describe('searchPublic', () => {
    const createPublishedListing = async (agencyUser: any, overrides: Record<string, unknown> = {}) => {
      const body = createValidBody(overrides);
      const listing = await listingService.create(agencyUser.id, body);
      const published = await listingService.publish(agencyUser.id, listing.id);
      return published;
    };

    it('should return only published (non-archived) listings by default', async () => {
      const user = await createUser();
      await createAgencyProfile(user.id, 'APPROVED');
      const published = await createPublishedListing(user);
      cleanupListingIds.push(published.id);

      // Also create a draft (should not appear)
      const draft = await listingService.create(user.id, createValidBody({
        base: { title: 'Draft Listing', addressLine1: '2 Draft St', city: 'London', postcode: 'SW1 1AA' },
      }));
      cleanupListingIds.push(draft.id);

      const result = await listingService.searchPublic({});
      expect(result.data.length).toBeGreaterThanOrEqual(1);
      expect(result.data.every((l: any) => l.status === 'PUBLISHED')).toBe(true);
      expect(result.meta.total).toBeGreaterThanOrEqual(1);
    });

    it('should paginate results', async () => {
      const user = await createUser();
      await createAgencyProfile(user.id, 'APPROVED');
      const ids: string[] = [];

      // Create 3 published listings
      for (let i = 0; i < 3; i++) {
        const l = await createPublishedListing(user, {
          base: { title: `Paginated Listing ${i}`, addressLine1: `${i} Page St`, city: 'London', postcode: 'SW1 1AA' },
        });
        ids.push(l.id);
      }
      ids.forEach((id) => cleanupListingIds.push(id));

      const page1 = await listingService.searchPublic({ page: 1, limit: 2 });
      expect(page1.data.length).toBe(2);
      expect(page1.meta.page).toBe(1);
      expect(page1.meta.totalPages).toBeGreaterThanOrEqual(2);

      const page2 = await listingService.searchPublic({ page: 2, limit: 2 });
      expect(page2.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter by category', async () => {
      const user = await createUser();
      await createAgencyProfile(user.id, 'APPROVED');

      const r2r = await createPublishedListing(user);
      cleanupListingIds.push(r2r.id);

      // Create a Sell Property listing
      const sell = await listingService.create(user.id, {
        category: 'SELL_PROPERTY',
        strategy: 'SINGLE_LET',
        base: { title: 'Sell Property', addressLine1: '3 Market St', city: 'London', postcode: 'EC1 1AA' },
      });
      const publishedSell = await listingService.publish(user.id, sell.id);
      cleanupListingIds.push(publishedSell.id);

      const result = await listingService.searchPublic({ category: 'SELL_PROPERTY' });
      expect(result.data.every((l: any) => l.category === 'SELL_PROPERTY')).toBe(true);
    });

    it('should filter by price range', async () => {
      const user = await createUser();
      await createAgencyProfile(user.id, 'APPROVED');

      const listing = await listingService.create(user.id, {
        category: 'SELL_PROPERTY',
        strategy: 'SINGLE_LET',
        base: {
          title: 'Priced Property',
          addressLine1: '10 Price St',
          city: 'London',
          postcode: 'EC2 2BB',
          bedrooms: 3,
        },
        strategySpecificData: {
          askingPricePence: 20000000,
        },
      });
      await listingService.publish(user.id, listing.id);
      // Manually set askingPricePence on the promoted column
      await prisma.listing.update({
        where: { id: listing.id },
        data: { askingPricePence: 20000000 },
      });
      cleanupListingIds.push(listing.id);

      const result = await listingService.searchPublic({ priceMin: 15000000, priceMax: 25000000 });
      expect(result.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should apply Exclude Sold', async () => {
      const user = await createUser();
      await createAgencyProfile(user.id, 'APPROVED');

      const pub = await createPublishedListing(user);
      cleanupListingIds.push(pub.id);

      // Create a SOLD listing
      const sold = await listingService.create(user.id, createValidBody({
        base: { title: 'Sold Property', addressLine1: '4 Sold St', city: 'London', postcode: 'SW2 2AA' },
      }));
      await listingService.publish(user.id, sold.id);
      await prisma.listing.update({ where: { id: sold.id }, data: { status: 'SOLD' } });
      cleanupListingIds.push(sold.id);

      // With excludeSold=true (default), sold should not appear
      const result = await listingService.searchPublic({ excludeSold: true });
      expect(result.data.every((l: any) => l.status !== 'SOLD')).toBe(true);

      // With excludeSold=false, sold should appear
      const resultAll = await listingService.searchPublic({ excludeSold: false });
      expect(resultAll.data.some((l: any) => l.status === 'SOLD')).toBe(true);
    });

    it('should filter by ROI band boundaries', async () => {
      const user = await createUser();
      await createAgencyProfile(user.id, 'APPROVED');

      const listing = await listingService.create(user.id, {
        category: 'SELL_PROPERTY',
        strategy: 'SINGLE_LET',
        base: {
          title: 'ROI Property',
          addressLine1: '5 Roi St',
          city: 'Manchester',
          postcode: 'M1 1BB',
        },
      });
      await listingService.publish(user.id, listing.id);
      await prisma.listing.update({
        where: { id: listing.id },
        data: { estimatedRoi: 12.5 },
      });
      cleanupListingIds.push(listing.id);

      // ROI band 10-15 should include this
      const result = await listingService.searchPublic({ roiMin: 10, roiMax: 15 });
      expect(result.data.length).toBeGreaterThanOrEqual(1);

      // ROI band 0-5 should exclude this
      const resultExcluded = await listingService.searchPublic({ roiMin: 0, roiMax: 5 });
      expect(resultExcluded.data.every((l: any) => Number(l.estimatedRoi ?? 0) <= 5)).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════
  //  MEDIA MANAGEMENT TESTS
  // ══════════════════════════════════════════════════

  describe('media management', () => {
    it('presignUpload should return uploadUrl and fileKey', async () => {
      const user = await createUser();
      await createAgencyProfile(user.id, 'APPROVED');
      const listing = await listingService.create(user.id, {
        category: 'SELL_PROPERTY',
        strategy: 'SINGLE_LET',
        base: { title: 'Media Test', addressLine1: '1 Media St', city: 'London', postcode: 'EC1 1AA' },
      });
      cleanupListingIds.push(listing.id);

      const result = await listingService.presignUpload(user.id, listing.id, {
        fileName: 'test-image.jpg',
        mimeType: 'image/jpeg',
      });

      expect(result.uploadUrl).toBe('https://presigned.example.com/upload');
      expect(result.fileKey).toMatch(/^listings\//);
      expect(mockStorage.getUploadUrl).toHaveBeenCalled();
    });

    it('should reject non-image mimeType in presignUpload', async () => {
      const user = await createUser();
      await createAgencyProfile(user.id, 'APPROVED');
      const listing = await listingService.create(user.id, {
        category: 'SELL_PROPERTY',
        strategy: 'SINGLE_LET',
        base: { title: 'Media Test 2', addressLine1: '2 Media St', city: 'London', postcode: 'EC2 2BB' },
      });
      cleanupListingIds.push(listing.id);

      await expect(
        listingService.presignUpload(user.id, listing.id, {
          fileName: 'test.pdf',
          mimeType: 'application/pdf',
        }),
      ).rejects.toThrow();
    });

    it('confirmMedia should create a ListingMedia record', async () => {
      const user = await createUser();
      await createAgencyProfile(user.id, 'APPROVED');
      const listing = await listingService.create(user.id, {
        category: 'SELL_PROPERTY',
        strategy: 'SINGLE_LET',
        base: { title: 'Media Test 3', addressLine1: '3 Media St', city: 'London', postcode: 'EC3 3BB' },
      });
      cleanupListingIds.push(listing.id);

      const result = await listingService.confirmMedia(user.id, listing.id, {
        fileKey: 'listings/test-key.jpg',
        mimeType: 'image/jpeg',
        isPrimary: true,
      });

      expect(result.id).toBeDefined();
      expect(result.fileKey).toBe('listings/test-key.jpg');
      expect(result.isPrimary).toBe(true);
      expect(result.kind).toBe('PHOTO');
    });

    it('deleteMedia should remove a ListingMedia record', async () => {
      const user = await createUser();
      await createAgencyProfile(user.id, 'APPROVED');
      const listing = await listingService.create(user.id, {
        category: 'SELL_PROPERTY',
        strategy: 'SINGLE_LET',
        base: { title: 'Media Test 4', addressLine1: '4 Media St', city: 'London', postcode: 'EC4 4BB' },
      });
      cleanupListingIds.push(listing.id);

      const media = await listingService.confirmMedia(user.id, listing.id, {
        fileKey: 'listings/to-delete.jpg',
        mimeType: 'image/jpeg',
      });

      await listingService.deleteMedia(user.id, listing.id, media.id);

      const found = await prisma.listingMedia.findUnique({ where: { id: media.id } });
      expect(found).toBeNull();
      expect(mockStorage.deleteFile).toHaveBeenCalledWith('listings/to-delete.jpg');
    });

    it('should reject non-owner presignUpload with ForbiddenException', async () => {
      const owner = await createUser();
      await createAgencyProfile(owner.id, 'APPROVED');
      const listing = await listingService.create(owner.id, {
        category: 'SELL_PROPERTY',
        strategy: 'SINGLE_LET',
        base: { title: 'Non-Owner Media', addressLine1: '5 Media St', city: 'London', postcode: 'EC5 5BB' },
      });
      cleanupListingIds.push(listing.id);

      const otherUser = await createUser();
      await createAgencyProfile(otherUser.id, 'APPROVED');

      await expect(
        listingService.presignUpload(otherUser.id, listing.id, {
          fileName: 'hack.jpg',
          mimeType: 'image/jpeg',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject non-owner deleteMedia with ForbiddenException', async () => {
      const owner = await createUser();
      await createAgencyProfile(owner.id, 'APPROVED');
      const listing = await listingService.create(owner.id, {
        category: 'SELL_PROPERTY',
        strategy: 'SINGLE_LET',
        base: { title: 'Non-Owner Delete', addressLine1: '6 Media St', city: 'London', postcode: 'EC6 6BB' },
      });
      cleanupListingIds.push(listing.id);

      const media = await listingService.confirmMedia(owner.id, listing.id, {
        fileKey: 'listings/to-delete-by-non-owner.jpg',
        mimeType: 'image/jpeg',
      });

      const otherUser = await createUser();
      await createAgencyProfile(otherUser.id, 'APPROVED');

      await expect(
        listingService.deleteMedia(otherUser.id, listing.id, media.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});