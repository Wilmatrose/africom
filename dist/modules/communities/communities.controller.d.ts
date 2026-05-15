import { CommunitiesService } from './communities.service';
export declare class CommunitiesController {
    private readonly communitiesService;
    constructor(communitiesService: CommunitiesService);
    getAll(): Promise<{
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
    getOne(id: string): Promise<{
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
    create(body: {
        name: string;
        minCoins: number;
    }, req: any): Promise<import("./communities.entity").Community>;
    join(body: {
        communityId: string;
    }, req: any): Promise<{
        message: string;
        success?: undefined;
        newBalance?: undefined;
    } | {
        success: boolean;
        newBalance: number;
        message?: undefined;
    }>;
    getPosts(id: string): Promise<import("./communities.entity").CommunityPost[]>;
    createPost(body: {
        communityId: string;
        text?: string;
        voiceUrl?: string;
    }, req: any): Promise<import("./communities.entity").CommunityPost>;
}
