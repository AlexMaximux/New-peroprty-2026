import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavouritesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Add a listing to the user's favourites.
   * Throws if the listing does not exist or is not published.
   */
  async add(userId: string, listingId: string) {
    // Verify listing exists and is published
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, status: true },
    });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Upsert so repeated calls are idempotent
    return this.prisma.favourite.upsert({
      where: { userId_listingId: { userId, listingId } },
      create: { userId, listingId },
      update: {},
    });
  }

  /**
   * Remove a listing from the user's favourites.
   * Silently succeeds if the favourite didn't exist.
   */
  async remove(userId: string, listingId: string) {
    await this.prisma.favourite.deleteMany({
      where: { userId, listingId },
    });
  }

  /**
   * List all favourites for the current user, including listing details.
   */
  async findByUser(userId: string) {
    return this.prisma.favourite.findMany({
      where: { userId },
      include: {
        listing: {
          include: {
            media: { take: 1, orderBy: { order: 'asc' } },
            hmoRooms: true,
            portfolioAssets: { orderBy: { order: 'asc' } },
            agencyProfile: {
              select: {
                companyName: true,
                contactName: true,
                user: { select: { displayName: true } },
              },
            },
            _count: { select: { favourites: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}