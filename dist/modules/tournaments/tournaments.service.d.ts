import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Tournament, GroupMessage, TournamentParticipant } from './tournaments.entity';
import { User } from '../users/entities/user.entity';
import { Transaction } from '../wallet/wallet.entity';
export declare class TournamentsService {
    private readonly tournamentRepo;
    private readonly messageRepo;
    private readonly participantRepo;
    private readonly userRepo;
    private readonly transactionRepo;
    private readonly eventEmitter;
    constructor(tournamentRepo: Repository<Tournament>, messageRepo: Repository<GroupMessage>, participantRepo: Repository<TournamentParticipant>, userRepo: Repository<User>, transactionRepo: Repository<Transaction>, eventEmitter: EventEmitter2);
    createTournament(hostId: string, title: string, bracketUrl: string, fee: number): Promise<Tournament>;
    getTournaments(): Promise<{
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
    joinTournament(tournamentId: string, userId: string): Promise<{
        message: string;
        newBalance?: undefined;
    } | {
        message: string;
        newBalance: number;
    }>;
    startTournament(tournamentId: string, userId: string): Promise<{
        success: boolean;
        status: string;
    }>;
    endTournament(tournamentId: string, userId: string, winnerId?: string): Promise<{
        success: boolean;
        winnerBalance: number;
    }>;
    sendMessage(groupId: string, senderId: string, username: string, content: string): Promise<GroupMessage>;
    getMessages(groupId: string): Promise<GroupMessage[]>;
}
