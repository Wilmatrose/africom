import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';
import { User } from '../users/entities/user.entity';
import { Notification } from '../notifications/notification.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class MessagingService {
    private msgRepo;
    private userRepo;
    private notifRepo;
    private eventEmitter;
    constructor(msgRepo: Repository<Message>, userRepo: Repository<User>, notifRepo: Repository<Notification>, eventEmitter: EventEmitter2);
    getInbox(userId: string): Promise<{
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
    getMessages(userId: string, otherUserId: string): Promise<{
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
    sendMessage(senderId: string, receiverId: string, content: string, imageUrl?: string): Promise<{
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
    acceptRequest(userId: string, requestId: string): Promise<Message>;
    getUnreadCount(userId: string): Promise<{
        count: number;
    }>;
    markMessagesAsRead(userId: string, senderId: string): Promise<{
        success: boolean;
    }>;
    private createNotif;
    private sanitizeMessage;
    private sanitizeUser;
}
