import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  createListingSchema,
  updateListingSchema,
  getStrategyDataSchema,
} from '@propvest/shared';

@Injectable()
export class ListingService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Create a new listing (agency only — ApprovedAgencyGuard applied at controller level).
   */
  async create(userId: string, body: unknown) {
    // 1. Parse base + listing-level data
    const parsed = createListingSchema.parse(body);

    // 2. Resolve agency profile for this user
    const agencyProfile = await this.prisma.agencyProfile.findUnique({
      where: { userId },
    });
    if (!agencyProfile) {
      throw new ForbiddenException('User does not have an agency profile');
    }

    // 3. Validate strategy-specific JSONB against the correct Zod schema
    let validatedStrategyData: Record<string, unknown> | undefined;
    if (parsed.strategySpecificData && Object.keys(parsed.strategySpecificData).length > 0) {
      const schema = getStrategyDataSchema(parsed.category, parsed.strategy ?? null);
      const result = schema.safeParse(parsed.strategySpecificData);
      if (!result.success) {
        throw new BadRequestException({
          message: 'Invalid strategy-specific data',
          code: 'INVALID_STRATEGY_DATA',
          details: result.error.flatten(),
        });
      }
      validatedStrategyData = result.data as Record<string, unknown>;
    }

    // 4. Create listing with nested relations
    const listing = await this.prisma.listing.create({
      data: {
        agencyProfileId: agencyProfile.id,
        category: parsed.category as any,
        strategy: (parsed.strategy ?? null) as any,
        status: (parsed.status ?? 'DRAFT') as any,
        title: parsed.base.title,
        description: parsed.base.description,
        propertyType: (parsed.base.propertyType ?? null) as any,
        propertyTypeOther: parsed.base.propertyTypeOther,
        internalRef: parsed.base.internalRef,
        addressLine1: parsed.base.addressLine1,
        addressLine2: parsed.base.addressLine2,
        city: parsed.base.city,
        postcode: parsed.base.postcode,
        buildingNumber: parsed.base.buildingNumber,
        region: parsed.base.region,
        nation: (parsed.base.nation ?? null) as any,
        regionGroup: (parsed.base.regionGroup ?? null) as any,
        latitude: parsed.base.latitude,
        longitude: parsed.base.longitude,
        bedrooms: parsed.base.bedrooms,
        bathrooms: parsed.base.bathrooms,
        floorArea: parsed.base.floorArea,
        hasLivingRoom: parsed.base.hasLivingRoom,
        hasGarden: parsed.base.hasGarden,
        gardenNotes: parsed.base.gardenNotes,
        parking: parsed.base.parking,
        furnishedStatus: (parsed.base.furnishedStatus ?? null) as any,
        furnishingQuality: parsed.base.furnishingQuality,
        furnishingNotes: parsed.base.furnishingNotes,
        isVacant: parsed.base.isVacant,
        isTenanted: parsed.base.isTenanted,
        isLicensed: parsed.base.isLicensed,
        needsRefurb: parsed.base.needsRefurb,
        refurbQuoteType: (parsed.base.refurbQuoteType ?? null) as any,
        refurbCostPence: parsed.base.refurbCostPence,
        strategySpecificData: (validatedStrategyData ?? undefined) as any,
        hmoRooms: parsed.hmoRooms.length > 0 ? {
          create: parsed.hmoRooms.map((room) => ({
            name: room.name,
            roomType: room.roomType as any,
            monthlyRentPence: room.monthlyRentPence,
          })),
        } : undefined,
        portfolioAssets: parsed.portfolioAssets.length > 0 ? {
          create: parsed.portfolioAssets.map((asset) => ({
            name: asset.name,
            assetType: asset.assetType,
            valuePence: asset.valuePence,
            notes: asset.notes,
            order: asset.order ?? 0,
          })),
        } : undefined,
        media: parsed.media.length > 0 ? {
          create: parsed.media.map((m) => ({
            kind: m.kind as any,
            fileKey: m.fileKey,
            originalName: m.originalName,
          })),
        } : undefined,
      },
      include: {
        media: true,
        hmoRooms: true,
        portfolioAssets: true,
      },
    });

    return listing;
  }

  /**
   * Update an existing listing (ownership check: only the owning agency can update).
   */
  async update(userId: string, listingId: string, body: unknown) {
    // 1. Fetch the listing with its agency profile to check ownership
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { agencyProfile: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // 2. Ownership check
    if (listing.agencyProfile.userId !== userId) {
      throw new ForbiddenException('You can only update your own listings');
    }

    // 3. Parse update data
    const parsed = updateListingSchema.parse(body);

    // 4. Validate strategy-specific data if provided
    let validatedStrategyData: Record<string, unknown> | undefined;
    if (parsed.strategySpecificData && Object.keys(parsed.strategySpecificData).length > 0) {
      const category = parsed.category ?? listing.category;
      const strategy = parsed.strategy ?? listing.strategy;
      const schema = getStrategyDataSchema(category as string, strategy as string | null);
      const result = schema.safeParse(parsed.strategySpecificData);
      if (!result.success) {
        throw new BadRequestException({
          message: 'Invalid strategy-specific data',
          code: 'INVALID_STRATEGY_DATA',
          details: result.error.flatten(),
        });
      }
      validatedStrategyData = result.data as Record<string, unknown>;
    }

    // 5. Build the update payload
    const updateData: any = {};

    if (parsed.status !== undefined) updateData.status = parsed.status as any;
    if (parsed.strategy !== undefined) updateData.strategy = parsed.strategy as any;
    if (parsed.strategySpecificData !== undefined) updateData.strategySpecificData = validatedStrategyData as any;

    if (parsed.base) {
      const b = parsed.base;
      if (b.title !== undefined) updateData.title = b.title;
      if (b.description !== undefined) updateData.description = b.description;
      if (b.propertyType !== undefined) updateData.propertyType = b.propertyType as any;
      if (b.propertyTypeOther !== undefined) updateData.propertyTypeOther = b.propertyTypeOther;
      if (b.internalRef !== undefined) updateData.internalRef = b.internalRef;
      if (b.addressLine1 !== undefined) updateData.addressLine1 = b.addressLine1;
      if (b.addressLine2 !== undefined) updateData.addressLine2 = b.addressLine2;
      if (b.city !== undefined) updateData.city = b.city;
      if (b.postcode !== undefined) updateData.postcode = b.postcode;
      if (b.buildingNumber !== undefined) updateData.buildingNumber = b.buildingNumber;
      if (b.region !== undefined) updateData.region = b.region;
      if (b.nation !== undefined) updateData.nation = b.nation as any;
      if (b.regionGroup !== undefined) updateData.regionGroup = b.regionGroup as any;
      if (b.latitude !== undefined) updateData.latitude = b.latitude;
      if (b.longitude !== undefined) updateData.longitude = b.longitude;
      if (b.bedrooms !== undefined) updateData.bedrooms = b.bedrooms;
      if (b.bathrooms !== undefined) updateData.bathrooms = b.bathrooms;
      if (b.floorArea !== undefined) updateData.floorArea = b.floorArea;
      if (b.hasLivingRoom !== undefined) updateData.hasLivingRoom = b.hasLivingRoom;
      if (b.hasGarden !== undefined) updateData.hasGarden = b.hasGarden;
      if (b.gardenNotes !== undefined) updateData.gardenNotes = b.gardenNotes;
      if (b.parking !== undefined) updateData.parking = b.parking;
      if (b.furnishedStatus !== undefined) updateData.furnishedStatus = b.furnishedStatus as any;
      if (b.furnishingQuality !== undefined) updateData.furnishingQuality = b.furnishingQuality;
      if (b.furnishingNotes !== undefined) updateData.furnishingNotes = b.furnishingNotes;
      if (b.isVacant !== undefined) updateData.isVacant = b.isVacant;
      if (b.isTenanted !== undefined) updateData.isTenanted = b.isTenanted;
      if (b.isLicensed !== undefined) updateData.isLicensed = b.isLicensed;
      if (b.needsRefurb !== undefined) updateData.needsRefurb = b.needsRefurb;
      if (b.refurbQuoteType !== undefined) updateData.refurbQuoteType = b.refurbQuoteType as any;
      if (b.refurbCostPence !== undefined) updateData.refurbCostPence = b.refurbCostPence;
    }

    // 6. Update listing
    const updated = await this.prisma.listing.update({
      where: { id: listingId },
      data: updateData,
      include: {
        media: true,
        hmoRooms: true,
        portfolioAssets: true,
      },
    });

    return updated;
  }

  /**
   * Get a single listing by ID.
   */
  async findById(listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        media: { orderBy: { order: 'asc' } },
        hmoRooms: true,
        portfolioAssets: { orderBy: { order: 'asc' } },
        agencyProfile: {
          include: {
            user: { select: { displayName: true } },
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return listing;
  }

  /**
   * List listings for the current agency.
   */
  async findByAgency(userId: string) {
    const agencyProfile = await this.prisma.agencyProfile.findUnique({
      where: { userId },
    });
    if (!agencyProfile) {
      throw new ForbiddenException('User does not have an agency profile');
    }

    return this.prisma.listing.findMany({
      where: { agencyProfileId: agencyProfile.id },
      include: {
        media: { take: 1, orderBy: { order: 'asc' } },
        hmoRooms: true,
        _count: { select: { conversations: true, favourites: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Publish a draft listing.
   */
  async publish(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { agencyProfile: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.agencyProfile.userId !== userId) {
      throw new ForbiddenException('You can only publish your own listings');
    }

    if (listing.status !== 'DRAFT') {
      throw new BadRequestException('Only draft listings can be published');
    }

    return this.prisma.listing.update({
      where: { id: listingId },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
      include: {
        media: true,
        hmoRooms: true,
        portfolioAssets: true,
      },
    });
  }
}