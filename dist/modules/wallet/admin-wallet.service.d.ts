import { Repository } from 'typeorm';
import { Transaction } from './wallet.entity';
import { User } from '../users/entities/user.entity';
export declare class AdminWalletService {
    private readonly transactionRepo;
    private readonly userRepo;
    constructor(transactionRepo: Repository<Transaction>, userRepo: Repository<User>);
    getUserData(userId: string): Promise<{
        user: {
            id: string;
            username: string;
            email: string;
            role: import("../users/entities/user.entity").UserRole;
            coinBalance: number;
            kycStatus: import("../users/entities/user.entity").KYCStatus;
            createdAt: Date;
        };
        transactions: Transaction[];
    }>;
    getAllTransactions(): Promise<Transaction[]>;
    getPendingWithdrawals(): Promise<Transaction[]>;
    approveWithdrawal(id: string, adminId: string): Promise<Transaction>;
    rejectWithdrawal(id: string, adminId: string): Promise<Transaction>;
}
