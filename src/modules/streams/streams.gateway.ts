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

  @SubscribeMessage('join_stream')
  async handleJoin(client: Socket, payload: { streamId: string }) {
    const { streamId } = payload;

    if (!streamId) {
      this.logger.warn(`Join attempt without streamId from client ${client.id}`);
      return;
    }

    try {
      client.data.streamId = streamId;
      client.join(streamId);

      const newCount = await this.streamsService.incrementViewers(streamId);

      this.logger.debug(`Client ${client.id} joined stream ${streamId}. Count: ${newCount}`);

      this.server.to(streamId).emit('viewer_update', { streamId, count: newCount });
      
    } catch (error: unknown) {
      // FIX: Properly handle unknown error type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Error joining stream ${streamId}: ${errorMessage}`);
    }
  }

  @SubscribeMessage('leave_stream')
  async handleLeave(client: Socket, payload: { streamId: string }) {
    const { streamId } = payload;
    if (streamId) {
      await this.removeViewer(client, streamId);
    }
  }

  async handleDisconnect(client: Socket) {
    if (client.data.streamId) {
      this.logger.debug(`Client ${client.id} disconnected from stream ${client.data.streamId}`);
      await this.removeViewer(client, client.data.streamId);
    }
  }

  private async removeViewer(client: Socket, streamId: string) {
    try {
      client.leave(streamId);
      const newCount = await this.streamsService.decrementViewers(streamId);
      this.server.to(streamId).emit('viewer_update', { streamId, count: newCount });
      
    } catch (error: unknown) {
      // FIX: Properly handle unknown error type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Error removing viewer from stream ${streamId}: ${errorMessage}`);
    }
  }
}