import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MessagingService } from './messaging.service';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';

type JwtPayload = AuthenticatedUser;

@WebSocketGateway({
  namespace: '/ws',
  cors: {
    origin: '*',
    credentials: true,
  },
})
@Injectable()
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(MessagingGateway.name);
  constructor(
    private readonly jwtService: JwtService,
    private readonly messagingService: MessagingService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Socket ${client.id} — no token provided`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(token);
      (client as any).user = payload;

      // Join user's personal room for targeted broadcasts
      client.join(`user:${payload.sub}`);
      this.logger.log(`Socket ${client.id} connected as user ${payload.sub}`);
    } catch (err) {
      this.logger.warn(`Socket ${client.id} — invalid token: ${(err as Error).message}`);
      client.emit('error', { message: 'Invalid or expired token' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const user = (client as any).user;
    if (user) {
      this.logger.log(`Socket ${client.id} disconnected (user ${user.sub})`);
    }
  }

  /**
   * Handle incoming chat message via WebSocket.
   */
  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; body: string },
  ) {
    const user = (client as any).user;
    if (!user) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      const result = await this.messagingService.sendMessage(
        data.conversationId,
        user.sub,
        data.body,
      );

      const { message, conversation } = result;
      const recipientUserId =
        conversation.buyerUserId === user.sub
          ? conversation.agencyUserId
          : conversation.buyerUserId;

      // Send back to sender with confirmation
      client.emit('message_sent', message);

      // Send to recipient's room
      this.server.to(`user:${recipientUserId}`).emit('new_message', {
        conversationId: data.conversationId,
        message,
      });
    } catch (err) {
      client.emit('error', { message: (err as Error).message });
    }
  }

  /**
   * Mark conversation as read via WebSocket.
   */
  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const user = (client as any).user;
    if (!user) return;

    try {
      await this.messagingService.markAsRead(data.conversationId, user.sub);
      client.emit('read_confirmed', { conversationId: data.conversationId });
    } catch {
      // Silently fail — mark_read is advisory
    }
  }

  private extractToken(client: Socket): string | null {
    // Check handshake auth first (recommended)
    const authToken = client.handshake.auth?.token;
    if (authToken) return authToken as string;

    // Fallback: query param
    const queryToken = client.handshake.query?.token;
    if (queryToken) return queryToken as string;

    // Fallback: Bearer in handshake headers
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader) {
      const parts = (authHeader as string).split(' ');
      if (parts[0]?.toLowerCase() === 'bearer' && parts[1]) {
        return parts[1];
      }
    }

    return null;
  }
}