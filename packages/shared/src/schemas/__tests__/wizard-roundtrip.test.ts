import { describe, it, expect } from 'vitest';
import { getStrategyDataSchema, createListingSchema } from '../listing.schema';

/**
 * Composes a payload exactly as the Rent-to-Rent wizard's handleSubmit does for HMO.
 * This MUST match apps/web/components/listings/wizard/rent-to-rent-wizard.tsx.
 */
function composeHmoPayload() {
  const address = {
    postcode: 'SW1A 1AA',
    houseNumber: '10',
    addressLine1: 'Downing Street',
    city: 'London',
    region: 'SOUTH',
    propertyType: 'TERRACED',
    latitude: 51.503,
    longitude: -0.1276,
  };

  const hmoDetails = {
    isLicensed: true,
    isTenanted: false,
    needsRefurb: false,
    furnished: true,
    furnishingQuality: 'HIGH',
    hasLivingRoom: true,
    parking: 'YES',
    parkingSpaces: 2,
    garden: 'NO',
    rooms: [
      { name: 'Room 1', roomType: 'DOUBLE_EN_SUITE', monthlyRentPence: 40000 },
      { name: 'Room 2', roomType: 'SINGLE_SHARED', monthlyRentPence: 30000 },
    ],
  };

  const rentTerm = {
    rentToLandlordPence: 100000,
    depositPence: 100000,
    contractLength: 12,
    referencingType: 'LTD',
    finderFeePence: 50000,
    happyToCoSource: true,
    bills: [
      { label: 'Electricity', amountPence: 5000 },
    ],
    managementEnabled: true,
    managementRatePercent: 10,
    cleaningPence: 3000,
  };

  return {
    category: 'RENT_TO_RENT',
    strategy: 'HMO',
    status: 'PUBLISHED',
    base: {
      title: `${address.houseNumber ? address.houseNumber + ' ' : ''}${address.addressLine1}`,
      addressLine1: address.addressLine1,
      addressLine2: '',
      city: address.city,
      postcode: address.postcode,
      buildingNumber: address.houseNumber ?? '',
      region: address.region === 'MANUAL' ? '' : address.region,
      propertyType: address.propertyType,
      propertyTypeOther: '',
      bedrooms: hmoDetails.rooms.length,
      latitude: address.latitude ?? undefined,
      longitude: address.longitude ?? undefined,
      isLicensed: hmoDetails.isLicensed,
      isTenanted: hmoDetails.isTenanted,
      needsRefurb: hmoDetails.needsRefurb,
      hasLivingRoom: hmoDetails.hasLivingRoom,
      hasGarden: hmoDetails.garden === 'YES',
      gardenNotes: '',
      parking: hmoDetails.parking === 'YES' ? String(hmoDetails.parkingSpaces ?? 1) : hmoDetails.parking,
      furnishedStatus: hmoDetails.furnished ? 'FURNISHED' : 'UNFURNISHED',
      furnishingQuality: hmoDetails.furnishingQuality ?? '',
      furnishingNotes: '',
    },
    hmoRooms: hmoDetails.rooms.map((r: any) => ({
      name: r.name,
      roomType: r.roomType,
      monthlyRentPence: r.monthlyRentPence,
    })),
    strategySpecificData: {
      rentToLandlordPence: rentTerm.rentToLandlordPence,
      depositPence: rentTerm.depositPence,
      contractLengthMonths: rentTerm.contractLength ?? 12,
      finderFeePence: rentTerm.finderFeePence,
      happyToCoSource: rentTerm.happyToCoSource,
      managementEnabled: rentTerm.managementEnabled,
      managementRatePercent: rentTerm.managementRatePercent,
      billsPence: rentTerm.bills.reduce((s: number, b: any) => s + b.amountPence, 0),
      cleaningPence: rentTerm.cleaningPence,
      agencyDetails: '',
    },
  };
}

/**
 * Composes a payload exactly as the Rent-to-Rent wizard's handleSubmit does for SA.
 */
