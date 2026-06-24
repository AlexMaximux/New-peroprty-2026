import { z } from 'zod';

// ── Enums (matching Prisma schema) ────────────────────────────────────────────

export const listingCategorySchema = z.enum([
  'RENT_TO_RENT',
  'LEASE_OPTION',
  'SELL_PROPERTY',
  'PORTFOLIO',
  'COMMERCIAL',
  'DEVELOPMENT_OPPORTUNITY',
  'REFURB_OPPORTUNITY',
]);
export type ListingCategory = z.infer<typeof listingCategorySchema>;

export const listingStrategySchema = z.enum([
  'HMO',
  'SA',
  'SINGLE_LET',
  'HIGH_ROI',
  'CASH_PURCHASE',
  'COMMERCIAL',
  'MIXED_USE',
  'HOTEL',
  'SHOP',
  'FLAT_CONVERSION',
  'ADD_BEDROOM',
  'EXTENSION',
  'LOFT_CONVERSION',
  'BMV',
]);
export type ListingStrategy = z.infer<typeof listingStrategySchema>;

export const listingStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'RESERVED', 'SOLD', 'ARCHIVED']);
export type ListingStatus = z.infer<typeof listingStatusSchema>;

export const propertyTypeSchema = z.enum(['TERRACED', 'FLAT', 'DETACHED', 'SEMI_DETACHED', 'OTHER']);
export type PropertyType = z.infer<typeof propertyTypeSchema>;

export const furnishedStatusSchema = z.enum(['UNFURNISHED', 'FURNISHED', 'SEMI_FURNISHED']);
export type FurnishedStatus = z.infer<typeof furnishedStatusSchema>;

export const hmoRoomTypeSchema = z.enum([
  'DOUBLE_EN_SUITE',
  'DOUBLE_SHARED',
  'SINGLE_EN_SUITE',
  'SINGLE_SHARED',
  'OTHER',
]);
export type HmoRoomType = z.infer<typeof hmoRoomTypeSchema>;

export const referenceRequirementSchema = z.enum(['EASY', 'FULL', 'LTD', 'OTHER']);
export type ReferenceRequirement = z.infer<typeof referenceRequirementSchema>;

export const nationSchema = z.enum(['ENGLAND', 'WALES', 'SCOTLAND', 'MANUAL']);
export type Nation = z.infer<typeof nationSchema>;

export const regionGroupSchema = z.enum(['NORTH', 'SOUTH']);
export type RegionGroup = z.infer<typeof regionGroupSchema>;

export const ownershipTypeSchema = z.enum(['FREEHOLD', 'LEASEHOLD']);
export type OwnershipType = z.infer<typeof ownershipTypeSchema>;

export const refurbQuoteTypeSchema = z.enum(['QUOTED', 'ESTIMATED', 'NOT_QUOTED']);
export type RefurbQuoteType = z.infer<typeof refurbQuoteTypeSchema>;

export const listingMediaKindSchema = z.enum(['PHOTO', 'VIDEO']);
export type ListingMediaKind = z.infer<typeof listingMediaKindSchema>;

// ── Base property information (all listings) ──────────────────────────────────

export const listingBaseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),

  // Classification
  propertyType: propertyTypeSchema.optional(),
  propertyTypeOther: z.string().max(200).optional(),
  internalRef: z.string().max(100).optional(),

  // Address
  addressLine1: z.string().min(1).max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  postcode: z.string().min(1).max(20),
  buildingNumber: z.string().max(20).optional(),
  region: z.string().max(100).optional(),
  nation: nationSchema.optional(),
  regionGroup: regionGroupSchema.optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),

  // General details
  bedrooms: z.number().int().min(0).max(100).optional(),
  bathrooms: z.number().int().min(0).max(100).optional(),
  floorArea: z.number().positive().optional(),
  hasLivingRoom: z.boolean().optional(),
  hasGarden: z.boolean().optional(),
  gardenNotes: z.string().max(500).optional(),
  parking: z.string().max(100).optional(),
  furnishedStatus: furnishedStatusSchema.optional(),
  furnishingQuality: z.string().max(100).optional(),
  furnishingNotes: z.string().max(500).optional(),

  // Status & readiness
  isVacant: z.boolean().optional(),
  isTenanted: z.boolean().optional(),
  isLicensed: z.boolean().optional(),
  needsRefurb: z.boolean().optional(),
  refurbQuoteType: refurbQuoteTypeSchema.optional(),
  refurbCostPence: z.number().int().nonnegative().optional(),
});
export type ListingBaseDto = z.infer<typeof listingBaseSchema>;

// ── Media ────────────────────────────────────────────────────────────────────

export const listingMediaSchema = z.object({
  kind: listingMediaKindSchema,
  fileKey: z.string().min(1),
  originalName: z.string().min(1),
});
export type ListingMediaDto = z.infer<typeof listingMediaSchema>;

// ── HMO room (repeatable) ────────────────────────────────────────────────────

export const hmoRoomSchema = z.object({
  name: z.string().min(1).max(100),
  roomType: hmoRoomTypeSchema,
  monthlyRentPence: z.number().int().nonnegative(),
});
export type HmoRoomDto = z.infer<typeof hmoRoomSchema>;

