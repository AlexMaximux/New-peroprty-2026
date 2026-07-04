/**
 * Rent-to-Rent section schemas for the multi-step wizard.
 *
 * Each section has its OWN Zod schema, used on BOTH client (per-step validation)
 * and server (composite validation at submit). Never duplicate validation logic.
 *
 * All monetary fields in integer pence (*Pence). Convert at input boundary only.
 */
import { z } from 'zod';

// ── Shared enums ────────────────────────────────────────────────────────────

export const addressRegionSchema = z.enum([
  'NORTH', 'SOUTH', 'MIDLANDS', 'WALES', 'SCOTLAND', 'MANUAL',
]);
export type AddressRegion = z.infer<typeof addressRegionSchema>;

export const hmoStatusSchema = z.enum(['LICENCED', 'TENANTED', 'NEEDS_REFURB']);
export type HmoStatus = z.infer<typeof hmoStatusSchema>;

export const furnishingQualitySchema = z.enum([
  'HIGH', 'GOOD', 'MEDIUM', 'LOW', 'SEMI_FURNISHED', 'OTHER',
]);
export type FurnishingQuality = z.infer<typeof furnishingQualitySchema>;

export const r2rRoomTypeSchema = z.enum([
  'DOUBLE_EN_SUITE', 'DOUBLE_SHARED',
  'SINGLE_EN_SUITE', 'SINGLE_SHARED', 'OTHER',
]);
export type R2rRoomType = z.infer<typeof r2rRoomTypeSchema>;

export const referencingTypeSchema = z.enum(['LTD', 'LIGHT', 'FULL', 'OTHER']);
export type ReferencingType = z.infer<typeof referencingTypeSchema>;

export const parkingEnumSchema = z.enum(['YES', 'NO', 'OTHER']);
export const gardenEnumSchema = z.enum(['YES', 'NO', 'OTHER']);

// ── Address section (reusable across ALL listing categories) ─────────────────

export const addressSectionSchema = z.object({
  postcode: z.string().min(1, 'Postcode is required').max(20),
  houseNumber: z.string().max(50).optional(),
  region: addressRegionSchema,
  manualRegion: z.string().max(100).optional(),
  propertyType: z
    .enum(['TERRACED', 'FLAT', 'DETACHED', 'SEMI_DETACHED', 'OTHER']),
  propertyTypeOther: z.string().max(200).optional(),
  addressLine1: z.string().min(1, 'Address is required').max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(1, 'City is required').max(100),
  latitude: z.number().min(-90).max(90).nullish(),
  longitude: z.number().min(-180).max(180).nullish(),
}).refine(
  (d) => d.region !== 'MANUAL' || (d.manualRegion && d.manualRegion.length > 0),
  { message: 'Manual region entry required', path: ['manualRegion'] },
).refine(
  (d) => d.propertyType !== 'OTHER' || (d.propertyTypeOther && d.propertyTypeOther.length > 0),
  { message: 'Please explain property type', path: ['propertyTypeOther'] },
);
export type AddressSectionDto = z.infer<typeof addressSectionSchema>;

// ── HMO room (repeatable) — renamed to avoid conflict with listing.schema export ──

export const r2rRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required').max(100),
  roomType: r2rRoomTypeSchema,
  monthlyRentPence: z.number().int().nonnegative(),
});
export type R2rRoomDto = z.infer<typeof r2rRoomSchema>;

// ── HMO Details section (independent checkboxes + conditionals) ─────────────

export const licenceNoteSchema = z.enum(['NOT_REQUIRED', 'EXPIRED', 'OTHER']);
export type LicenceNote = z.infer<typeof licenceNoteSchema>;

export const tenancyTypeSchema = z.enum(['FULL', 'PART']);
export type TenancyType = z.infer<typeof tenancyTypeSchema>;

