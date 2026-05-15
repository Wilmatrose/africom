import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
  WebSocketServer,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter'; // Import this
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/ws-jwt.guard'; 

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: 'groups', 
})
@UseGuards(WsJwtGuard)
export class GroupsGateway {
  @WebSocketServer()
  server: Server;

  // REMOVED Service Injection

  @SubscribeMessage('joinGroup')
  async handleJoinGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string },
  ) {
    client.join(data.groupId);
    console.log(`Client joined group: ${data.groupId}`);
  }

  // --- EVENT HANDLERS (Bridge Service -> Socket) ---

  @OnEvent('group_message_created')
  handleGroupMessageEvent(payload: any) {
    this.server.to(payload.groupId).emit('newMessage', payload);
  }

  @OnEvent('kicked_from_group')
  handleKickedFromGroupEvent(payload: { groupId: string; userId: string }) {
    // We emit to the group, and the client checks if it's them
    // Or you can implement User Rooms (socket.join(user_${userId})) to send privately
    this.server.to(payload.groupId).emit('kicked_from_group', payload);
  }

  @OnEvent('user_kicked')
  handleUserKickedEvent(payload: { groupId: string; userId: string }) {
    // Notify the group to remove the user and their messages
    this.server.to(payload.groupId).emit('user_kicked', payload);
  }

  @OnEvent('message_deleted')
  handleMessageDeletedEvent(payload: { groupId: string; messageId: string }) {
    this.server.to(payload.groupId).emit('message_deleted', payload);
  }

  @OnEvent('chat_cleared')
  handleChatClearedEvent(payload: { groupId: string }) {
    this.server.to(payload.groupId).emit('chat_cleared', payload);
  }
  
  @OnEvent('message_updated')
  handleMessageUpdatedEvent(payload: any) {
     this.server.to(payload.groupId).emit('message_updated', payload);
  }
  
  @OnEvent('user_promoted')
  handleUserPromotedEvent(payload: any) {
      this.server.to(payload.groupId).emit('user_promoted', payload);
  }
}