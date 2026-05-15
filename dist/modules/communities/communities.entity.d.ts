import { User } from '../users/entities/user.entity';
export declare class Community {
    id: string;
    creatorId: string;
    creator: User;
    name: string;
    minCoinsToJoin: number;
    imageUrl: string;
    createdAt: Date;
}
export declare class CommunityParticipant {
    id: string;
    communityId: string;
    userId: string;
    joinedAt: Date;
}
export declare class CommunityPost {
    id: string;
    communityId: string;
    authorId: string;
    authorName: string;
    textContent: string;
    voiceNoteUrl: string;
    createdAt: Date;
}