export const hmoDetailsSectionSchema = z.object({
  // Independent status checkboxes
  isLicensed: z.boolean(),
  licenceNote: licenceNoteSchema.nullish(),
  licenceNoteExplanation: z.string().max(200).nullish(),
  isTenanted: z.boolean(),
  tenancyType: tenancyTypeSchema.nullish(),
  roomsTenanted: z.number().int().nonnegative().nullish(),
  needsRefurb: z.boolean(),
  refurbCostPence: z.number().int().nonnegative().nullish(),
  refurbQuoteType: z.enum(['QUOTED', 'ESTIMATED']).nullish(),

  // Existing non-status fields
  furnished: z.boolean(),
  furnishingQuality: furnishingQualitySchema.nullish(),
  furnishingQualityOther: z.string().max(200).nullish(),
  hasLivingRoom: z.boolean(),
  parking: parkingEnumSchema,
  parkingSpaces: z.number().int().nonnegative().nullish(),
  parkingOther: z.string().max(200).nullish(),
  garden: gardenEnumSchema,
  gardenNotes: z.string().max(500).nullish(),
  rooms: z.array(r2rRoomSchema).min(1, 'At least one room required'),
}).refine(
  (d) => d.isLicensed || d.licenceNote != null,
  { message: 'Licence note required when not licenced', path: ['licenceNote'] },
).refine(
  (d) => d.licenceNote !== 'OTHER' || (d.licenceNoteExplanation && d.licenceNoteExplanation.length > 0),
  { message: 'Please explain licence situation', path: ['licenceNoteExplanation'] },
).refine(
  (d) => !d.isTenanted || d.tenancyType != null,
  { message: 'Tenancy type required', path: ['tenancyType'] },
).refine(
  (d) => d.tenancyType !== 'PART' || (d.roomsTenanted != null && d.roomsTenanted >= 1 && d.roomsTenanted <= d.rooms.length),
  { message: 'Number of tenanted rooms must be between 1 and total rooms', path: ['roomsTenanted'] },
).refine(
  (d) => !d.needsRefurb || (d.refurbCostPence != null && d.refurbCostPence > 0),
  { message: 'Refurb cost required when property needs refurb', path: ['refurbCostPence'] },
).refine(
  (d) => !d.needsRefurb || d.refurbQuoteType != null,
  { message: 'Quote type required when property needs refurb', path: ['refurbQuoteType'] },
).refine(
  (d) => !d.furnished || d.furnishingQuality != null,
  { message: 'Furnishing quality required when furnished', path: ['furnishingQuality'] },
).refine(
  (d) => d.parking !== 'YES' || (d.parkingSpaces != null && d.parkingSpaces > 0),
  { message: 'Number of parking spaces required', path: ['parkingSpaces'] },
).refine(
  (d) => d.parking !== 'OTHER' || (d.parkingOther && d.parkingOther.length > 0),
  { message: 'Please explain parking situation', path: ['parkingOther'] },
);
export type HmoDetailsSectionDto = z.infer<typeof hmoDetailsSectionSchema>;

// ── Bill item (reusable — Rent Term bills) ──────────────────────────────────

export const billItemSchema = z.object({
  label: z.string().min(1, 'Bill label is required').max(100),
  amountPence: z.number().int().nonnegative(),
});
export type BillItemDto = z.infer<typeof billItemSchema>;

// ── Rent Term section (shared between HMO and SA) ───────────────────────────

export const rentTermSectionSchema = z.object({
  rentToLandlordPence: z.number().int().nonnegative(),
  depositPence: z.number().int().nonnegative(),
  contractLength: z.number().int().positive('Contract length is required').max(600),
  reviewPeriod: z.string().max(50).nullish(),
  referencingType: referencingTypeSchema,
  referencingOther: z.string().max(200).nullish(),
  finderFeePence: z.number().int().nonnegative().default(0),
  happyToCoSource: z.boolean().default(false),
  bills: z.array(billItemSchema).default([]),
  managementEnabled: z.boolean().default(true),
  managementRatePercent: z.number().min(0).max(100).default(10),
  cleaningPence: z.number().int().nonnegative().default(0),
}).refine(
  (d) => d.referencingType !== 'OTHER' || (d.referencingOther && d.referencingOther.length > 0),
  { message: 'Please specify referencing type', path: ['referencingOther'] },
);
export type RentTermSectionDto = z.infer<typeof rentTermSectionSchema>;

// ── SA Property Details section ─────────────────────────────────────────────

export const saDetailsSectionSchema = z.object({
  bedrooms: z.number().int().positive('Bedrooms must be at least 1'),
  bathrooms: z.number().int().positive('Bathrooms must be at least 1'),
  accommodates: z.number().int().positive('Max guests must be at least 1'),
  furnished: z.boolean(),
  furnishingQuality: furnishingQualitySchema.nullish(),
  furnishingQualityOther: z.string().max(200).nullish(),
  manualOverride: z.boolean().default(false),
  // AirDNA mock input (stored as decimal 0-1, but form accepts 0-100%)
  // Note: nightlyRate is pence, occupancyRate is percentage for form validation
  airdnaNightlyRatePence: z.number().int().nonnegative().nullish(),
  airdnaOccupancyRate: z.number().int().min(0).max(100).nullish(),
}).refine(
  (d) => !d.furnished || d.furnishingQuality != null,
  { message: 'Furnishing quality required when furnished', path: ['furnishingQuality'] },
);
export type SaDetailsSectionDto = z.infer<typeof saDetailsSectionSchema>;

