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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('conversations')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  /**
   * Start (or find existing) conversation for a listing.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Start a conversation for a listing' })
  @ApiResponse({ status: 201, description: 'Conversation created or existing found' })
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
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List user conversations' })
  @ApiResponse({ status: 200, description: 'List of conversations' })
  async listConversations(@CurrentUser() user: AuthenticatedUser) {
    return this.messagingService.getConversations(user.sub);
  }

  /**
   * Get messages in a conversation.
   */
  @Get(':id/messages')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get messages in a conversation' })
  @ApiResponse({ status: 200, description: 'Paginated messages' })
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
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Send a message in a conversation' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
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
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mark messages as read' })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
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
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get unread message count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  async unreadCount(@CurrentUser() user: AuthenticatedUser) {
    const count = await this.messagingService.getUnreadCount(user.sub);
    return { count };
  }
}