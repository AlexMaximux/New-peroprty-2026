import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create or find existing conversation for a buyer+listing pair.
   * Returns existing conversation if one already exists (unique constraint).
   */
  async findOrCreateConversation(
    buyerUserId: string,
    listingId: string,
  ) {
    // Verify listing exists
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        agencyProfile: { select: { userId: true } },
      },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    const agencyUserId = listing.agencyProfile!.userId;

    // Try to find existing conversation
    const existing = await this.prisma.conversation.findUnique({
      where: { listingId_buyerUserId: { listingId, buyerUserId } },
    });
    if (existing) return existing;

    // Create new conversation
    return this.prisma.conversation.create({
      data: { listingId, buyerUserId, agencyUserId },
    });
  }

  /**
   * Get all conversations for a user (as buyer or agency).
   */
  async getConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        OR: [{ buyerUserId: userId }, { agencyUserId: userId }],
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            city: true,
            postcode: true,
            media: { take: 1, orderBy: { order: 'asc' } },
          },
        },
        buyer: { select: { id: true, displayName: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Verify user is participant in conversation.
   */
  private async assertParticipation(conversationId: string, userId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.buyerUserId !== userId && conv.agencyUserId !== userId) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }
    return conv;
  }

  /**
   * Get messages for a conversation (paginated, newest first).
   */
  async getMessages(conversationId: string, userId: string, page = 1, limit = 50) {
    await this.assertParticipation(conversationId, userId);

    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          sender: { select: { id: true, displayName: true } },
        },
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    return {
      data: messages.reverse(), // chronological order for display
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Send a message in a conversation.
   */
  async sendMessage(conversationId: string, senderUserId: string, body: string) {
    const conv = await this.assertParticipation(conversationId, senderUserId);

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderUserId,
        body,
      },
      include: {
        sender: { select: { id: true, displayName: true } },
      },
    });

    // Touch conversation updatedAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Return conversation data for WebSocket broadcast to determine recipient
    return { message, conversation: conv };
  }

  /**
   * Mark all unread messages as read for a participant.
   */
  async markAsRead(conversationId: string, userId: string) {
    await this.assertParticipation(conversationId, userId);

    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderUserId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  }

  /**
   * Get unread message count for a user.
   */
  async getUnreadCount(userId: string) {
    return this.prisma.message.count({
      where: {
        conversation: {
          OR: [{ buyerUserId: userId }, { agencyUserId: userId }],
        },
        senderUserId: { not: userId },
        readAt: null,
      },
    });
  }
}