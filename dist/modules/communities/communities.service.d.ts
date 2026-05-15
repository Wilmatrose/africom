import { Repository } from 'typeorm';
import { Community, CommunityPost, CommunityParticipant } from './communities.entity';
import { User } from '../users/entities/user.entity';
import { Transaction } from '../wallet/wallet.entity';
export declare class CommunitiesService {
    private communityRepo;
    private postRepo;
    private participantRepo;
    private userRepo;
    private readonly transactionRepo;
    constructor(communityRepo: Repository<Community>, postRepo: Repository<CommunityPost>, participantRepo: Repository<CommunityParticipant>, userRepo: Repository<User>, transactionRepo: Repository<Transaction>);
    createCommunity(creatorId: string, name: string, minCoins: number): Promise<Community>;
    getAllCommunities(): Promise<{
        id: string;
        name: string;
        minCoinsToJoin: number;
        imageUrl: string;
        createdAt: Date;
        creator: {
            id: string;
            username: string;
            avatarUrl: string;
        };
    }[]>;
    findById(id: string): Promise<{
        id: string;
        name: string;
        minCoinsToJoin: number;
        imageUrl: string;
        createdAt: Date;
        creator: {
            id: string;
            username: string;
            avatarUrl: string;
        };
    }>;
    joinCommunity(communityId: string, userId: string): Promise<{
        message: string;
        success?: undefined;
        newBalance?: undefined;
    } | {
        success: boolean;
        newBalance: number;
        message?: undefined;
    }>;
    createPost(communityId: string, authorId: string, authorName: string, text: string, voiceUrl?: string): Promise<CommunityPost>;
    getPosts(communityId: string): Promise<CommunityPost[]>;
}
