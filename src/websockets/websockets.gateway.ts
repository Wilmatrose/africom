import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// Define Types for better safety
interface JoinStreamPayload {
  sessionId: string;
}

interface JoinGroupPayload {
  groupId: string;
}

interface SendMessagePayload {
  groupId: string;
  message: string;
  username: string;
}

interface SendGiftPayload {
  sessionId: string;
  giftName: string;
  amount: number;
  username: string;
}

@WebSocketGateway({
  cors: {
    origin: '*', // Allow all origins (Matches AuthModule)
  },
})
export class WebsocketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`✅ Client connected: ${client.id}`);
    // TODO: In production, validate JWT token here and attach userId to socket
    // e.g., client.data = { userId: decodedToken.sub };
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Client disconnected: ${client.id}`);
  }

  // 1. JOIN STREAM (For Watching Live Video)
  @SubscribeMessage('joinStream')
  handleJoinStream(@MessageBody() payload: JoinStreamPayload, client: Socket) {
    client.join(`session_${payload.sessionId}`);
    console.log(`Client joined stream: ${payload.sessionId}`);
  }

  // 2. JOIN GROUP (For Tournament/Community Chat)
  @SubscribeMessage('joinGroup')
  handleJoinGroup(@MessageBody() payload: JoinGroupPayload, client: Socket) {
    client.join(`group_${payload.groupId}`);
  }

  // 3. SEND MESSAGE (Chat)
  @SubscribeMessage('sendMessage')
  handleSendMessage(
    @MessageBody() payload: SendMessagePayload,
    client: Socket,
  ) {
    if (!payload.message || payload.message.trim() === '') {
      return; // Ignore empty messages
    }

    // Broadcast to everyone in the group
    this.server.to(`group_${payload.groupId}`).emit('chatMessage', {
      username: payload.username,
      message: payload.message,
      timestamp: new Date(),
    });
  }

  // 4. SEND GIFT (Real-time Interaction)
  @SubscribeMessage('sendGift')
  handleSendGift(
    @MessageBody() payload: SendGiftPayload,
    client: Socket,
  ) {
    // 1. Emit to Stream Room (Visual Overlay)
    this.server.to(`session_${payload.sessionId}`).emit('giftReceived', {
      username: payload.username,
      giftName: payload.giftName,
      amount: payload.amount,
      timestamp: new Date(),
    });

    // Note: Actual Balance logic happens via REST API (WalletController)
    // This Socket event is just for the "Wow!" visual effect
  }
}