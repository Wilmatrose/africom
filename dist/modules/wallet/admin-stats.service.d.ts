import { Repository } from 'typeorm';
import { Transaction } from '../wallet/wallet.entity';
import { User } from '../users/entities/user.entity';
import { Tournament } from '../tournaments/tournaments.entity';
export declare class AdminStatsService {
    private readonly transactionRepo;
    private readonly userRepo;
    private readonly tournamentRepo;
    constructor(transactionRepo: Repository<Transaction>, userRepo: Repository<User>, tournamentRepo: Repository<Tournament>);
    getOverview(): Promise<{
        totalUsers: number;
        totalCreators: number;
        totalTransactions: number;
        totalRevenue: number;
        newUsersToday: number;
        activeTournaments: number;
        pendingKyc: number;
    }>;
    getDailyStats(days?: number): Promise<any[]>;
    getFraudSignals(): Promise<{
        highActivityUsers: any[];
        largeWithdrawals: Transaction[];
    }>;
    getSystemHealth(): Promise<{
        totalUsers: number;
        activeToday: number;
    }>;
}
