import { describe, it, expect } from 'vitest';
import { createListingSchema } from '@propvest/shared';

describe('HMO room name validation (schema-level)', () => {
  it('rejects HMO room with empty name', () => {
    const payload = {
      category: 'RENT_TO_RENT',
      strategy: 'HMO',
      base: {
        title: 'Test',
        addressLine1: '1 High St',
        city: 'Manchester',
        postcode: 'M1 1AA',
      },
      hmoRooms: [
        { name: '', roomType: 'DOUBLE_EN_SUITE', monthlyRentPence: 60000 },
      ],
    };

    const result = createListingSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const names = result.error.issues
        .filter((i) => i.path.join('.').startsWith('hmoRooms'))
        .map((i) => ({ path: i.path.join('.'), message: i.message }));
      expect(names).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'hmoRooms.0.name',
            message: expect.stringContaining(''),
          }),
        ]),
      );
    }
  });

  it('accepts HMO room with auto-incremented name like "Room 1"', () => {
    const payload = {
      category: 'RENT_TO_RENT',
      strategy: 'HMO',
      base: {
        title: 'Test',
        addressLine1: '1 High St',
        city: 'Manchester',
        postcode: 'M1 1AA',
      },
      hmoRooms: [
        { name: 'Room 1', roomType: 'DOUBLE_EN_SUITE', monthlyRentPence: 60000 },
        { name: 'Room 2', roomType: 'SINGLE_SHARED', monthlyRentPence: 45000 },
      ],
    };

    const result = createListingSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('accepts fully-filled HMO payload (happy path)', () => {
    const payload = {
      category: 'RENT_TO_RENT',
      strategy: 'HMO',
      status: 'PUBLISHED',
      base: {
        title: 'Complete HMO Test',
        description: 'A fully filled HMO listing for testing',
        addressLine1: '45 High Street',
        city: 'Manchester',
        postcode: 'M1 1AA',
        bedrooms: 5,
        bathrooms: 2,
        propertyType: 'TERRACED',
      },
      hmoRooms: [
        { name: 'Room 1', roomType: 'DOUBLE_EN_SUITE', monthlyRentPence: 60000 },
        { name: 'Room 2', roomType: 'SINGLE_SHARED', monthlyRentPence: 45000 },
        { name: 'Room 3', roomType: 'DOUBLE_SHARED', monthlyRentPence: 55000 },
      ],
      strategySpecificData: {
        rentTerm: '12 months',
        rentToLandlordPence: 150000,
        depositPence: 150000,
        contractLengthMonths: 12,
        finderFeePence: 100000,
        managementEnabled: true,
        managementRatePercent: 10,
        billsPence: 20000,
      },
    };

    const result = createListingSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('rejects payload missing required base fields (city)', () => {
    const payload = {
      category: 'RENT_TO_RENT',
      strategy: 'HMO',
      base: {
        title: 'Test',
        addressLine1: '1 High St',
        // city missing
        postcode: 'M1 1AA',
      },
      hmoRooms: [
        { name: 'Room 1', roomType: 'DOUBLE_EN_SUITE', monthlyRentPence: 60000 },
      ],
    };

    const result = createListingSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const cityIssues = result.error.issues.filter((i) => i.path.join('.') === 'base.city');
      expect(cityIssues.length).toBeGreaterThan(0);
    }
  });
});