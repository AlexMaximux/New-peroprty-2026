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
import { FavouritesService } from './favourites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Controller('favourites')
@UseGuards(JwtAuthGuard)
export class FavouritesController {
  constructor(private readonly favouritesService: FavouritesService) {}

  /**
   * Add a listing to favourites.
   */
  @Post(':listingId')
  @HttpCode(HttpStatus.CREATED)
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
  async list(@CurrentUser() user: AuthenticatedUser) {
    return this.favouritesService.findByUser(user.sub);
  }
}