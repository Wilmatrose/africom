import { User } from '../../users/entities/user.entity';
import { Group } from './group.entity';
export declare class GroupMessage {
    id: string;
    groupId: string;
    senderId: string;
    content: string;
    imageUrl: string;
    isPinned: boolean;
    replyToId: string;
    replyTo: GroupMessage;
    replies: GroupMessage[];
    group: Group;
    sender: User;
    createdAt: Date;
}
