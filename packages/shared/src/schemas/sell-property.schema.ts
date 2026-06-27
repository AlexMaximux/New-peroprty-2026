/**
 * Sell Property / Development / Refurb / Portfolio / Lease Option section schemas
 * for the multi-step wizard.
 *
 * Each section has its OWN Zod schema, used on BOTH client (per-step validation)
 * and server (composite validation at submit).
 *
 * All monetary fields in integer pence (*Pence). Convert at input boundary only.
 */
import { z } from 'zod';

// ── Shared enums ────────────────────────────────────────────────────────────

export const ownershipTypeSchema2 = z.enum(['FREEHOLD', 'LEASEHOLD']);
export type OwnershipType2 = z.infer<typeof ownershipTypeSchema2>;

export const addValueOptionSchema = z.enum([
  'REFURB', 'FULL_REFURB', 'EXTENSION', 'LOFT_CONVERSION',
  'HMO_CONVERSION', 'FLAT_CONVERSION', 'ADD_BEDROOM', 'OTHER',
]);
export type AddValueOption = z.infer<typeof addValueOptionSchema>;

// ── Ownership & Legal section ───────────────────────────────────────────────

export const sellOwnershipSectionSchema = z.object({
  ownershipType: ownershipTypeSchema2,
  leaseExpiryDate: z.string().max(100).optional(),
  currentRentPence: z.number().int().nonnegative().optional(),
}).refine(
  (d) => d.ownershipType !== 'LEASEHOLD' || (d.leaseExpiryDate && d.leaseExpiryDate.length > 0),
  { message: 'Lease expiry date required for leasehold properties', path: ['leaseExpiryDate'] },
);
export type SellOwnershipSectionDto = z.infer<typeof sellOwnershipSectionSchema>;

// ── Pricing section ─────────────────────────────────────────────────────────

export const sellPricingSectionSchema = z.object({
  askingPricePence: z.number().int().nonnegative(),
  marketValuePence: z.number().int().nonnegative().optional(),
  estimatedValuePence: z.number().int().nonnegative().optional(),
  propertySize: z.string().max(100).optional(),
  existingRentPence: z.number().int().nonnegative().optional(),
  potentialRentPence: z.number().int().nonnegative().optional(),
  ricsType: z.string().max(200).optional(),
});
export type SellPricingSectionDto = z.infer<typeof sellPricingSectionSchema>;

// ── Cost to Buy section ─────────────────────────────────────────────────────

export const sellCostToBuySectionSchema = z.object({
  depositPence: z.number().int().nonnegative(),
  stampDutyPence: z.number().int().nonnegative().optional(),
  finderFeePence: z.number().int().nonnegative().optional(),
  legalFeesPence: z.number().int().nonnegative().optional(),
  otherAcquisitionCostsPence: z.number().int().nonnegative().optional(),
});
export type SellCostToBuySectionDto = z.infer<typeof sellCostToBuySectionSchema>;

// ── Finance section ─────────────────────────────────────────────────────────

export const sellFinanceSectionSchema = z.object({
  mortgageInterestRate: z.number().min(0).max(1).optional(),
  financeNotes: z.string().max(2000).optional(),
});
export type SellFinanceSectionDto = z.infer<typeof sellFinanceSectionSchema>;

// ── Add-Value section ───────────────────────────────────────────────────────

export const sellAddValueSectionSchema = z.object({
  addValueOptions: z.array(addValueOptionSchema).optional(),
  refurbCostPence: z.number().int().nonnegative().optional(),
  developmentCostPence: z.number().int().nonnegative().optional(),
  builderInPlace: z.boolean().optional(),
  quoteAvailable: z.boolean().optional(),
  estimateAmountPence: z.number().int().nonnegative().optional(),
}).refine(
  (d) => !d.builderInPlace || d.quoteAvailable != null,
  { message: 'Please indicate if a quote is available', path: ['quoteAvailable'] },
);
export type SellAddValueSectionDto = z.infer<typeof sellAddValueSectionSchema>;

// ── Development Opportunity section ─────────────────────────────────────────

export const devOpportunitySectionSchema = z.object({
  costOfDevelopmentPence: z.number().int().nonnegative(),
  builderInPlace: z.boolean().optional(),
  quoteAvailable: z.boolean().optional(),
  estimateAmountPence: z.number().int().nonnegative().optional(),
  legalCostsPence: z.number().int().nonnegative().optional(),
});
export type DevOpportunitySectionDto = z.infer<typeof devOpportunitySectionSchema>;

// ── Refurb Opportunity section ──────────────────────────────────────────────

export const refurbOpportunitySectionSchema = z.object({
  costToRefurbishPence: z.number().int().nonnegative(),
  potentialAddValuePence: z.number().int().nonnegative().optional(),
});
export type RefurbOpportunitySectionDto = z.infer<typeof refurbOpportunitySectionSchema>;

// ── Portfolio section ───────────────────────────────────────────────────────

export const wpPortfolioAssetSchema = z.object({
  name: z.string().min(1, 'Asset name is required').max(200),
  assetType: z.string().max(100).optional(),
  valuePence: z.number().int().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
  order: z.number().int().nonnegative().default(0),
});
export type WpPortfolioAssetDto = z.infer<typeof wpPortfolioAssetSchema>;

export const portfolioSectionSchema = z.object({
  portfolioTitle: z.string().max(200).optional(),
  numberOfProperties: z.number().int().positive().optional(),
  summary: z.string().max(5000).optional(),
  notes: z.string().max(2000).optional(),
  assets: z.array(wpPortfolioAssetSchema).default([]),
});
export type PortfolioSectionDto = z.infer<typeof portfolioSectionSchema>;

// ── Lease Option section ────────────────────────────────────────────────────

export const leaseOptionSubtypeSchema = z.enum(['BMV', 'HMO', 'HIGH_ROI', 'CASH']);
export type LeaseOptionSubtype = z.infer<typeof leaseOptionSubtypeSchema>;

export const leaseOptionSectionSchema = z.object({
  pricePence: z.number().int().nonnegative(),
  potentialIncomePence: z.number().int().nonnegative().optional(),
  costToBuyPence: z.number().int().nonnegative().optional(),
  subtype: leaseOptionSubtypeSchema.optional(),
  depositPence: z.number().int().nonnegative().optional(),
  stampDutyPence: z.number().int().nonnegative().optional(),
  finderFeePence: z.number().int().nonnegative().optional(),
  legalFeesPence: z.number().int().nonnegative().optional(),
  otherCostsPence: z.number().int().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
});
export type LeaseOptionSectionDto = z.infer<typeof leaseOptionSectionSchema>;

// ── Section data union (what each wizard step produces) ──────────────────────

export const sellSectionDataSchema = z.union([
  sellOwnershipSectionSchema,
  sellPricingSectionSchema,
  sellCostToBuySectionSchema,
  sellFinanceSectionSchema,
  sellAddValueSectionSchema,
  devOpportunitySectionSchema,
  refurbOpportunitySectionSchema,
  portfolioSectionSchema,
  leaseOptionSectionSchema,
]);
export type SellSectionData = z.infer<typeof sellSectionDataSchema>;
