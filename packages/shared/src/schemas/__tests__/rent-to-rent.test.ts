import { describe, it, expect } from 'vitest';
import {
  addressSectionSchema,
  hmoDetailsSectionSchema,
  r2rRoomSchema,
  rentTermSectionSchema,
  billItemSchema,
  saDetailsSectionSchema,
  saRevenueSectionSchema,
  blockUnitMixSectionSchema,
  hmoCompositeSchema,
  saCompositeSchema,
  rentToRentCompositeSchema,
  type AddressSectionDto,
  type RentTermSectionDto,
} from '../rent-to-rent.schema';
import { listingStrategySchema } from '../listing.schema';

// ── Enums ────────────────────────────────────────────────────────────────────

describe('listingStrategySchema includes BLOCK_OF_PROPERTY', () => {
  it('accepts BLOCK_OF_PROPERTY', () => {
    expect(listingStrategySchema.parse('BLOCK_OF_PROPERTY')).toBe('BLOCK_OF_PROPERTY');
  });
});

// ── Address section ──────────────────────────────────────────────────────────

describe('addressSectionSchema', () => {
  const valid: AddressSectionDto = {
    postcode: 'M1 1AA',
    houseNumber: '45',
    region: 'NORTH',
    propertyType: 'TERRACED',
    addressLine1: '45 Test Street',
    city: 'Manchester',
  };

  it('accepts minimal valid input', () => {
    expect(addressSectionSchema.parse(valid)).toMatchObject({
      postcode: 'M1 1AA',
      region: 'NORTH',
    });
  });

  it('accepts full input with lat/lng', () => {
    const full = { ...valid, latitude: 53.5, longitude: -2.25 };
    expect(addressSectionSchema.parse(full).latitude).toBe(53.5);
  });

  it('rejects missing postcode', () => {
    expect(() => addressSectionSchema.parse({ ...valid, postcode: '' })).toThrow();
  });

  it('requires manualRegion when region is MANUAL', () => {
    expect(() =>
      addressSectionSchema.parse({ ...valid, region: 'MANUAL', manualRegion: '' }),
    ).toThrow('Manual region entry required');
  });

  it('accepts MANUAL region with value', () => {
    expect(
      addressSectionSchema.parse({ ...valid, region: 'MANUAL', manualRegion: 'Cornwall' }).manualRegion,
    ).toBe('Cornwall');
  });

  it('requires propertyTypeOther when type is OTHER', () => {
    expect(() =>
      addressSectionSchema.parse({ ...valid, propertyType: 'OTHER', propertyTypeOther: '' }),
    ).toThrow('explain');
  });

  it('accepts OTHER property with explanation', () => {
    const result = addressSectionSchema.parse({ ...valid, propertyType: 'OTHER', propertyTypeOther: 'Bungalow' });
    expect(result.propertyTypeOther).toBe('Bungalow');
  });

  it('rejects empty city', () => {
    expect(() => addressSectionSchema.parse({ ...valid, city: '' })).toThrow();
  });
});

// ── R2R room ─────────────────────────────────────────────────────────────────

describe('r2rRoomSchema', () => {
  it('accepts valid room', () => {
    expect(
      r2rRoomSchema.parse({ name: 'Room 1', roomType: 'DOUBLE_EN_SUITE', monthlyRentPence: 50000 }),
    ).toMatchObject({ name: 'Room 1' });
  });

  it('rejects empty name', () => {
    expect(() =>
      r2rRoomSchema.parse({ name: '', roomType: 'DOUBLE_EN_SUITE', monthlyRentPence: 50000 }),
    ).toThrow('Room name is required');
  });

  it('rejects negative rent', () => {
    expect(() =>
      r2rRoomSchema.parse({ name: 'Room 1', roomType: 'DOUBLE_EN_SUITE', monthlyRentPence: -100 }),
    ).toThrow();
  });
});

// ── HMO Details section (checkbox model) ────────────────────────────────────

