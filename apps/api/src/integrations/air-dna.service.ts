import { Injectable, Logger } from '@nestjs/common';

export interface AirDnaEstimate {
  /** Average nightly rate in pence */
  averageNightlyRatePence: number;
  /** Average occupancy rate as a decimal (0.0 – 1.0) */
  averageOccupancyRate: number;
  /** Projected monthly revenue in pence */
  projectedMonthlyRevenuePence: number;
  /** Number of comparable listings found */
  comparableListings: number;
  /** Confidence level */
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  /** Postcode area used for the estimate */
  postcode: string;
}

export interface AirDnaService {
  getEstimate(postcode: string, bedrooms: number): Promise<AirDnaEstimate>;
}

@Injectable()
export class RealAirDnaService implements AirDnaService {
  private readonly logger = new Logger(RealAirDnaService.name);

  constructor() {
    this.logger.log('RealAirDnaService initialized');
  }

  async getEstimate(postcode: string, bedrooms: number): Promise<AirDnaEstimate> {
    // Real implementation would call the AirDNA API
    // https://api.airdna.co/v1/...
    this.logger.warn(`RealAirDnaService called but AirDNA integration is not yet implemented for postcode=${postcode}, bedrooms=${bedrooms}`);
    throw new Error('AirDNA API integration not yet implemented. Set AIRDNA_MODE=mock for deterministic data.');
  }
}

/**
 * Deterministic mock AirDNA service returning sample data keyed by postcode + bedrooms.
 *
 * Usage: set AIRDNA_MODE=mock in env (default).
 */
@Injectable()
export class MockAirDnaService implements AirDnaService {
  private readonly logger = new Logger(MockAirDnaService.name);

  // Deterministic sample data keyed by postcode prefix
  private readonly samples: Record<string, Omit<AirDnaEstimate, 'postcode' | 'comparableListings' | 'confidence'>> = {
    'M1':  { averageNightlyRatePence: 9500, averageOccupancyRate: 0.78, projectedMonthlyRevenuePence: 222300 },
    'M2':  { averageNightlyRatePence: 11000, averageOccupancyRate: 0.75, projectedMonthlyRevenuePence: 247500 },
    'M3':  { averageNightlyRatePence: 10500, averageOccupancyRate: 0.72, projectedMonthlyRevenuePence: 226800 },
    'M15': { averageNightlyRatePence: 7500, averageOccupancyRate: 0.80, projectedMonthlyRevenuePence: 180000 },
    'SW1': { averageNightlyRatePence: 18500, averageOccupancyRate: 0.70, projectedMonthlyRevenuePence: 388500 },
    'SW2': { averageNightlyRatePence: 11000, averageOccupancyRate: 0.74, projectedMonthlyRevenuePence: 244200 },
    'E1':  { averageNightlyRatePence: 15000, averageOccupancyRate: 0.72, projectedMonthlyRevenuePence: 324000 },
    'EC1': { averageNightlyRatePence: 17500, averageOccupancyRate: 0.68, projectedMonthlyRevenuePence: 357000 },
    'B1':  { averageNightlyRatePence: 8500, averageOccupancyRate: 0.76, projectedMonthlyRevenuePence: 193800 },
    'B2':  { averageNightlyRatePence: 8000, averageOccupancyRate: 0.77, projectedMonthlyRevenuePence: 184800 },
    'LS1': { averageNightlyRatePence: 8800, averageOccupancyRate: 0.75, projectedMonthlyRevenuePence: 198000 },
    'LS2': { averageNightlyRatePence: 8200, averageOccupancyRate: 0.78, projectedMonthlyRevenuePence: 191880 },
    'L1':  { averageNightlyRatePence: 9000, averageOccupancyRate: 0.73, projectedMonthlyRevenuePence: 197100 },
  };

  constructor() {
    this.logger.log('MockAirDnaService initialized');
  }

  async getEstimate(postcode: string, bedrooms: number): Promise<AirDnaEstimate> {
    const prefix = postcode.trim().toUpperCase().split(' ')[0] ?? postcode.toUpperCase();
    const base = this.samples[prefix];

    if (!base) {
      // Generic fallback
      return {
        averageNightlyRatePence: 8000,
        averageOccupancyRate: 0.72,
        projectedMonthlyRevenuePence: 172800,
        comparableListings: 12,
        confidence: 'LOW',
        postcode,
      };
    }

    // Scale for bedrooms: +15% per extra bedroom beyond 1
    const bedroomFactor = bedrooms > 1 ? 1 + (bedrooms - 1) * 0.15 : 1;
    const scaledNightly = Math.round(base.averageNightlyRatePence * bedroomFactor);
    const scaledMonthly = Math.round(base.projectedMonthlyRevenuePence * bedroomFactor);

    return {
      averageNightlyRatePence: scaledNightly,
      averageOccupancyRate: base.averageOccupancyRate,
      projectedMonthlyRevenuePence: scaledMonthly,
      comparableListings: 25 + Math.floor(prefix.charCodeAt(0) % 20),
      confidence: prefix.length <= 2 ? 'HIGH' : 'MEDIUM',
      postcode,
    };
  }
}