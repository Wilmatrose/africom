import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class WebsocketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinStream(client: Socket, payload: {
        sessionId: string;
    }): void;
    handleJoinDashboard(client: Socket, payload: {
        creatorId: string;
    }): void;
    handleSendGift(client: Socket, payload: {
        sessionId: string;
        creatorId: string;
        senderName: string;
        giftName: string;
        amount: number;
    }): void;
}
