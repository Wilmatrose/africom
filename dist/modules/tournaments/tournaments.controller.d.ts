import { TournamentsService } from './tournaments.service';
export declare class TournamentsController {
    private readonly tournamentsService;
    constructor(tournamentsService: TournamentsService);
    getAll(): Promise<{
        id: string;
        title: string;
        status: string;
        entryFeeCoins: number;
        bracketImageUrl: string;
        createdAt: Date;
        creator: {
            id: string;
            username: string;
            avatarUrl: string;
        };
    }[]>;
    create(body: {
        hostId: string;
        title: string;
        bracketUrl: string;
        fee: number;
    }, req: any): Promise<import("./tournaments.entity").Tournament>;
    join(body: {
        tournamentId: string;
    }, req: any): Promise<{
        message: string;
        newBalance?: undefined;
    } | {
        message: string;
        newBalance: number;
    }>;
    startTournament(id: string, req: any): Promise<{
        success: boolean;
        status: string;
    }>;
    endTournament(id: string, body: {
        winnerId?: string;
    }, req: any): Promise<{
        success: boolean;
        winnerBalance: number;
    }>;
    getMessages(groupId: string): Promise<import("./tournaments.entity").GroupMessage[]>;
    sendMessage(body: {
        groupId: string;
        content: string;
    }, req: any): Promise<import("./tournaments.entity").GroupMessage>;
}
