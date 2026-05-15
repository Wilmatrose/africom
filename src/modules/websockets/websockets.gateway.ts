import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// 'cors' is needed so the Mobile App can connect from localhost
@WebSocketGateway({
  cors: {
    origin: '*', // Allow all origins for dev (restrict in production)
  },
})
export class WebsocketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Fans join a specific Live Stream room
   * Room Name: e.g., 'session_123'
   */
  @SubscribeMessage('joinStream')
  handleJoinStream(client: Socket, payload: { sessionId: string }) {
    client.join(`session_${payload.sessionId}`);
    console.log(`User ${client.id} joined session ${payload.sessionId}`);
  }

  /**
   * Creator joins their own dashboard room
   */
  @SubscribeMessage('joinDashboard')
  handleJoinDashboard(client: Socket, payload: { creatorId: string }) {
    client.join(`creator_${payload.creatorId}`);
  }

  /**
   * Fan sends a gift
   * This emits the event to the specific Stream Room AND the Creator's Dashboard
   */
  @SubscribeMessage('sendGift')
  handleSendGift(
    client: Socket,
    payload: { 
      sessionId: string; 
      creatorId: string; 
      senderName: string; 
      giftName: string; 
      amount: number 
    }
  ) {
    // 1. Notify all fans watching the stream (optional)
    this.server.to(`session_${payload.sessionId}`).emit('onGiftReceived', {
      message: `${payload.senderName} sent ${payload.giftName}!`,
      gift: payload.giftName,
    });

    // 2. Notify the Creator Dashboard (OBS Alert)
    this.server.to(`creator_${payload.creatorId}`).emit('onCreatorAlert', {
      type: 'GIFT',
      sender: payload.senderName,
      gift: payload.giftName,
      amount: payload.amount,
    });
  }
}