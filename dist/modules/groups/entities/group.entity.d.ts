import { User } from '../../users/entities/user.entity';
import { GroupMember } from './group-member.entity';
import { GroupMessage } from './group-message.entity';
export declare class Group {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    profilePicUrl: string;
    inviteLink: string;
    lockGroup: boolean;
    disappearingTimer: number;
    creator: User;
    creatorId: string;
    createdAt: Date;
    members: GroupMember[];
    messages: GroupMessage[];
}
