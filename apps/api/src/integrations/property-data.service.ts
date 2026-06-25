import { Injectable, Logger } from '@nestjs/common';

export interface PropertyDataEstimate {
  /** Estimated monthly rent in pence */
  estimatedMonthlyRentPence: number;
  /** Estimated property value in pence */
  estimatedValuePence: number;
  /** Estimated yield as a decimal (0.0 – 1.0) */
  estimatedYield: number;
  /** Postcode area used for the estimate */
  postcode: string;
  /** Data source description */
  source: string;
}

export interface PropertyDataService {
  getRentEstimate(postcode: string, bedrooms: number): Promise<PropertyDataEstimate>;
  getValueEstimate(postcode: string, propertyType?: string): Promise<PropertyDataEstimate>;
}

@Injectable()
export class RealPropertyDataService implements PropertyDataService {
  private readonly logger = new Logger(RealPropertyDataService.name);

  constructor() {
    this.logger.log('RealPropertyDataService initialized');
  }

  async getRentEstimate(postcode: string, bedrooms: number): Promise<PropertyDataEstimate> {
    this.logger.warn(`RealPropertyDataService called but integration not yet implemented for postcode=${postcode}, bedrooms=${bedrooms}`);
    throw new Error('Property Data API integration not yet implemented. Set PROPERTY_DATA_MODE=mock for deterministic data.');
  }

  async getValueEstimate(postcode: string, propertyType?: string): Promise<PropertyDataEstimate> {
    this.logger.warn(`RealPropertyDataService called but integration not yet implemented for postcode=${postcode}, propertyType=${propertyType}`);
    throw new Error('Property Data API integration not yet implemented. Set PROPERTY_DATA_MODE=mock for deterministic data.');
  }
}

/**
 * Deterministic mock PropertyData service returning sample data keyed by postcode.
 *
 * Usage: set PROPERTY_DATA_MODE=mock in env (default).
 */
@Injectable()
export class MockPropertyDataService implements PropertyDataService {
  private readonly logger = new Logger(MockPropertyDataService.name);

  // Deterministic sample data — monthly rent pence, estimated value pence, yield
  private readonly samples: Record<string, { monthlyRentPence: number; valuePence: number; yield: number }> = {
    'M1':  { monthlyRentPence: 120000, valuePence: 18000000, yield: 0.08 },
    'M2':  { monthlyRentPence: 140000, valuePence: 24000000, yield: 0.07 },
    'M15': { monthlyRentPence: 95000,  valuePence: 15000000, yield: 0.076 },
    'SW1': { monthlyRentPence: 250000, valuePence: 75000000, yield: 0.04 },
    'SW2': { monthlyRentPence: 160000, valuePence: 35000000, yield: 0.055 },
    'E1':  { monthlyRentPence: 200000, valuePence: 50000000, yield: 0.048 },
    'EC1': { monthlyRentPence: 220000, valuePence: 58000000, yield: 0.045 },
    'B1':  { monthlyRentPence: 105000, valuePence: 17000000, yield: 0.074 },
    'B2':  { monthlyRentPence: 100000, valuePence: 16000000, yield: 0.075 },
    'LS1': { monthlyRentPence: 115000, valuePence: 19000000, yield: 0.073 },
    'LS2': { monthlyRentPence: 110000, valuePence: 18000000, yield: 0.073 },
    'L1':  { monthlyRentPence: 125000, valuePence: 20000000, yield: 0.075 },
    'L2':  { monthlyRentPence: 120000, valuePence: 19000000, yield: 0.076 },
  };

  constructor() {
    this.logger.log('MockPropertyDataService initialized');
  }

  async getRentEstimate(postcode: string, bedrooms: number): Promise<PropertyDataEstimate> {
    const prefix = postcode.trim().toUpperCase().split(' ')[0] ?? postcode.toUpperCase();
    const base = this.samples[prefix];

    if (!base) {
      return {
        estimatedMonthlyRentPence: 120000,
        estimatedValuePence: 25000000,
        estimatedYield: 0.058,
        postcode,
        source: 'MockPropertyData (fallback)',
      };
    }

    // Bedroom factor: +12% per extra bedroom beyond 2
    const bedroomFactor = bedrooms > 2 ? 1 + (bedrooms - 2) * 0.12 : 1;
    const scaledRent = Math.round(base.monthlyRentPence * bedroomFactor);

    return {
      estimatedMonthlyRentPence: scaledRent,
      estimatedValuePence: base.valuePence,
      estimatedYield: base.yield,
      postcode,
      source: 'MockPropertyData',
    };
  }

  async getValueEstimate(postcode: string, _propertyType?: string): Promise<PropertyDataEstimate> {
    const prefix = postcode.trim().toUpperCase().split(' ')[0] ?? postcode.toUpperCase();
    const base = this.samples[prefix];

    if (!base) {
      return {
        estimatedMonthlyRentPence: 120000,
        estimatedValuePence: 25000000,
        estimatedYield: 0.058,
        postcode,
        source: 'MockPropertyData (fallback)',
      };
    }

    return {
      estimatedMonthlyRentPence: base.monthlyRentPence,
      estimatedValuePence: base.valuePence,
      estimatedYield: base.yield,
      postcode,
      source: 'MockPropertyData',
    };
  }
}