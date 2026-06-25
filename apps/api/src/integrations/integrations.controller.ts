import { Controller, Get, Query, Inject } from '@nestjs/common';
import { GEOCODING_SERVICE } from './integrations.module';
import type { GeocodingService } from './geocoding.service';

@Controller('integrations')
export class IntegrationsController {
  constructor(
    @Inject(GEOCODING_SERVICE) private readonly geocodingService: GeocodingService,
  ) {}

  @Get('geocode')
  async geocode(@Query('address') address: string) {
    if (!address) {
      return { results: [] };
    }
    const results = await this.geocodingService.geocode(address);
    return { results };
  }
}