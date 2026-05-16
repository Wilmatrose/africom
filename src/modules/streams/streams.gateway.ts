import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { StreamsService } from './streams.service';

@WebSocketGateway({ 
  cors: { 
    origin: '*', // Adjust this for production to allow only your frontend URL
    methods: ['GET', 'POST']
  } 
})
export class StreamsGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly streamsService: StreamsService) {}

  // 1. HANDLE USER JOINING
  @SubscribeMessage('join_stream')
  async handleJoin(client: Socket, payload: { streamId: string }) {
    const { streamId } = payload;

    if (!streamId) return;

    // Attach streamId to the socket object so we know where they were if they disconnect
    client.data.streamId = streamId;
    
    // Join the specific "room" for this stream (useful for chat later)
    client.join(streamId);

    // Update DB: Viewers + 1
    const newCount = await this.streamsService.incrementViewers(streamId);

    // Broadcast the new count to EVERYONE in this stream's room
    this.server.to(streamId).emit('viewer_update', { streamId, count: newCount });
  }

  // 2. HANDLE USER LEAVING VOLUNTARILY
  @SubscribeMessage('leave_stream')
  async handleLeave(client: Socket, payload: { streamId: string }) {
    const { streamId } = payload;
    if (streamId) {
      await this.removeViewer(client, streamId);
    }
  }

  // 3. HANDLE DISCONNECT (App Close / Network Loss)
  async handleDisconnect(client: Socket) {
    // If the user was in a stream, we need to remove them
    if (client.data.streamId) {
      await this.removeViewer(client, client.data.streamId);
    }
  }

  // PRIVATE HELPER: Logic to remove viewer and update DB
  private async removeViewer(client: Socket, streamId: string) {
    // Leave the socket room
    client.leave(streamId);

    // Update DB: Viewers - 1
    const newCount = await this.streamsService.decrementViewers(streamId);

    // Broadcast the new count to everyone else
    this.server.to(streamId).emit('viewer_update', { streamId, count: newCount });
  }
}