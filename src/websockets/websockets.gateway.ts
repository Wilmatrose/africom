import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter'; // ADDED: To listen for events
import { WalletService } from '../modules/wallet/wallet.service';
import { UsersService } from '../modules/users/users/users.service';

// --- DTOs for Validation ---
class JoinStreamPayload {
  sessionId: string;
}

class JoinGroupPayload {
  groupId: string;
}

class SendMessagePayload {
  groupId: string;
  message: string;
}

class SendGiftPayload {
  sessionId: string;
  giftName: string;
  cost: number;
  recipientUsername: string;
}

@WebSocketGateway({
  cors: {
    origin: '*', 
  },
})
@Injectable()
export class WebsocketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketsGateway.name);

  // Store socket ID -> User ID mapping
  private connectedUsers: Map<string, { userId: string; username: string }> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly walletService: WalletService,
    private readonly usersService: UsersService,
  ) {}

  // --- CONNECTION HANDLERS ---

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;

      if (!token) {
        this.logger.error(`❌ Connection rejected: No token provided for ${client.id}`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      const username = payload.username; 

      const user = await this.usersService.findById(userId);
      
      this.connectedUsers.set(client.id, { userId: user.id, username: user.username });
      
      // Join Personal Room
      client.join(`user_${user.id}`);

      this.logger.log(`✅ Client connected: ${client.id} | User: ${user.username}`);
    } catch (error) {
      this.logger.error(`❌ Connection rejected: Invalid token for ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedUsers.delete(client.id);
    this.logger.log(`❌ Client disconnected: ${client.id}`);
  }

  // --- SOCKET EVENTS (Sent from Flutter) ---

  @SubscribeMessage('join_stream')
  handleJoinStream(@MessageBody() payload: JoinStreamPayload, @ConnectedSocket() client: Socket) {
    client.join(`session_${payload.sessionId}`);
    this.logger.log(`User joined stream: ${payload.sessionId}`);
  }

  @SubscribeMessage('leave_stream')
  handleLeaveStream(@MessageBody() payload: JoinStreamPayload, @ConnectedSocket() client: Socket) {
    client.leave(`session_${payload.sessionId}`);
    this.logger.log(`User left stream: ${payload.sessionId}`);
  }

  @SubscribeMessage('joinGroup')
  handleJoinGroup(@MessageBody() payload: JoinGroupPayload, @ConnectedSocket() client: Socket) {
    client.join(`group_${payload.groupId}`);
  }

  @SubscribeMessage('stream:message')
  handleSendMessage(@MessageBody() payload: SendMessagePayload, @ConnectedSocket() client: Socket) {
    const sender = this.connectedUsers.get(client.id);
    if (!sender || !payload.message || payload.message.trim() === '') return;

    this.server.to(`session_${payload.groupId}`).emit('stream:message', {
      username: sender.username,
      message: payload.message,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('stream:gift')
  async handleSendGift(@MessageBody() payload: SendGiftPayload, @ConnectedSocket() client: Socket) {
    const sender = this.connectedUsers.get(client.id);

    if (!sender) {
      client.emit('error', { message: 'User not authenticated' });
      return;
    }

    try {
      const recipient = await this.usersService.findByUsername(payload.recipientUsername);
      if (!recipient) {
        client.emit('error', { message: 'Recipient not found' });
        return;
      }

      if (sender.userId === recipient.id) {
        client.emit('error', { message: 'You cannot send gifts to yourself' });
        return;
      }

      const ref = `gift-${Date.now()}`;

      await this.walletService.debitFan(
        sender.userId, 
        payload.cost, 
        ref, 
        payload.giftName
      );

      await this.walletService.creditCreator(
        recipient.id, 
        payload.cost, 
        ref, 
        payload.giftName
      );

      this.server.to(`user_${recipient.id}`).emit('onCreatorAlert', {
        type: 'GIFT',
        sender: sender.username,
        gift: payload.giftName,
        amount: payload.cost,
      });

      this.server.to(`session_${payload.sessionId}`).emit('onGiftReceived', {
        message: `${sender.username} sent ${payload.giftName}!`,
        sender: sender.username,
        giftName: payload.giftName,
        amount: payload.cost,
      });

      this.logger.log(`✅ Gift sent from ${sender.username} to ${recipient.username}`);

    } catch (error) {
      this.logger.error('Gift Error:', error);
      client.emit('error', { 
        message: error instanceof BadRequestException ? error.message : 'Gift failed' 
      });
    }
  }

  // --- INTERNAL EVENT LISTENERS (From WalletController) ---

  /**
   * Listens for 'gift.sent' event emitted by WalletController
   * This handles gifts sent via HTTP endpoints (if any) 
   * or ensures synchronization if logic was executed elsewhere.
   */
  @OnEvent('gift.sent')
  handleInternalGiftSent(payload: any) {
    this.logger.log(`Received internal gift event: ${JSON.stringify(payload)}`);
    
    // Notify Recipient
    this.server.to(`user_${payload.recipientId}`).emit('onCreatorAlert', {
      type: 'GIFT',
      sender: payload.senderName,
      gift: payload.gift,
      amount: payload.amount,
    });

    // Broadcast to Stream Room
    if (payload.streamId) {
      this.server.to(`session_${payload.streamId}`).emit('onGiftReceived', {
        message: `${payload.senderName} sent ${payload.gift}!`,
        sender: payload.senderName,
        giftName: payload.gift,
        amount: payload.amount,
      });
    }
  }

  /**
   * Listens for 'wallet.withdrawal.created' event emitted by WalletController
   * Notifies the user that their withdrawal request was received.
   */
  @OnEvent('wallet.withdrawal.created')
  handleInternalWithdrawal(payload: any) {
    this.logger.log(`Received internal withdrawal event for user: ${payload.userId}`);
    
    this.server.to(`user_${payload.userId}`).emit('onNotification', {
      message: payload.message,
    });
  }
}