import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { MessagingService } from './messaging.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import * as argon2 from 'argon2';

describe('MessagingService', () => {
  let module: TestingModule;
  let service: MessagingService;
  let prisma: PrismaService;

  const cleanupUserIds: string[] = [];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' })],
      providers: [MessagingService, PrismaService],
    }).compile();

    service = module.get<MessagingService>(MessagingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    for (const uid of cleanupUserIds) {
      // Cascade deletes handle conversations, messages, favourites
      await prisma.agencyDocument.deleteMany({ where: { agencyProfile: { userId: uid } } }).catch(() => {});
      await prisma.listing.deleteMany({ where: { agencyProfile: { userId: uid } } }).catch(() => {});
      await prisma.agencyProfile.deleteMany({ where: { userId: uid } }).catch(() => {});
      await prisma.user.delete({ where: { id: uid } }).catch(() => {});
    }
    cleanupUserIds.length = 0;
  });

  const createUser = async (role: string, displayName: string) => {
    const hash = await argon2.hash('Passw0rd!');
    const user = await prisma.user.create({
      data: {
        email: `msg-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@propvest.test`,
        passwordHash: hash,
        role: role as any,
        displayName,
      },
    });
    cleanupUserIds.push(user.id);
    return user;
  };

  const createAgency = async () => {
    const user = await createUser('AGENCY', 'Msg Test Agency');
    await prisma.agencyProfile.create({
      data: {
        userId: user.id,
        companyName: 'Msg Test Agency Ltd',
        companyNumber: '11111111',
        address: '1 Message Street, London',
        contactName: 'Msg Agency',
        phone: '020 7777 0000',
        verificationStatus: 'APPROVED' as any,
      },
    });
    return user;
  };

  const createPublishedListing = async (agencyUserId: string) => {
    const profile = await prisma.agencyProfile.findUniqueOrThrow({ where: { userId: agencyUserId } });
    const data: Record<string, unknown> = {
      agencyProfileId: profile.id,
      title: 'Messaging Test Listing',
      category: 'RENT_TO_RENT',
      strategy: 'HMO',
      status: 'PUBLISHED',
      addressLine1: '10 Chat Road',
      city: 'London',
      postcode: 'SW1A 1AA',
      bedrooms: 2,
      bathrooms: 1,
      askingPricePence: 10000000,
    };
    return prisma.listing.create({ data: data as any });
  };

  // ── Tests ──

  it('should create conversation between buyer and agency', async () => {
    const buyer = await createUser('USER', 'Buyer Alice');
    const agency = await createAgency();
    const listing = await createPublishedListing(agency.id);

    const conv = await service.findOrCreateConversation(buyer.id, listing.id);

    expect(conv.buyerUserId).toBe(buyer.id);
    expect(conv.agencyUserId).toBe(agency.id);
    expect(conv.listingId).toBe(listing.id);
  });

  it('should return existing conversation on duplicate', async () => {
    const buyer = await createUser('USER', 'Buyer Bob');
    const agency = await createAgency();
    const listing = await createPublishedListing(agency.id);

    const conv1 = await service.findOrCreateConversation(buyer.id, listing.id);
    const conv2 = await service.findOrCreateConversation(buyer.id, listing.id);

    expect(conv1.id).toBe(conv2.id);
  });

  it('should throw NotFoundException for non-existent listing', async () => {
    const buyer = await createUser('USER', 'Buyer Carol');
    await expect(
      service.findOrCreateConversation(buyer.id, '00000000-0000-0000-0000-000000000000'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should list conversations for buyer', async () => {
    const buyer = await createUser('USER', 'Buyer Dave');
    const agency = await createAgency();
    const listing = await createPublishedListing(agency.id);

    await service.findOrCreateConversation(buyer.id, listing.id);

    const convs = await service.getConversations(buyer.id);
    expect(convs).toHaveLength(1);
    expect(convs[0]!.buyerUserId).toBe(buyer.id);
  });

  it('should list conversations for agency', async () => {
    const buyer = await createUser('USER', 'Buyer Eve');
    const agency = await createAgency();
    const listing = await createPublishedListing(agency.id);

    await service.findOrCreateConversation(buyer.id, listing.id);

    const convs = await service.getConversations(agency.id);
    expect(convs).toHaveLength(1);
    expect(convs[0]!.agencyUserId).toBe(agency.id);
  });

  it('should send and retrieve messages', async () => {
    const buyer = await createUser('USER', 'Buyer Frank');
    const agency = await createAgency();
    const listing = await createPublishedListing(agency.id);

    const conv = await service.findOrCreateConversation(buyer.id, listing.id);

    const msg1 = await service.sendMessage(conv.id, buyer.id, 'Hello, interested in this property!');
    expect(msg1.message.body).toBe('Hello, interested in this property!');

    const msg2 = await service.sendMessage(conv.id, agency.id, 'Thanks for your interest!');
    expect(msg2.message.body).toBe('Thanks for your interest!');

    const result = await service.getMessages(conv.id, buyer.id);
    expect(result.data).toHaveLength(2);
    expect(result.data[0]!.body).toBe('Hello, interested in this property!');
    expect(result.data[1]!.body).toBe('Thanks for your interest!');
  });

  it('should block third user from accessing conversation messages (403)', async () => {
    const buyer = await createUser('USER', 'Buyer Grace');
    const agency = await createAgency();
    const intruder = await createUser('USER', 'Intruder Mallory');
    const listing = await createPublishedListing(agency.id);

    const conv = await service.findOrCreateConversation(buyer.id, listing.id);

    await expect(
      service.getMessages(conv.id, intruder.id),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should block third user from sending message (403)', async () => {
    const buyer = await createUser('USER', 'Buyer Heidi');
    const agency = await createAgency();
    const intruder = await createUser('USER', 'Intruder Trudy');
    const listing = await createPublishedListing(agency.id);

    const conv = await service.findOrCreateConversation(buyer.id, listing.id);

    await expect(
      service.sendMessage(conv.id, intruder.id, 'You should not see this'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should mark messages as read', async () => {
    const buyer = await createUser('USER', 'Buyer Ivan');
    const agency = await createAgency();
    const listing = await createPublishedListing(agency.id);

    const conv = await service.findOrCreateConversation(buyer.id, listing.id);
    await service.sendMessage(conv.id, buyer.id, 'Message 1');

    // Mark as read for agency
    await service.markAsRead(conv.id, agency.id);

    const result = await service.getMessages(conv.id, buyer.id);
    expect(result.data[0]!.readAt).not.toBeNull();
  });

  it('should return unread count', async () => {
    const buyer = await createUser('USER', 'Buyer Judy');
    const agency = await createAgency();
    const listing = await createPublishedListing(agency.id);

    const conv = await service.findOrCreateConversation(buyer.id, listing.id);
    await service.sendMessage(conv.id, agency.id, 'Message to buyer');

    const count = await service.getUnreadCount(buyer.id);
    expect(count).toBe(1);
  });
});