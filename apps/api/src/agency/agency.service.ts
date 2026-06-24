import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import type { CreateAgencyProfileDto, RequestUploadUrlDto } from '@propvest/shared';
import * as crypto from 'crypto';

@Injectable()
export class AgencyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /** Create or update agency profile for the current user */
  async createProfile(userId: string, dto: CreateAgencyProfileDto) {
    const existing = await this.prisma.agencyProfile.findUnique({ where: { userId } });
    if (existing) {
      // Update existing if already created
      return this.prisma.agencyProfile.update({
        where: { userId },
        data: {
          companyName: dto.companyName,
          companyNumber: dto.companyNumber ?? null,
          address: dto.address,
          contactName: dto.contactName,
          phone: dto.phone,
          website: dto.website || null,
          verificationStatus: 'PENDING', // Reset on profile update
          reviewedByAdminId: null,
          reviewedAt: null,
          rejectionReason: null,
        },
      });
    }
    return this.prisma.agencyProfile.create({
      data: {
        userId,
        companyName: dto.companyName,
        companyNumber: dto.companyNumber ?? null,
        address: dto.address,
        contactName: dto.contactName,
        phone: dto.phone,
        website: dto.website || null,
      },
    });
  }

  /** Get the current user's agency profile */
  async getMyProfile(userId: string) {
    const profile = await this.prisma.agencyProfile.findUnique({
      where: { userId },
      include: { documents: { select: { id: true, type: true, originalName: true, createdAt: true } } },
    });
    if (!profile) {
      throw new NotFoundException('Agency profile not found');
    }
    return profile;
  }

  /** Generate a presigned upload URL and save document metadata */
  async requestUploadUrl(userId: string, dto: RequestUploadUrlDto) {
    const profile = await this.prisma.agencyProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Create your agency profile first');
    }

    const fileKey = `agencies/${profile.id}/${crypto.randomUUID()}-${dto.originalName}`;
    const uploadUrl = await this.storage.getUploadUrl(fileKey, dto.contentType);

    return { uploadUrl, fileKey };
  }

  /** Confirm a document was uploaded and save its metadata */
  async confirmUpload(userId: string, fileKey: string, originalName: string, type: string) {
    const profile = await this.prisma.agencyProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Agency profile not found');
    }

    const doc = await this.prisma.agencyDocument.create({
      data: {
        agencyProfileId: profile.id,
        fileKey,
        originalName,
        type,
      },
    });

    return doc;
  }

  /** Get a presigned download URL for a document (only own docs) */
  async getDocumentDownloadUrl(userId: string, documentId: string) {
    const profile = await this.prisma.agencyProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new ForbiddenException('No agency profile');
    }

    const doc = await this.prisma.agencyDocument.findUnique({
      where: { id: documentId },
    });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    if (doc.agencyProfileId !== profile.id) {
      throw new ForbiddenException('You can only access your own documents');
    }

    const downloadUrl = await this.storage.getDownloadUrl(doc.fileKey);
    return { downloadUrl, originalName: doc.originalName, type: doc.type };
  }

  /** List documents for the current user's agency */
  async listDocuments(userId: string) {
    const profile = await this.prisma.agencyProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Agency profile not found');
    }

    return this.prisma.agencyDocument.findMany({
      where: { agencyProfileId: profile.id },
      select: { id: true, type: true, originalName: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}