// ── SA Revenue section ─────────────────────────────────────────────────────
// NOTE: schema validates HUMAN UNITS (£, 0-100%).
// Conversion to pence (×100) / decimal (÷100) happens at submit boundary in the form component.
// When hydrating from stored pence/decimal state, convert back in initialData.

export const saRevenueSectionSchema = z.object({
  nightlyRatePence: z.number().nonnegative(),
  occupancyRate: z.number().int().min(1).max(100),
  bookingFeePence: z.number().nonnegative().default(0),
  maintenanceRate: z.number().min(0).max(100).default(5),
  otherCostsPence: z.number().nonnegative().default(0),
});
export type SaRevenueSectionDto = z.infer<typeof saRevenueSectionSchema>;

// ── Block of Property schemas ───────────────────────────────────────────────

export const unitTypeSchema = z.enum(['ONE_BED', 'TWO_BED', 'THREE_BED', 'HMO_UNIT']);
export type UnitType = z.infer<typeof unitTypeSchema>;

export const unitMixSchema = z.object({
  oneBedCount: z.number().int().nonnegative().default(0),
  twoBedCount: z.number().int().nonnegative().default(0),
  threeBedCount: z.number().int().nonnegative().default(0),
  hmoUnitCount: z.number().int().nonnegative().default(0),
});
export type UnitMixDto = z.infer<typeof unitMixSchema>;

export const blockUnitMixSectionSchema = z.object({
  totalUnits: z.number().int().positive('Must have at least 1 unit'),
  unitMix: unitMixSchema,
}).refine(
  (d) => {
    const sum = d.unitMix.oneBedCount + d.unitMix.twoBedCount + d.unitMix.threeBedCount + d.unitMix.hmoUnitCount;
    return sum === d.totalUnits;
  },
  { message: 'Unit counts must match total units', path: ['unitMix'] },
);
export type BlockUnitMixSectionDto = z.infer<typeof blockUnitMixSectionSchema>;

// Per-unit detail entry (scaffold — UI reuses HMO/SA sections per unit type)
export const perUnitDetailSchema = z.object({
  unitType: unitTypeSchema,
  label: z.string().max(100).optional(),
  // Each unit reuses the same section schemas
  hmoDetails: hmoDetailsSectionSchema.nullish(),
  saDetails: saDetailsSectionSchema.nullish(),
  saRevenue: saRevenueSectionSchema.nullish(),
  rentTerm: rentTermSectionSchema.nullish(),
});
export type PerUnitDetailDto = z.infer<typeof perUnitDetailSchema>;

// ── Section data union (what each wizard step produces) ──────────────────────

export const r2rSectionDataSchema = z.union([
  addressSectionSchema,
  hmoDetailsSectionSchema,
  rentTermSectionSchema,
  saDetailsSectionSchema,
  saRevenueSectionSchema,
  blockUnitMixSectionSchema,
]);
export type R2rSectionData = z.infer<typeof r2rSectionDataSchema>;

// ── Full Rent-to-Rent composite schemas (server validates complete submission) ──

export const hmoCompositeSchema = z.object({
  category: z.literal('RENT_TO_RENT'),
  strategy: z.literal('HMO'),
  address: addressSectionSchema,
  hmoDetails: hmoDetailsSectionSchema,
  rentTerm: rentTermSectionSchema,
  // rooms + rents live in hmoDetails; no separate income section
  media: z.array(z.object({ fileKey: z.string().min(1) })).optional().default([]),
}).strict();
export type HmoCompositeDto = z.infer<typeof hmoCompositeSchema>;

export const saCompositeSchema = z.object({
  category: z.literal('RENT_TO_RENT'),
  strategy: z.literal('SA'),
  address: addressSectionSchema,
  saDetails: saDetailsSectionSchema,
  rentTerm: rentTermSectionSchema,
  saRevenue: saRevenueSectionSchema,
  media: z.array(z.object({ fileKey: z.string().min(1) })).optional().default([]),
}).strict();
export type SaCompositeDto = z.infer<typeof saCompositeSchema>;

export const blockCompositeSchema = z.object({
  category: z.literal('RENT_TO_RENT'),
  strategy: z.literal('BLOCK_OF_PROPERTY'),
  address: addressSectionSchema,
  unitMix: blockUnitMixSectionSchema,
  units: z.array(perUnitDetailSchema).default([]),
  media: z.array(z.object({ fileKey: z.string().min(1) })).optional().default([]),
});
export type BlockCompositeDto = z.infer<typeof blockCompositeSchema>;

export const rentToRentCompositeSchema = z.discriminatedUnion('strategy', [
  hmoCompositeSchema,
  saCompositeSchema,
  blockCompositeSchema,
]);
export type RentToRentCompositeDto = z.infer<typeof rentToRentCompositeSchema>;
