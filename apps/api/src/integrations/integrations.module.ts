import { Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RealGeocodingService, MockGeocodingService } from './geocoding.service';
import { RealAirDnaService, MockAirDnaService } from './air-dna.service';
import { RealPropertyDataService, MockPropertyDataService } from './property-data.service';
import type { GeocodingService } from './geocoding.service';
import type { AirDnaService } from './air-dna.service';
import type { PropertyDataService } from './property-data.service';

// ── Provider factory functions ──

function geocodingProvider(): Provider<GeocodingService> {
  return {
    provide: 'GEOCODING_SERVICE',
    inject: [ConfigService],
    useFactory: (config: ConfigService) => {
      const mode = config.get<string>('GOOGLE_MAPS_MODE', 'mock');
      if (mode === 'real') {
        return new RealGeocodingService(config);
      }
      return new MockGeocodingService();
    },
  };
}

function airDnaProvider(): Provider<AirDnaService> {
  return {
    provide: 'AIRDNA_SERVICE',
    inject: [ConfigService],
    useFactory: (config: ConfigService) => {
      const mode = config.get<string>('AIRDNA_MODE', 'mock');
      if (mode === 'real') {
        return new RealAirDnaService();
      }
      return new MockAirDnaService();
    },
  };
}

function propertyDataProvider(): Provider<PropertyDataService> {
  return {
    provide: 'PROPERTY_DATA_SERVICE',
    inject: [ConfigService],
    useFactory: (config: ConfigService) => {
      const mode = config.get<string>('PROPERTY_DATA_MODE', 'mock');
      if (mode === 'real') {
        return new RealPropertyDataService();
      }
      return new MockPropertyDataService();
    },
  };
}

import { IntegrationsController } from './integrations.controller';

@Module({
  controllers: [IntegrationsController],
  providers: [geocodingProvider(), airDnaProvider(), propertyDataProvider()],
  exports: ['GEOCODING_SERVICE', 'AIRDNA_SERVICE', 'PROPERTY_DATA_SERVICE'],
})
export class IntegrationsModule {}

export { GEOCODING_SERVICE, AIRDNA_SERVICE, PROPERTY_DATA_SERVICE } from './integrations.tokens';