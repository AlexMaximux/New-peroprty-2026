import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Agency management ──

  async listAgencies(status?: string) {
    const where: any = {};
    if (status) {
      where.verificationStatus = status;
    }
    return this.prisma.agencyProfile.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, displayName: true, createdAt: true } },
        documents: { select: { id: true, type: true, originalName: true, createdAt: true } },
        _count: { select: { listings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAgencyDetail(agencyProfileId: string) {
    const agency = await this.prisma.agencyProfile.findUnique({
      where: { id: agencyProfileId },
      include: {
        user: { select: { id: true, email: true, displayName: true, phone: true, createdAt: true } },
        documents: { select: { id: true, type: true, originalName: true, createdAt: true } },
        listings: {
          select: { id: true, title: true, status: true, category: true, strategy: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { listings: true } },
      },
    });
    if (!agency) {
      throw new NotFoundException('Agency not found');
    }
    return agency;
  }

  async approveAgency(adminUserId: string, agencyProfileId: string) {
    const agency = await this.prisma.agencyProfile.findUnique({
      where: { id: agencyProfileId },
    });
    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    const result = await this.prisma.agencyProfile.update({
      where: { id: agencyProfileId },
      data: {
        verificationStatus: 'APPROVED',
        reviewedByAdminId: adminUserId,
        reviewedAt: new Date(),
        rejectionReason: null,
      },
    });

    await this.logAction(adminUserId, 'APPROVE_AGENCY', 'AgencyProfile', agencyProfileId);
    return result;
  }

  async rejectAgency(adminUserId: string, agencyProfileId: string, reason: string) {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('Rejection reason is required');
    }

    const agency = await this.prisma.agencyProfile.findUnique({
      where: { id: agencyProfileId },
    });
    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    const result = await this.prisma.agencyProfile.update({
      where: { id: agencyProfileId },
      data: {
        verificationStatus: 'REJECTED',
        reviewedByAdminId: adminUserId,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });

    await this.logAction(adminUserId, 'REJECT_AGENCY', 'AgencyProfile', agencyProfileId, { reason });
    return result;
  }

  // ── Listing moderation ──

  async moderateListing(
    adminUserId: string,
    listingId: string,
    action: 'UNPUBLISH' | 'REINSTATE' | 'APPROVE',
    reason?: string,
  ) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const data: any = {};
    if (action === 'UNPUBLISH') {
      data.status = 'ARCHIVED';
      data.archivedAt = new Date();
    } else if (action === 'REINSTATE' || action === 'APPROVE') {
      data.status = 'PUBLISHED';
      data.archivedAt = null;
      data.publishedAt = new Date();
    }

    const result = await this.prisma.listing.update({
      where: { id: listingId },
      data,
    });

    await this.logAction(adminUserId, `MODERATE_${action}`, 'Listing', listingId, { reason });
    return result;
  }

  // ── Listing management ──

  async listAllListings(status?: string) {
    const where: any = {};
    if (status) {
      where.status = status;
    }
    return this.prisma.listing.findMany({
      where,
      include: {
        agencyProfile: {
          select: { companyName: true, verificationStatus: true },
        },
        _count: { select: { conversations: true, favourites: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Audit log ──

  async getAuditLog(limit = 50) {
    return this.prisma.adminAuditLog.findMany({
      include: {
        admin: { select: { id: true, email: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  private async logAction(
    adminUserId: string,
    action: string,
    targetType: string,
    targetId: string,
    meta?: Record<string, any>,
  ) {
    await this.prisma.adminAuditLog.create({
      data: { adminUserId, action, targetType, targetId, meta: meta ?? {} },
    });
  }
}