function composeSaPayload() {
  const address = {
    postcode: 'SW1A 1AA',
    houseNumber: '11',
    addressLine1: 'Downing Street',
    city: 'London',
    region: 'SOUTH',
    propertyType: 'FLAT',
    latitude: null,
    longitude: null,
  };

  const saDetails = {
    bedrooms: 2,
    bathrooms: 1,
    accommodates: 4,
    furnished: true,
    furnishingQuality: 'GOOD',
    manualOverride: false,
  };

  const rentTerm = {
    rentToLandlordPence: 150000,
    depositPence: 150000,
    contractLength: 12,
    referencingType: 'LTD',
    finderFeePence: 0,
    happyToCoSource: false,
    bills: [],
    managementEnabled: false,
    managementRatePercent: 10,
    cleaningPence: 5000,
  };

  const saRevenue = {
    nightlyRatePence: 10000,
    occupancyRate: 0.70,
    bookingFeePence: 2000,
    maintenanceRate: 0.05,
    otherCostsPence: 1000,
  };

  return {
    category: 'RENT_TO_RENT',
    strategy: 'SA',
    status: 'PUBLISHED',
    base: {
      title: `${address.houseNumber ? address.houseNumber + ' ' : ''}${address.addressLine1}`,
      addressLine1: address.addressLine1,
      addressLine2: '',
      city: address.city,
      postcode: address.postcode,
      buildingNumber: address.houseNumber ?? '',
      region: address.region === 'MANUAL' ? '' : address.region,
      propertyType: address.propertyType,
      propertyTypeOther: '',
      bedrooms: saDetails.bedrooms,
      bathrooms: saDetails.bathrooms,
      latitude: address.latitude ?? undefined,
      longitude: address.longitude ?? undefined,
      furnishedStatus: saDetails.furnished ? 'FURNISHED' : 'UNFURNISHED',
      furnishingQuality: saDetails.furnishingQuality ?? '',
      furnishingNotes: '',
    },
    strategySpecificData: {
      rentPence: rentTerm.rentToLandlordPence,
      rentToLandlordPence: rentTerm.rentToLandlordPence,
      depositPence: rentTerm.depositPence,
      contractLengthMonths: rentTerm.contractLength ?? 12,
      finderFeePence: rentTerm.finderFeePence,
      happyToCoSource: rentTerm.happyToCoSource,
      managementEnabled: rentTerm.managementEnabled,
      managementRatePercent: rentTerm.managementRatePercent,
      billsPence: rentTerm.bills.reduce((s: number, b: any) => s + b.amountPence, 0),
      cleaningCostPence: rentTerm.cleaningPence,
      maxGuests: saDetails.accommodates,
      furnished: saDetails.furnished,
      furnishingQuality: saDetails.furnishingQuality ?? '',
      nightlyRatePence: saRevenue.nightlyRatePence,
      occupancyRate: saRevenue.occupancyRate,
      bookingFeePence: saRevenue.bookingFeePence ?? 0,
      maintenanceRate: saRevenue.maintenanceRate ?? 0.05,
      otherCostsPence: saRevenue.otherCostsPence ?? 0,
      agencyDetails: '',
    },
  };
}

describe('wizard → server round-trip', () => {
  it('HMO payload passes createListingSchema (outer shape)', () => {
    const payload = composeHmoPayload();
    const result = createListingSchema.safeParse(payload);
    if (!result.success) {
      const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
      throw new Error(`HMO outer validation failed:\n${issues.join('\n')}`);
    }
    expect(result.success).toBe(true);
  });

  it('HMO strategy-specific data passes hmoSpecificSchema', () => {
    const payload = composeHmoPayload();
    const schema = getStrategyDataSchema('RENT_TO_RENT', 'HMO');
    const result = schema.safeParse(payload.strategySpecificData);
    if (!result.success) {
      const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
      throw new Error(`HMO strategy-specific validation failed:\n${issues.join('\n')}`);
    }
    expect(result.success).toBe(true);
  });

  it('SA payload passes createListingSchema (outer shape)', () => {
    const payload = composeSaPayload();
    const result = createListingSchema.safeParse(payload);
    if (!result.success) {
      const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
      throw new Error(`SA outer validation failed:\n${issues.join('\n')}`);
    }
    expect(result.success).toBe(true);
  });

  it('SA strategy-specific data passes saSpecificSchema', () => {
    const payload = composeSaPayload();
    const schema = getStrategyDataSchema('RENT_TO_RENT', 'SA');
    const result = schema.safeParse(payload.strategySpecificData);
    if (!result.success) {
      const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
      throw new Error(`SA strategy-specific validation failed:\n${issues.join('\n')}`);
    }
    expect(result.success).toBe(true);
  });
});