// ── Portfolio asset (repeatable) ──────────────────────────────────────────────

export const portfolioAssetSchema = z.object({
  name: z.string().min(1).max(200),
  assetType: z.string().max(100).optional(),
  valuePence: z.number().int().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
  order: z.number().int().nonnegative().optional().default(0),
});
export type PortfolioAssetDto = z.infer<typeof portfolioAssetSchema>;

// ── Strategy-specific schemas — all *Pence fields use .int() ──────────────────

/** Rent to Rent — common commercial terms */
export const r2rCommercialTermsSchema = z.object({
  rentTerm: z.string().max(200).optional(),
  rentToLandlordPence: z.number().int().nonnegative().optional(),
  depositPence: z.number().int().nonnegative().optional(),
  contractLengthMonths: z.number().int().positive().optional(),
  reviewPeriodMonths: z.number().int().positive().optional(),
  referenceRequirement: referenceRequirementSchema.optional(),
  billsIncluded: z.boolean().optional(),
  councilTaxIncluded: z.boolean().optional(),
  otherBillsIncluded: z.boolean().optional(),
});
export type R2rCommercialTermsDto = z.infer<typeof r2rCommercialTermsSchema>;

/** HMO-specific data (R2R HMO or sell-to-HMO crossover) */
export const hmoSpecificSchema = r2rCommercialTermsSchema.extend({
  isLicensed: z.boolean().optional(),
  isTenanted: z.boolean().optional(),
  needsRefurb: z.boolean().optional(),
  refurbCostPence: z.number().int().nonnegative().optional(),
  refurbQuoteType: refurbQuoteTypeSchema.optional(),
  managementAvailable: z.boolean().optional(),
  agencyDetails: z.string().max(1000).optional(),
  finderFeePence: z.number().int().nonnegative().optional(),
  happyToCoSource: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
});
export type HmoSpecificDto = z.infer<typeof hmoSpecificSchema>;

/** SA / Serviced Accommodation specific data */
export const saSpecificSchema = r2rCommercialTermsSchema.extend({
  maxGuests: z.number().int().positive().optional(),
  furnished: z.boolean().optional(),
  furnishingQuality: z.string().max(100).optional(),
  nightlyRatePence: z.number().int().nonnegative(),
  occupancyRate: z.number().min(0).max(1),
  // Operating costs
  rentPence: z.number().int().nonnegative(),
  billsPence: z.number().int().nonnegative().optional(),
  bookingFeePence: z.number().int().nonnegative().optional(),
  maintenanceRate: z.number().min(0).max(1).optional().default(0.05),
  managementCostPence: z.number().int().nonnegative().optional(),
  cleaningCostPence: z.number().int().nonnegative().optional(),
  otherCostsPence: z.number().int().nonnegative().optional(),
});
export type SaSpecificDto = z.infer<typeof saSpecificSchema>;

/** Sell Property specific data */
export const sellPropertySpecificSchema = z.object({
  // Ownership & legal
  ownershipType: ownershipTypeSchema.optional(),
  leaseExpiryDate: z.string().optional(),
  currentRentPence: z.number().int().nonnegative().optional(),

  // Pricing
  askingPricePence: z.number().int().nonnegative().optional(),
  marketValuePence: z.number().int().nonnegative().optional(),
  estimatedValuePence: z.number().int().nonnegative().optional(),

  // Commercial data
  propertySize: z.string().max(100).optional(),
  existingRentPence: z.number().int().nonnegative().optional(),
  potentialRentPence: z.number().int().nonnegative().optional(),
  ricsType: z.string().max(200).optional(),

  // Cost to buy
  depositPence: z.number().int().nonnegative().optional(),
  stampDutyPence: z.number().int().nonnegative().optional(),
  finderFeePence: z.number().int().nonnegative().optional(),
  legalFeesPence: z.number().int().nonnegative().optional(),
  otherAcquisitionCostsPence: z.number().int().nonnegative().optional(),

  // Finance
  mortgageInterestRate: z.number().min(0).max(1).optional(),
  financeNotes: z.string().max(2000).optional(),

  // Add-value potential
  addValueOptions: z.array(z.string()).optional(),
  refurbCostPence: z.number().int().nonnegative().optional(),
  developmentCostPence: z.number().int().nonnegative().optional(),
  builderInPlace: z.boolean().optional(),
  quoteAvailable: z.boolean().optional(),
  estimateAmountPence: z.number().int().nonnegative().optional(),
});
export type SellPropertySpecificDto = z.infer<typeof sellPropertySpecificSchema>;

/** Lease Option specific data */
export const leaseOptionSpecificSchema = z.object({
  pricePence: z.number().int().nonnegative(),
  potentialIncomePence: z.number().int().nonnegative().optional(),
  costToBuyPence: z.number().int().nonnegative().optional(),
  subtype: z.enum(['BMV', 'HMO', 'HIGH_ROI', 'CASH']).optional(),
  depositPence: z.number().int().nonnegative().optional(),
  stampDutyPence: z.number().int().nonnegative().optional(),
  finderFeePence: z.number().int().nonnegative().optional(),
  legalFeesPence: z.number().int().nonnegative().optional(),
  otherCostsPence: z.number().int().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
});
export type LeaseOptionSpecificDto = z.infer<typeof leaseOptionSpecificSchema>;

