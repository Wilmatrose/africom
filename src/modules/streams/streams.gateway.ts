import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { StreamsService } from './streams.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ 
  cors: { 
    origin: '*', 
    methods: ['GET', 'POST']
  } 
})
export class StreamsGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(StreamsGateway.name);

  constructor(private readonly streamsService: StreamsService) {}

  /**
   * Event: 'join_stream'
   * Adds a client to a stream room and increments the viewer count.
   * Emits 'viewer_update' to the room with the new count.
   */
  @SubscribeMessage('join_stream')
  async handleJoin(client: Socket, payload: { streamId: string }) {
    const { streamId } = payload;

    if (!streamId) {
      this.logger.warn(`Join attempt without streamId from client ${client.id}`);
      return;
    }

    try {
      // Store streamId in socket data for disconnect handling
      client.data.streamId = streamId;
      client.join(streamId);

      const newCount = await this.streamsService.incrementViewers(streamId);

      this.logger.debug(`Client ${client.id} joined stream ${streamId}. Count: ${newCount}`);

      // Broadcast new count to everyone in the room
      this.server.to(streamId).emit('viewer_update', { streamId, count: newCount });
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Error joining stream ${streamId}: ${errorMessage}`);
    }
  }

  /**
   * Event: 'leave_stream'
   * Removes a client from a stream room and decrements the viewer count.
   * Emits 'viewer_update' to the room with the new count.
   */
  @SubscribeMessage('leave_stream')
  async handleLeave(client: Socket, payload: { streamId: string }) {
    const { streamId } = payload;
    if (streamId) {
      await this.removeViewer(client, streamId);
      // Clear the stored data if explicitly leaving
      client.data.streamId = null;
    }
  }

  /**
   * Lifecycle Hook: OnGatewayDisconnect
   * Handles unexpected disconnections (e.g., closing tab, network loss).
   */
  async handleDisconnect(client: Socket) {
    if (client.data.streamId) {
      this.logger.debug(`Client ${client.id} disconnected from stream ${client.data.streamId}`);
      await this.removeViewer(client, client.data.streamId);
    }
  }

  /**
   * Helper: Decrements viewer count and notifies the room.
   */
  private async removeViewer(client: Socket, streamId: string) {
    try {
      client.leave(streamId);
      const newCount = await this.streamsService.decrementViewers(streamId);
      
      // Broadcast new count to remaining viewers
      this.server.to(streamId).emit('viewer_update', { streamId, count: newCount });
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Error removing viewer from stream ${streamId}: ${errorMessage}`);
    }
  }
}