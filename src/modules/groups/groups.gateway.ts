import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
  WebSocketServer,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
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

  @SubscribeMessage('joinGroup')
  async handleJoinGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string },
  ) {
    client.join(data.groupId);
    console.log(`Client joined group: ${data.groupId}`);
  }

  // --- EVENT HANDLERS (Service -> Socket) ---

  @OnEvent('group_message_created')
  handleGroupMessageEvent(payload: any) {
    // Ensure we emit to the correct room (groupId)
    this.server.to(payload.groupId).emit('newMessage', payload);
  }

  @OnEvent('kicked_from_group')
  handleKickedFromGroupEvent(payload: { groupId: string; userId: string }) {
    this.server.to(payload.groupId).emit('kicked_from_group', payload);
  }

  @OnEvent('user_kicked')
  handleUserKickedEvent(payload: { groupId: string; userId: string }) {
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

  @OnEvent('group_deleted')
  handleGroupDeletedEvent(payload: { groupId: string }) {
    this.server.to(payload.groupId).emit('group_deleted', payload);
  }

  // --- NEW: REACTION EVENT ---
  @OnEvent('message_reaction_updated')
  handleReactionUpdatedEvent(payload: any) {
    // Emit to the group so everyone sees the reaction update
    this.server.to(payload.groupId).emit('reaction_updated', payload);
  }
}