describe('hmoDetailsSectionSchema', () => {
  const baseHmo = {
    isLicensed: true,
    isTenanted: false,
    needsRefurb: false,
    furnished: true,
    furnishingQuality: 'HIGH' as const,
    hasLivingRoom: true,
    parking: 'NO' as const,
    garden: 'NO' as const,
    rooms: [{ name: 'Room 1', roomType: 'DOUBLE_EN_SUITE', monthlyRentPence: 50000 }],
  };

  it('accepts fully licenced minimal HMO', () => {
    expect(hmoDetailsSectionSchema.parse(baseHmo).isLicensed).toBe(true);
  });

  // ── Licence gate ──────────────────────────────────────────────────────────

  it('requires licenceNote when not licenced', () => {
    expect(() =>
      hmoDetailsSectionSchema.parse({ ...baseHmo, isLicensed: false }),
    ).toThrow('Licence note required');
  });

  it('accepts NOT_REQUIRED licence note when not licenced', () => {
    const result = hmoDetailsSectionSchema.parse({
      ...baseHmo, isLicensed: false, licenceNote: 'NOT_REQUIRED',
    });
    expect(result.licenceNote).toBe('NOT_REQUIRED');
  });

  it('accepts EXPIRED licence note when not licenced', () => {
    const result = hmoDetailsSectionSchema.parse({
      ...baseHmo, isLicensed: false, licenceNote: 'EXPIRED',
    });
    expect(result.licenceNote).toBe('EXPIRED');
  });

  it('requires licenceNoteExplanation when licence note is OTHER', () => {
    expect(() =>
      hmoDetailsSectionSchema.parse({
        ...baseHmo, isLicensed: false, licenceNote: 'OTHER', licenceNoteExplanation: '',
      }),
    ).toThrow('explain licence situation');
  });

  it('accepts OTHER licence note with explanation', () => {
    const result = hmoDetailsSectionSchema.parse({
      ...baseHmo, isLicensed: false, licenceNote: 'OTHER', licenceNoteExplanation: 'Under review',
    });
    expect(result.licenceNoteExplanation).toBe('Under review');
  });

  // ── Tenancy gate ──────────────────────────────────────────────────────────

  it('requires tenancyType when tenanted', () => {
    expect(() =>
      hmoDetailsSectionSchema.parse({ ...baseHmo, isTenanted: true }),
    ).toThrow('Tenancy type required');
  });

  it('accepts FULL tenancy type', () => {
    const result = hmoDetailsSectionSchema.parse({
      ...baseHmo, isTenanted: true, tenancyType: 'FULL',
    });
    expect(result.tenancyType).toBe('FULL');
  });

  it('requires roomsTenanted when PART tenancy', () => {
    expect(() =>
      hmoDetailsSectionSchema.parse({
        ...baseHmo, isTenanted: true, tenancyType: 'PART',
      }),
    ).toThrow('Number of tenanted rooms must be between 1 and total rooms');
  });

  it('accepts PART tenancy with valid roomsTenanted', () => {
    const result = hmoDetailsSectionSchema.parse({
      ...baseHmo, isTenanted: true, tenancyType: 'PART', roomsTenanted: 1,
    });
    expect(result.roomsTenanted).toBe(1);
  });

  it('rejects PART tenancy with roomsTenanted > total rooms', () => {
    expect(() =>
      hmoDetailsSectionSchema.parse({
        ...baseHmo, isTenanted: true, tenancyType: 'PART', roomsTenanted: 5,
      }),
    ).toThrow('Number of tenanted rooms must be between 1 and total rooms');
  });

  // ── Refurb gate ───────────────────────────────────────────────────────────

  it('requires refurbCostPence when needsRefurb', () => {
    expect(() =>
      hmoDetailsSectionSchema.parse({ ...baseHmo, needsRefurb: true }),
    ).toThrow('Refurb cost required');
  });

  it('accepts needsRefurb with cost and quote type', () => {
    const result = hmoDetailsSectionSchema.parse({
      ...baseHmo,
      needsRefurb: true,
      refurbCostPence: 5000000,
      refurbQuoteType: 'QUOTED',
    });
    expect(result.refurbCostPence).toBe(5000000);
  });

  // ── Existing gates ────────────────────────────────────────────────────────

  it('requires furnishingQuality when furnished', () => {
    expect(() =>
      hmoDetailsSectionSchema.parse({ ...baseHmo, furnished: true, furnishingQuality: undefined }),
    ).toThrow('Furnishing quality required');
  });

  it('requires parkingSpaces when parking is YES', () => {
    expect(() =>
      hmoDetailsSectionSchema.parse({ ...baseHmo, parking: 'YES', parkingSpaces: 0 }),
    ).toThrow('parking spaces');
  });

  it('accepts parking YES with spaces', () => {
    const result = hmoDetailsSectionSchema.parse({ ...baseHmo, parking: 'YES', parkingSpaces: 2 });
    expect(result.parkingSpaces).toBe(2);
  });

  it('rejects empty rooms array', () => {
    expect(() =>
      hmoDetailsSectionSchema.parse({ ...baseHmo, rooms: [] }),
    ).toThrow('At least one room required');
  });

  it('accepts unfurnished', () => {
    const result = hmoDetailsSectionSchema.parse({ ...baseHmo, furnished: false, furnishingQuality: undefined });
    expect(result.furnished).toBe(false);
    expect(result.furnishingQuality).toBeUndefined();
  });
});

