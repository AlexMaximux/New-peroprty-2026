import {
  Controller,
  Get,
  Post,
  Patch,
  Delete as HttpDelete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ListingService } from './listing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApprovedAgencyGuard, RequireApprovedAgency } from '../common/guards/approved-agency.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('listings')
@Controller('listings')
export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  /**
   * Search published listings with filters (public).
   * Must be placed before :id route to avoid "search" matching as :id.
   */
  @Get('search')
  @ApiOperation({ summary: 'Search published listings with filters' })
  @ApiQuery({ name: 'category', required: false, description: 'Listing category filter' })
  @ApiQuery({ name: 'strategy', required: false, description: 'Investment strategy filter' })
  @ApiResponse({ status: 200, description: 'List of published listings' })
  async search(@Query() query: unknown) {
    return this.listingService.searchPublic(query);
  }

  /**
   * Create a new listing. Requires an APPROVED agency profile.
   */
  @Post()
  @UseGuards(JwtAuthGuard, ApprovedAgencyGuard)
  @RequireApprovedAgency()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new listing (approved agency only)' })
  @ApiResponse({ status: 201, description: 'Listing created successfully' })
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
  @UseGuards(JwtAuthGuard, ApprovedAgencyGuard)
  @RequireApprovedAgency()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a listing (owning agency only)' })
  @ApiResponse({ status: 200, description: 'Listing updated successfully' })
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
  @UseGuards(JwtAuthGuard, ApprovedAgencyGuard)
  @RequireApprovedAgency()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Publish a draft listing' })
  @ApiResponse({ status: 200, description: 'Listing published successfully' })
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
  @ApiOperation({ summary: 'Get a single listing by ID' })
  @ApiResponse({ status: 200, description: 'Listing details' })
  async findById(@Param('id') id: string) {
    return this.listingService.findByIdWithUrls(id);
  }

  /**
   * List all listings for the current agency.
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all listings for the current agency' })
  @ApiResponse({ status: 200, description: 'Agency listings' })
  async findByAgency(@CurrentUser() user: AuthenticatedUser) {
    return this.listingService.findByAgency(user.sub);
  }

  // ═════════════════════════════════════════════════════
  //  MEDIA ENDPOINTS (owner-only)
  // ═════════════════════════════════════════════════════

  /**
   * Request a presigned PUT URL for uploading an image directly to S3/MinIO.
   * Ownership verified in service.
   */
  @Post(':id/media/presign')
  @UseGuards(JwtAuthGuard, ApprovedAgencyGuard)
  @RequireApprovedAgency()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Request presigned URL for media upload' })
  @ApiResponse({ status: 200, description: 'Presigned upload URL' })
  async presignUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.listingService.presignUpload(user.sub, id, body);
  }

  /**
   * Confirm a completed upload by persisting the media record.
   */
  @Post(':id/media/confirm')
  @UseGuards(JwtAuthGuard, ApprovedAgencyGuard)
  @RequireApprovedAgency()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Confirm completed media upload' })
  @ApiResponse({ status: 201, description: 'Media record created' })
  async confirmMedia(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.listingService.confirmMedia(user.sub, id, body);
  }

  /**
   * Delete a media record and its underlying S3 object.
   */
  @HttpDelete(':id/media/:mediaId')
  @UseGuards(JwtAuthGuard, ApprovedAgencyGuard)
  @RequireApprovedAgency()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a media record' })
  @ApiResponse({ status: 200, description: 'Media deleted successfully' })
  async deleteMedia(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('mediaId') mediaId: string,
  ) {
    return this.listingService.deleteMedia(user.sub, id, mediaId);
  }
}