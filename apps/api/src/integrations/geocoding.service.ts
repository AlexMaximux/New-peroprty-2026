import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  city: string;
  postcode: string;
  region: string | null;
  nation: string | null;
}

export interface GeocodingService {
  geocode(address: string): Promise<GeocodingResult[]>;
  reverseGeocode(lat: number, lng: number): Promise<GeocodingResult[]>;
}

@Injectable()
export class RealGeocodingService implements GeocodingService, OnModuleInit {
  private readonly logger = new Logger(RealGeocodingService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>('GOOGLE_MAPS_API_KEY');
  }

  onModuleInit() {
    this.logger.log('RealGeocodingService initialized (Google Geocoding API)');
  }

  async geocode(address: string): Promise<GeocodingResult[]> {
    const url = `${this.baseUrl}?address=${encodeURIComponent(address)}&key=${this.apiKey}`;
    const res = await fetch(url);
    const data = await res.json() as {
      status: string;
      results: Array<{
        formatted_address: string;
        geometry: { location: { lat: number; lng: number } };
        address_components: Array<{
          long_name: string;
          short_name: string;
          types: string[];
        }>;
      }>;
      error_message?: string;
    };

    if (data.status !== 'OK') {
      throw new Error(`Geocoding API error: ${data.status}${data.error_message ? ` — ${data.error_message}` : ''}`);
    }

    return data.results.map((r) => {
      const city = r.address_components.find((c) =>
        c.types.includes('locality') || c.types.includes('postal_town'),
      )?.long_name ?? '';
      const postcode = r.address_components.find((c) =>
        c.types.includes('postal_code'),
      )?.long_name ?? '';
      const region = r.address_components.find((c) =>
        c.types.includes('administrative_area_level_1') || c.types.includes('administrative_area_level_2'),
      )?.long_name ?? null;
      const nation = r.address_components.find((c) =>
        c.types.includes('country'),
      )?.long_name ?? null;

      return {
        latitude: r.geometry.location.lat,
        longitude: r.geometry.location.lng,
        formattedAddress: r.formatted_address,
        city,
        postcode,
        region,
        nation,
      };
    });
  }

  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult[]> {
    const url = `${this.baseUrl}?latlng=${lat},${lng}&key=${this.apiKey}`;
    const res = await fetch(url);
    const data = await res.json() as {
      status: string;
      results: Array<{
        formatted_address: string;
        geometry: { location: { lat: number; lng: number } };
        address_components: Array<{
          long_name: string;
          short_name: string;
          types: string[];
        }>;
      }>;
      error_message?: string;
    };

    if (data.status !== 'OK') {
      throw new Error(`Reverse geocoding API error: ${data.status}${data.error_message ? ` — ${data.error_message}` : ''}`);
    }

    return data.results.map((r) => {
      const city = r.address_components.find((c) =>
        c.types.includes('locality') || c.types.includes('postal_town'),
      )?.long_name ?? '';
      const postcode = r.address_components.find((c) =>
        c.types.includes('postal_code'),
      )?.long_name ?? '';
      const region = r.address_components.find((c) =>
        c.types.includes('administrative_area_level_1') || c.types.includes('administrative_area_level_2'),
      )?.long_name ?? null;
      const nation = r.address_components.find((c) =>
        c.types.includes('country'),
      )?.long_name ?? null;

      return {
        latitude: r.geometry.location.lat,
        longitude: r.geometry.location.lng,
        formattedAddress: r.formatted_address,
        city,
        postcode,
        region,
        nation,
      };
    });
  }
}

@Injectable()
export class MockGeocodingService implements GeocodingService {
  private readonly logger = new Logger(MockGeocodingService.name);

  constructor() {
    this.logger.log('MockGeocodingService initialized');
  }

  async geocode(address: string): Promise<GeocodingResult[]> {
    // Return deterministic mock data based on address patterns
    const lower = address.toLowerCase();

    if (lower.includes('manchester') || lower.includes('m1')) {
      return [{
        latitude: 53.4808,
        longitude: -2.2426,
        formattedAddress: 'Manchester, UK',
        city: 'Manchester',
        postcode: 'M1 1AA',
        region: 'Greater Manchester',
        nation: 'England',
      }];
    }

    if (lower.includes('london') || lower.includes('sw1') || lower.includes('ec1')) {
      return [{
        latitude: 51.5074,
        longitude: -0.1278,
        formattedAddress: 'London, UK',
        city: 'London',
        postcode: 'SW1A 1AA',
        region: 'Greater London',
        nation: 'England',
      }];
    }

    if (lower.includes('birmingham') || lower.includes('b1')) {
      return [{
        latitude: 52.4862,
        longitude: -1.8904,
        formattedAddress: 'Birmingham, UK',
        city: 'Birmingham',
        postcode: 'B1 1AA',
        region: 'West Midlands',
        nation: 'England',
      }];
    }

    if (lower.includes('leeds') || lower.includes('ls1')) {
      return [{
        latitude: 53.8008,
        longitude: -1.5491,
        formattedAddress: 'Leeds, UK',
        city: 'Leeds',
        postcode: 'LS1 1AA',
        region: 'West Yorkshire',
        nation: 'England',
      }];
    }

    // Default mock for unknown addresses
    return [{
      latitude: 51.5074,
      longitude: -0.1278,
      formattedAddress: address,
      city: 'London',
      postcode: 'SW1A 1AA',
      region: 'Greater London',
      nation: 'England',
    }];
  }

  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult[]> {
    // Deterministic reverse geocode for common coords
    if (Math.abs(lat - 53.48) < 0.02 && Math.abs(lng - -2.24) < 0.02) {
      return [{
        latitude: lat,
        longitude: lng,
        formattedAddress: 'Manchester, UK',
        city: 'Manchester',
        postcode: 'M1 1AA',
        region: 'Greater Manchester',
        nation: 'England',
      }];
    }

    return [{
      latitude: lat,
      longitude: lng,
      formattedAddress: `${lat}, ${lng}`,
      city: 'London',
      postcode: 'SW1A 1AA',
      region: 'Greater London',
      nation: 'England',
    }];
  }
}