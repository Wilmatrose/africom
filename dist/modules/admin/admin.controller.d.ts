import { Response } from 'express';
import { UsersService } from '../users/users/users.service';
import { AdminWalletService } from '../wallet/admin-wallet.service';
import { AdminStatsService } from './admin-stats.service';
export declare class AdminController {
    private readonly usersService;
    private readonly adminWallet;
    private readonly adminStats;
    constructor(usersService: UsersService, adminWallet: AdminWalletService, adminStats: AdminStatsService);
    getOverview(): Promise<{
        totalUsers: number;
        totalCreators: number;
        totalTransactions: number;
        totalRevenue: number;
        newUsersToday: number;
        activeTournaments: number;
        pendingKyc: number;
    }>;
    getDailyStats(): Promise<any[]>;
    getSystemHealth(): Promise<{
        totalUsers: number;
        activeToday: number;
    }>;
    getKycStats(): Promise<{
        pending: number;
    }>;
    getPendingKycQueue(): Promise<import("../users/entities/user.entity").User[]>;
    getKycDocument(userId: string, req: any, res: Response): Promise<void>;
    approveKyc(id: string): Promise<import("../users/entities/user.entity").User>;
    rejectKyc(id: string): Promise<import("../users/entities/user.entity").User>;
    getUsers(): Promise<{
        total: number;
        users: {
            id: string;
            username: string;
            email: string;
            role: import("../users/entities/user.entity").UserRole;
            coinBalance: number;
            kycStatus: import("../users/entities/user.entity").KYCStatus;
            createdAt: Date;
            ipAddress: string;
            status: any;
        }[];
    }>;
    downloadUserData(id: string, req: any, res: Response): Promise<Response<any, Record<string, any>>>;
    getTransactions(): Promise<{
        total: number;
        transactions: import("../wallet/wallet.entity").Transaction[];
    }>;
    getWithdrawals(): Promise<{
        total: number;
        withdrawals: import("../wallet/wallet.entity").Transaction[];
    }>;
    approve(id: string, req: any): Promise<{
        message: string;
        adminId: any;
        result: import("../wallet/wallet.entity").Transaction;
    }>;
    reject(id: string, req: any): Promise<{
        message: string;
        adminId: any;
        result: import("../wallet/wallet.entity").Transaction;
    }>;
    getFraudSignals(): Promise<{
        highActivityUsers: any[];
        largeWithdrawals: import("../wallet/wallet.entity").Transaction[];
    }>;
}
