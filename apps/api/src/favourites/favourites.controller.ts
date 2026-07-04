import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FavouritesService } from './favourites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('favourites')
@Controller('favourites')
@UseGuards(JwtAuthGuard)
export class FavouritesController {
  constructor(private readonly favouritesService: FavouritesService) {}

  /**
   * Add a listing to favourites.
   */
  @Post(':listingId')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add a listing to favourites' })
  @ApiResponse({ status: 201, description: 'Listing added to favourites' })
  async add(
    @CurrentUser() user: AuthenticatedUser,
    @Param('listingId') listingId: string,
  ) {
    return this.favouritesService.add(user.sub, listingId);
  }

  /**
   * Remove a listing from favourites.
   */
  @Delete(':listingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Remove a listing from favourites' })
  @ApiResponse({ status: 204, description: 'Listing removed from favourites' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('listingId') listingId: string,
  ) {
    await this.favouritesService.remove(user.sub, listingId);
  }

  /**
   * List all favourites for the current user.
   */
  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all favourites for the current user' })
  @ApiResponse({ status: 200, description: 'List of favourite listings' })
  async list(@CurrentUser() user: AuthenticatedUser) {
    return this.favouritesService.findByUser(user.sub);
  }
}