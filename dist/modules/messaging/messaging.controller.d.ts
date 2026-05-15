import { MessagingService } from './messaging.service';
export declare class MessagingController {
    private readonly msgService;
    constructor(msgService: MessagingService);
    getInbox(req: any): Promise<{
        conversations: {
            id: string;
            content: string;
            imageUrl: string;
            createdAt: Date;
            isRequest: boolean;
            isAccepted: boolean;
            senderId: string;
            receiverId: string;
            isMine: boolean;
            sender: {
                id: string;
                username: string;
                avatarUrl: string;
            };
        }[];
        requests: {
            id: string;
            content: string;
            imageUrl: string;
            createdAt: Date;
            isRequest: boolean;
            isAccepted: boolean;
            senderId: string;
            receiverId: string;
            isMine: boolean;
            sender: {
                id: string;
                username: string;
                avatarUrl: string;
            };
        }[];
    }>;
    getMessages(otherUserId: string, req: any): Promise<{
        id: string;
        content: string;
        imageUrl: string;
        createdAt: Date;
        isRequest: boolean;
        isAccepted: boolean;
        senderId: string;
        receiverId: string;
        isMine: boolean;
        sender: {
            id: string;
            username: string;
            avatarUrl: string;
        };
    }[]>;
    send(body: {
        receiverId: string;
        content: string;
        imageUrl?: string;
    }, req: any): Promise<{
        id: string;
        content: string;
        imageUrl: string;
        createdAt: Date;
        isRequest: boolean;
        isAccepted: boolean;
        senderId: string;
        receiverId: string;
        isMine: boolean;
        sender: {
            id: string;
            username: string;
            avatarUrl: string;
        };
    }>;
    accept(id: string, req: any): Promise<import("../entities/message.entity").Message>;
    getUnreadCount(req: any): Promise<{
        count: number;
    }>;
    markAsRead(req: any, senderId: string): Promise<{
        success: boolean;
    }>;
}