// ── Bill item ────────────────────────────────────────────────────────────────

describe('billItemSchema', () => {
  it('accepts valid bill', () => {
    expect(billItemSchema.parse({ label: 'Electricity', amountPence: 5000 })).toMatchObject({ label: 'Electricity' });
  });

  it('rejects empty label', () => {
    expect(() => billItemSchema.parse({ label: '', amountPence: 5000 })).toThrow('Bill label is required');
  });
});

// ── Rent Term section ────────────────────────────────────────────────────────

describe('rentTermSectionSchema', () => {
  const valid: RentTermSectionDto = {
    rentToLandlordPence: 150000,
    depositPence: 150000,
    contractLength: 12,
    referencingType: 'LTD',
    finderFeePence: 10000,
    happyToCoSource: false,
    bills: [
      { label: 'Utility', amountPence: 5000 },
      { label: 'Council Tax', amountPence: 3000 },
    ],
    managementEnabled: true,
    managementRatePercent: 10,
    cleaningPence: 10000,
  };

  it('accepts valid input', () => {
    const result = rentTermSectionSchema.parse(valid);
    expect(result.rentToLandlordPence).toBe(150000);
    expect(result.bills).toHaveLength(2);
  });

  it('uses defaults for optional fields', () => {
    const minimal = rentTermSectionSchema.parse({
      rentToLandlordPence: 100000,
      depositPence: 100000,
      contractLength: 12,
      referencingType: 'FULL',
    });
    expect(minimal.finderFeePence).toBe(0);
    expect(minimal.happyToCoSource).toBe(false);
    expect(minimal.bills).toEqual([]);
    expect(minimal.managementEnabled).toBe(true);
    expect(minimal.managementRatePercent).toBe(10);
    expect(minimal.cleaningPence).toBe(0);
  });

  it('rejects empty contract length', () => {
    expect(() =>
      rentTermSectionSchema.parse({ ...valid, contractLength: undefined as any }),
    ).toThrow();
  });

  it('rejects zero contract length', () => {
    expect(() =>
      rentTermSectionSchema.parse({ ...valid, contractLength: 0 }),
    ).toThrow('Contract length is required');
  });

  it('requires referencingOther when OTHER type', () => {
    expect(() =>
      rentTermSectionSchema.parse({ ...valid, referencingType: 'OTHER', referencingOther: '' }),
    ).toThrow('specify referencing type');
  });
});

// ── SA Details section ───────────────────────────────────────────────────────

describe('saDetailsSectionSchema', () => {
  it('accepts valid input', () => {
    const result = saDetailsSectionSchema.parse({
      bedrooms: 2,
      bathrooms: 1,
      accommodates: 4,
      furnished: true,
      furnishingQuality: 'GOOD',
      manualOverride: false,
    });
    expect(result.bedrooms).toBe(2);
  });

  it('rejects 0 bedrooms', () => {
    expect(() =>
      saDetailsSectionSchema.parse({ bedrooms: 0, bathrooms: 1, accommodates: 2, furnished: true, manualOverride: false }),
    ).toThrow();
  });

  it('requires furnishingQuality when furnished', () => {
    expect(() =>
      saDetailsSectionSchema.parse({ bedrooms: 2, bathrooms: 1, accommodates: 4, furnished: true, furnishingQuality: undefined, manualOverride: false }),
    ).toThrow('Furnishing quality required');
  });

  it('accepts unfurnished', () => {
    const result = saDetailsSectionSchema.parse({
      bedrooms: 2, bathrooms: 1, accommodates: 4, furnished: false, furnishingQuality: undefined, manualOverride: false,
    });
    expect(result.furnished).toBe(false);
  });
});

