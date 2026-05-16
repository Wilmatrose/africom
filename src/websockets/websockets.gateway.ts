import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { WalletService } from '../modules/wallet/wallet.service';
import { UsersService } from '../modules/users/users/users.service';

// --- DTOs for Validation (Inline for now, or move to dto file) ---
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
  recipientUsername: string; // CRITICAL: Added to find the recipient
}

@WebSocketGateway({
  cors: {
    origin: '*', // Adjust this to your Flutter URL in production
  },
})
@Injectable() // Added Injectable so we can inject other services
export class WebsocketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Store socket ID -> User ID mapping
  private connectedUsers: Map<string, { userId: string; username: string }> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly walletService: WalletService,
    private readonly usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // 1. Get Token from Handshake Auth
      const token = client.handshake.auth.token;

      if (!token) {
        console.log(`❌ Connection rejected: No token provided for ${client.id}`);
        client.disconnect();
        return;
      }

      // 2. Verify Token
      const payload = this.jwtService.verify(token); // Ensure secret matches JWT_MODULE_CONFIG
      const userId = payload.sub;
      const username = payload.username; // Ensure your JWT payload includes username

      // 3. Fetch User to be safe (optional, but good for freshness)
      const user = await this.usersService.findById(userId);
      
      // 4. Store Mapping
      this.connectedUsers.set(client.id, { userId: user.id, username: user.username });
      
      // 5. Join Personal Room (For direct notifications like Wallet Updates)
      client.join(`user_${user.id}`);

      console.log(`✅ Client connected: ${client.id} | User: ${user.username}`);
    } catch (error) {
      console.log(`❌ Connection rejected: Invalid token for ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Clean up mapping
    this.connectedUsers.delete(client.id);
    console.log(`❌ Client disconnected: ${client.id}`);
  }

  // 1. JOIN STREAM
  @SubscribeMessage('join_stream')
  handleJoinStream(@MessageBody() payload: JoinStreamPayload, @ConnectedSocket() client: Socket) {
    client.join(`session_${payload.sessionId}`);
    console.log(`User joined stream: ${payload.sessionId}`);
  }

  // 2. LEAVE STREAM
  @SubscribeMessage('leave_stream')
  handleLeaveStream(@MessageBody() payload: JoinStreamPayload, @ConnectedSocket() client: Socket) {
    client.leave(`session_${payload.sessionId}`);
    console.log(`User left stream: ${payload.sessionId}`);
  }

  // 3. JOIN GROUP
  @SubscribeMessage('joinGroup')
  handleJoinGroup(@MessageBody() payload: JoinGroupPayload, @ConnectedSocket() client: Socket) {
    client.join(`group_${payload.groupId}`);
  }

  // 4. SEND MESSAGE (Chat)
  @SubscribeMessage('stream:message') // Updated event name to match Flutter
  handleSendMessage(@MessageBody() payload: SendMessagePayload, @ConnectedSocket() client: Socket) {
    const sender = this.connectedUsers.get(client.id);

    if (!sender) return;
    if (!payload.message || payload.message.trim() === '') return;

    // Broadcast to the specific stream/session room
    this.server.to(`session_${payload.groupId}`).emit('stream:message', {
      username: sender.username,
      message: payload.message,
      timestamp: new Date(),
    });
  }

  // 5. SEND GIFT (THE BIG ONE)
  @SubscribeMessage('stream:gift') // Updated event name to match Flutter
  async handleSendGift(@MessageBody() payload: SendGiftPayload, @ConnectedSocket() client: Socket) {
    const sender = this.connectedUsers.get(client.id);

    if (!sender) {
      client.emit('error', { message: 'User not authenticated' });
      return;
    }

    try {
      // A. Find Recipient
      const recipient = await this.usersService.findByUsername(payload.recipientUsername);
      if (!recipient) {
        client.emit('error', { message: 'Recipient not found' });
        return;
      }

      // B. Check Self-Gifting
      if (sender.userId === recipient.id) {
        client.emit('error', { message: 'You cannot send gifts to yourself' });
        return;
      }

      const ref = `gift-${Date.now()}`;

      // C. Debit Sender (This checks balance and throws if insufficient)
      await this.walletService.debitFan(
        sender.userId, 
        payload.cost, 
        ref, 
        payload.giftName
      );

      // D. Credit Creator
      await this.walletService.creditCreator(
        recipient.id, 
        payload.cost, 
        ref, 
        payload.giftName
      );

      // E. Notify Recipient (Personal Notification)
      this.server.to(`user_${recipient.id}`).emit('onCreatorAlert', {
        type: 'GIFT',
        sender: sender.username,
        gift: payload.giftName,
        amount: payload.cost,
      });

      // F. Broadcast to Stream Room (Visual Animation for everyone watching)
      this.server.to(`session_${payload.sessionId}`).emit('onGiftReceived', {
        message: `${sender.username} sent ${payload.giftName}!`,
        sender: sender.username,
        giftName: payload.giftName,
        amount: payload.cost,
      });

      console.log(`✅ Gift sent from ${sender.username} to ${recipient.username}`);

    } catch (error) {
      console.error('Gift Error:', error);
      // Send error back to sender so UI can show "Insufficient Funds"
      client.emit('error', { 
        message: error instanceof BadRequestException ? error.message : 'Gift failed' 
      });
    }
  }
}