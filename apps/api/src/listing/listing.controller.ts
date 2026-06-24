import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ListingService } from './listing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApprovedAgencyGuard, RequireApprovedAgency } from '../common/guards/approved-agency.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Controller('listings')
@UseGuards(JwtAuthGuard)
export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  /**
   * Search published listings with filters (all authenticated users).
   * Must be placed before :id route to avoid "search" matching as :id.
   */
  @Get('search')
  async search(@Query() query: unknown) {
    return this.listingService.searchPublic(query);
  }

  /**
   * Create a new listing. Requires an APPROVED agency profile.
   */
  @Post()
  @UseGuards(ApprovedAgencyGuard)
  @RequireApprovedAgency()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    return this.listingService.create(user.sub, body);
  }

  /**
   * Update an existing listing (owning agency only).
   */
  @Patch(':id')
  @UseGuards(ApprovedAgencyGuard)
  @RequireApprovedAgency()
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.listingService.update(user.sub, id, body);
  }

  /**
   * Publish a draft listing (owning agency only).
   */
  @Post(':id/publish')
  @UseGuards(ApprovedAgencyGuard)
  @RequireApprovedAgency()
  @HttpCode(HttpStatus.OK)
  async publish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.listingService.publish(user.sub, id);
  }

  /**
   * Get a single listing by ID.
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.listingService.findById(id);
  }

  /**
   * List all listings for the current agency.
   */
  @Get()
  async findByAgency(@CurrentUser() user: AuthenticatedUser) {
    return this.listingService.findByAgency(user.sub);
  }
}