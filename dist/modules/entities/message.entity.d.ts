import { User } from '../users/entities/user.entity';
export declare class Message {
    id: string;
    sender: User;
    receiver: User;
    senderId: string;
    receiverId: string;
    content: string;
    imageUrl: string;
    isRequest: boolean;
    isAccepted: boolean;
    isRead: boolean;
    createdAt: Date;
}