// ── SA Revenue section ───────────────────────────────────────────────────────

describe('saRevenueSectionSchema', () => {
  it('accepts valid input with defaults', () => {
    const result = saRevenueSectionSchema.parse({
      nightlyRatePence: 100,
      occupancyRate: 65,
      bookingFeePence: 0,
      maintenanceRate: 5,
      otherCostsPence: 0,
    });
    expect(result.nightlyRatePence).toBe(100);
    expect(result.occupancyRate).toBe(65);
    expect(result.maintenanceRate).toBe(5);
  });

  it('rejects occupancy > 100', () => {
    expect(() =>
      saRevenueSectionSchema.parse({ nightlyRatePence: 100, occupancyRate: 101, bookingFeePence: 0, maintenanceRate: 5, otherCostsPence: 0 }),
    ).toThrow();
  });

  it('rejects negative nightly rate', () => {
    expect(() =>
      saRevenueSectionSchema.parse({ nightlyRatePence: -100, occupancyRate: 50, bookingFeePence: 0, maintenanceRate: 5, otherCostsPence: 0 }),
    ).toThrow();
  });

  it('accepts explicit costs', () => {
    const full = saRevenueSectionSchema.parse({ nightlyRatePence: 200, occupancyRate: 65, bookingFeePence: 200, maintenanceRate: 5, otherCostsPence: 100 });
    expect(full.bookingFeePence).toBe(200);
    expect(full.otherCostsPence).toBe(100);
  });
});

// ── Block unit mix ───────────────────────────────────────────────────────────

describe('blockUnitMixSectionSchema', () => {
  it('accepts valid mix matching total', () => {
    const result = blockUnitMixSectionSchema.parse({
      totalUnits: 5,
      unitMix: { oneBedCount: 2, twoBedCount: 2, threeBedCount: 0, hmoUnitCount: 1 },
    });
    expect(result.totalUnits).toBe(5);
  });

  it('rejects mix not matching total', () => {
    expect(() =>
      blockUnitMixSectionSchema.parse({
        totalUnits: 5,
        unitMix: { oneBedCount: 1, twoBedCount: 1, threeBedCount: 1, hmoUnitCount: 1 },
      }),
    ).toThrow('must match total');
  });

  it('rejects 0 total units', () => {
    expect(() =>
      blockUnitMixSectionSchema.parse({
        totalUnits: 0,
        unitMix: { oneBedCount: 0, twoBedCount: 0, threeBedCount: 0, hmoUnitCount: 0 },
      }),
    ).toThrow('at least 1 unit');
  });
});

// ── Composite schemas ────────────────────────────────────────────────────────

describe('hmoCompositeSchema', () => {
  it('accepts valid HMO composite', () => {
    const result = hmoCompositeSchema.parse({
      category: 'RENT_TO_RENT',
      strategy: 'HMO',
      address: {
        postcode: 'M1 1AA',
        region: 'NORTH',
        propertyType: 'TERRACED',
        addressLine1: '45 Test Street',
        city: 'Manchester',
      },
      hmoDetails: {
        isLicensed: true,
        isTenanted: false,
        needsRefurb: false,
        furnished: true,
        furnishingQuality: 'HIGH',
        hasLivingRoom: true,
        parking: 'NO',
        garden: 'NO',
        rooms: [{ name: 'Room 1', roomType: 'DOUBLE_EN_SUITE', monthlyRentPence: 50000 }],
      },
      rentTerm: {
        rentToLandlordPence: 150000,
        depositPence: 150000,
        contractLength: 12,
        referencingType: 'LTD',
      },
    });
    expect(result.category).toBe('RENT_TO_RENT');
    expect(result.strategy).toBe('HMO');
  });
});

