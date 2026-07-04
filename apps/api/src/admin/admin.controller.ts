import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import {
  approveAgencySchema,
  rejectAgencySchema,
  moderateListingSchema,
} from '@propvest/shared';
import { UserRole } from '@prisma/client';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Agency management ──

  @Get('agencies')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List agencies (admin only)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by verification status' })
  @ApiResponse({ status: 200, description: 'List of agencies' })
  async listAgencies(@Query('status') status?: string) {
    return this.adminService.listAgencies(status);
  }

  @Get('agencies/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get agency details' })
  @ApiResponse({ status: 200, description: 'Agency details' })
  async getAgencyDetail(@Param('id') id: string) {
    return this.adminService.getAgencyDetail(id);
  }

  @Post('agencies/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Approve an agency' })
  @ApiResponse({ status: 200, description: 'Agency approved successfully' })
  async approveAgency(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    approveAgencySchema.parse(body);
    return this.adminService.approveAgency(user.sub, id);
  }

  @Post('agencies/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Reject an agency with reason' })
  @ApiResponse({ status: 200, description: 'Agency rejected successfully' })
  async rejectAgency(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const dto = rejectAgencySchema.parse(body);
    return this.adminService.rejectAgency(user.sub, id, dto.reason);
  }

  // ── Listing moderation ──

  @Get('listings')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all listings for moderation' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by listing status' })
  @ApiResponse({ status: 200, description: 'List of listings' })
  async listAllListings(@Query('status') status?: string) {
    return this.adminService.listAllListings(status);
  }

  @Post('listings/:id/moderate')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Moderate a listing (publish/unpublish)' })
  @ApiResponse({ status: 200, description: 'Listing moderated successfully' })
  async moderateListing(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const dto = moderateListingSchema.parse(body);
    return this.adminService.moderateListing(user.sub, id, dto.action, dto.reason);
  }

  // ── Audit log ──

  @Get('audit-log')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get admin audit log' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of entries' })
  @ApiResponse({ status: 200, description: 'Audit log entries' })
  async getAuditLog(@Query('limit') limit?: string) {
    return this.adminService.getAuditLog(limit ? parseInt(limit, 10) : 50);
  }
}