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

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Agency management ──

  @Get('agencies')
  async listAgencies(@Query('status') status?: string) {
    return this.adminService.listAgencies(status);
  }

  @Get('agencies/:id')
  async getAgencyDetail(@Param('id') id: string) {
    return this.adminService.getAgencyDetail(id);
  }

  @Post('agencies/:id/approve')
  @HttpCode(HttpStatus.OK)
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
  async listAllListings(@Query('status') status?: string) {
    return this.adminService.listAllListings(status);
  }

  @Post('listings/:id/moderate')
  @HttpCode(HttpStatus.OK)
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
  async getAuditLog(@Query('limit') limit?: string) {
    return this.adminService.getAuditLog(limit ? parseInt(limit, 10) : 50);
  }
}