/** Development Opportunity specific data (V1 scaffold) */
export const developmentOpportunitySpecificSchema = z.object({
  costOfDevelopmentPence: z.number().int().nonnegative().optional(),
  builderInPlace: z.boolean().optional(),
  quoteAvailable: z.boolean().optional(),
  estimateAmountPence: z.number().int().nonnegative().optional(),
  legalCostsPence: z.number().int().nonnegative().optional(),
  depositPence: z.number().int().nonnegative().optional(),
  stampDutyPence: z.number().int().nonnegative().optional(),
  finderFeePence: z.number().int().nonnegative().optional(),
}).optional();
export type DevelopmentOpportunitySpecificDto = z.infer<typeof developmentOpportunitySpecificSchema>;

/** Refurb Opportunity specific data (V1 scaffold) */
export const refurbOpportunitySpecificSchema = z.object({
  costToRefurbishPence: z.number().int().nonnegative().optional(),
  potentialAddValuePence: z.number().int().nonnegative().optional(),
}).optional();
export type RefurbOpportunitySpecificDto = z.infer<typeof refurbOpportunitySpecificSchema>;

/** Portfolio specific data (V1 scaffold) */
export const portfolioSpecificSchema = z.object({
  portfolioTitle: z.string().max(200).optional(),
  numberOfProperties: z.number().int().positive().optional(),
  summary: z.string().max(5000).optional(),
  notes: z.string().max(2000).optional(),
}).optional();
export type PortfolioSpecificDto = z.infer<typeof portfolioSpecificSchema>;

/** Agency & network data (common, stored in or alongside strategy data) */
export const agencyNetworkSchema = z.object({
  agencyDetails: z.string().max(1000).optional(),
  sourcerDetails: z.string().max(1000).optional(),
  finderFeePence: z.number().int().nonnegative().optional(),
  coSourceAllowed: z.boolean().optional(),
  internalNotes: z.string().max(2000).optional(),
  externalNotes: z.string().max(2000).optional(),
});
export type AgencyNetworkDto = z.infer<typeof agencyNetworkSchema>;

// ── Strategy data lookup (select Zod schema by category + strategy) ────────────

export const strategySpecificDataMap: Record<string, z.ZodTypeAny> = {
  RENT_TO_RENT_HMO: hmoSpecificSchema,
  RENT_TO_RENT_SA: saSpecificSchema,
  RENT_TO_RENT_SINGLE_LET: r2rCommercialTermsSchema,
  SELL_PROPERTY: sellPropertySpecificSchema,
  LEASE_OPTION: leaseOptionSpecificSchema,
  DEVELOPMENT_OPPORTUNITY: developmentOpportunitySpecificSchema,
  REFURB_OPPORTUNITY: refurbOpportunitySpecificSchema,
  PORTFOLIO: portfolioSpecificSchema,
  COMMERCIAL: z.object({}).optional(),
};

/**
 * Resolve the correct Zod schema for a listing's strategy-specific data JSONB.
 * Falls back to `z.object({})` (passthrough) for unconfigured strategy combos.
 */
export function getStrategyDataSchema(category: string, strategy?: string | null): z.ZodTypeAny {
  if (strategy) {
    const key = `${category}_${strategy}`;
    if (key in strategySpecificDataMap) return strategySpecificDataMap[key]!;
  }
  if (category in strategySpecificDataMap) return strategySpecificDataMap[category]!;
  return z.object({}).optional();
}

// ── Full create-listing request schema ────────────────────────────────────────

export const createListingSchema = z.object({
  category: listingCategorySchema,
  strategy: listingStrategySchema.optional().nullable(),
  status: listingStatusSchema.optional().default('DRAFT'),

  // Base property info
  base: listingBaseSchema,

  // Repeatable groups
  hmoRooms: z.array(hmoRoomSchema).optional().default([]),
  portfolioAssets: z.array(portfolioAssetSchema).optional().default([]),

  // Media
  media: z.array(listingMediaSchema).optional().default([]),

  // Strategy-specific JSONB — validated at runtime by getStrategyDataSchema
  strategySpecificData: z.record(z.unknown()).optional(),
});
export type CreateListingDto = z.infer<typeof createListingSchema>;

/**
 * Deep-partial update schema — every field optional, including nested base fields.
 * Uses listingBaseSchema.partial() so partial property updates pass validation.
 */
export const updateListingSchema = z.object({
  category: listingCategorySchema.optional(),
  strategy: listingStrategySchema.optional().nullable(),
  status: listingStatusSchema.optional(),
  base: listingBaseSchema.partial().optional(),
  hmoRooms: z.array(hmoRoomSchema).optional(),
  portfolioAssets: z.array(portfolioAssetSchema).optional(),
  media: z.array(listingMediaSchema).optional(),
  strategySpecificData: z.record(z.unknown()).optional(),
});
export type UpdateListingDto = z.infer<typeof updateListingSchema>;