describe('saCompositeSchema', () => {
  it('accepts valid SA composite', () => {
    const result = saCompositeSchema.parse({
      category: 'RENT_TO_RENT',
      strategy: 'SA',
      address: {
        postcode: 'M1 1AA',
        region: 'NORTH',
        propertyType: 'FLAT',
        addressLine1: '10 Test Road',
        city: 'Manchester',
      },
      saDetails: {
        bedrooms: 2,
        bathrooms: 1,
        accommodates: 4,
        furnished: true,
        furnishingQuality: 'GOOD',
        manualOverride: false,
      },
      rentTerm: {
        rentToLandlordPence: 120000,
        depositPence: 120000,
        contractLength: 12,
        referencingType: 'FULL',
      },
      saRevenue: {
        nightlyRatePence: 100,
        occupancyRate: 65,
        bookingFeePence: 0,
        maintenanceRate: 5,
        otherCostsPence: 0,
      },
    });
    expect(result.strategy).toBe('SA');
    expect(result.saRevenue.nightlyRatePence).toBe(100);
  });
});

describe('rentToRentCompositeSchema (discriminated union)', () => {
  it('accepts HMO with correct discriminator', () => {
    const result = rentToRentCompositeSchema.parse({
      strategy: 'HMO',
      category: 'RENT_TO_RENT',
      address: {
        postcode: 'M1 1AA',
        region: 'SOUTH',
        propertyType: 'DETACHED',
        addressLine1: '1 Test Lane',
        city: 'London',
      },
      hmoDetails: {
        isLicensed: true,
        isTenanted: true,
        tenancyType: 'FULL',
        needsRefurb: false,
        furnished: false,
        hasLivingRoom: true,
        parking: 'YES',
        parkingSpaces: 1,
        garden: 'NO',
        rooms: [{ name: 'Room 1', roomType: 'DOUBLE_EN_SUITE', monthlyRentPence: 60000 }],
      },
      rentTerm: {
        rentToLandlordPence: 100000,
        depositPence: 100000,
        contractLength: 24,
        referencingType: 'LTD',
      },
    });
    expect(result.strategy).toBe('HMO');
  });

  it('accepts SA with correct discriminator', () => {
    const result = rentToRentCompositeSchema.parse({
      strategy: 'SA',
      category: 'RENT_TO_RENT',
      address: {
        postcode: 'M1 1AA',
        region: 'NORTH',
        propertyType: 'FLAT',
        addressLine1: '20 Test Road',
        city: 'Manchester',
      },
      saDetails: {
        bedrooms: 1,
        bathrooms: 1,
        accommodates: 2,
        furnished: true,
        furnishingQuality: 'HIGH',
        manualOverride: false,
      },
      rentTerm: {
        rentToLandlordPence: 80000,
        depositPence: 80000,
        contractLength: 12,
        referencingType: 'LTD',
      },
      saRevenue: {
        nightlyRatePence: 120,
        occupancyRate: 70,
        bookingFeePence: 0,
        maintenanceRate: 5,
        otherCostsPence: 0,
      },
    });
    expect(result.strategy).toBe('SA');
  });

  it('rejects SA with HMO-specific fields (.strict())', () => {
    expect(() =>
      rentToRentCompositeSchema.parse({
        strategy: 'SA',
        category: 'RENT_TO_RENT',
        address: {
          postcode: 'M1 1AA',
          region: 'NORTH',
          propertyType: 'FLAT',
          addressLine1: '20 Test Road',
          city: 'Manchester',
        },
        saDetails: {
          bedrooms: 1,
          bathrooms: 1,
          accommodates: 2,
          furnished: true,
          furnishingQuality: 'HIGH',
          manualOverride: false,
        },
        rentTerm: {
          rentToLandlordPence: 80000,
          depositPence: 80000,
          contractLength: 12,
          referencingType: 'LTD',
        },
        saRevenue: {
          nightlyRatePence: 120,
          occupancyRate: 70,
          bookingFeePence: 0,
          maintenanceRate: 5,
          otherCostsPence: 0,
        },
        hmoDetails: { status: 'LICENCED', furnished: false, hasLivingRoom: true, parking: 'NO', garden: 'NO', rooms: [] },
      }),
    ).toThrow();
  });
});
