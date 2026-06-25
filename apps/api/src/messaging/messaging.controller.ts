import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  /**
   * Start (or find existing) conversation for a listing.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async startConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { listingId: string },
  ) {
    return this.messagingService.findOrCreateConversation(user.sub, body.listingId);
  }

  /**
   * List user's conversations.
   */
  @Get()
  async listConversations(@CurrentUser() user: AuthenticatedUser) {
    return this.messagingService.getConversations(user.sub);
  }

  /**
   * Get messages in a conversation.
   */
  @Get(':id/messages')
  async getMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messagingService.getMessages(
      id,
      user.sub,
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
    );
  }

  /**
   * Send a message in a conversation.
   */
  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { body: string },
  ) {
    return this.messagingService.sendMessage(id, user.sub, body.body);
  }

  /**
   * Mark messages as read.
   */
  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    await this.messagingService.markAsRead(id, user.sub);
    return { ok: true };
  }

  /**
   * Get unread message count.
   */
  @Get('unread-count')
  async unreadCount(@CurrentUser() user: AuthenticatedUser) {
    const count = await this.messagingService.getUnreadCount(user.sub);
    return { count };
  }
}