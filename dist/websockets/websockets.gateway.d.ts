import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
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
export declare class WebsocketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinStream(payload: JoinStreamPayload, client: Socket): void;
    handleJoinGroup(payload: JoinGroupPayload, client: Socket): void;
    handleSendMessage(payload: SendMessagePayload, client: Socket): void;
    handleSendGift(payload: SendGiftPayload, client: Socket): void;
}
export {};
