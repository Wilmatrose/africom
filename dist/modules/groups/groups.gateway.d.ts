import { Server, Socket } from 'socket.io';
export declare class GroupsGateway {
    server: Server;
    handleJoinGroup(client: Socket, data: {
        groupId: string;
    }): Promise<void>;
    handleGroupMessageEvent(payload: any): void;
    handleKickedFromGroupEvent(payload: {
        groupId: string;
        userId: string;
    }): void;
    handleUserKickedEvent(payload: {
        groupId: string;
        userId: string;
    }): void;
    handleMessageDeletedEvent(payload: {
        groupId: string;
        messageId: string;
    }): void;
    handleChatClearedEvent(payload: {
        groupId: string;
    }): void;
    handleMessageUpdatedEvent(payload: any): void;
    handleUserPromotedEvent(payload: any): void;
}
