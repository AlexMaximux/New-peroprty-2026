import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { AgencyService } from './agency.service';
import {
  createAgencyProfileSchema,
  requestUploadUrlSchema,
  verifyDocumentSchema,
} from '@propvest/shared';

@Controller('agency')
@UseGuards(JwtAuthGuard)
export class AgencyController {
  constructor(private readonly agencyService: AgencyService) {}

  @Post('profile')
  async createProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    const dto = createAgencyProfileSchema.parse(body);
    return this.agencyService.createProfile(user.sub, dto);
  }

  @Get('profile')
  async getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.agencyService.getMyProfile(user.sub);
  }

  @Post('documents/upload-url')
  async requestUploadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    const dto = requestUploadUrlSchema.parse(body);
    return this.agencyService.requestUploadUrl(user.sub, dto);
  }

  @Post('documents/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    const dto = verifyDocumentSchema.parse(body);
    return this.agencyService.confirmUpload(user.sub, dto.fileKey, dto.originalName, dto.type);
  }

  @Get('documents')
  async listDocuments(@CurrentUser() user: AuthenticatedUser) {
    return this.agencyService.listDocuments(user.sub);
  }

  @Get('documents/:id/download-url')
  async getDocumentDownloadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') documentId: string,
  ) {
    return this.agencyService.getDocumentDownloadUrl(user.sub, documentId);
  }
}