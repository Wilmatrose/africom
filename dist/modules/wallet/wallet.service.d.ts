import { Repository } from 'typeorm';
import { Transaction, TransactionCategory } from './wallet.entity';
import { UsersService } from '../users/users/users.service';
export declare class WalletService {
    private readonly transactionRepo;
    private readonly usersService;
    constructor(transactionRepo: Repository<Transaction>, usersService: UsersService);
    creditUser(userId: string, amount: number, reference: string, category: TransactionCategory): Promise<{
        success: boolean;
        newBalance: number;
        transaction: Transaction;
    }>;
    debitFan(userId: string, amount: number, reference: string, giftName: string): Promise<{
        success: boolean;
        newBalance: number;
        transaction: Transaction;
    }>;
    creditCreator(creatorId: string, amount: number, reference: string, giftName: string): Promise<{
        success: boolean;
        newBalance: number;
        transaction: Transaction;
    }>;
    withdraw(userId: string, amount: number, bankDetails: {
        accountName: string;
        accountNumber: string;
        bankName: string;
    }): Promise<{
        success: boolean;
        message: string;
        newBalance: number;
        transaction: Transaction;
    }>;
    getHistory(userId: string): Promise<Transaction[]>;
    getAllTransactions(): Promise<Transaction[]>;
    getPendingWithdrawals(): Promise<Transaction[]>;
    approveWithdrawal(id: string, adminId: string): Promise<Transaction>;
    rejectWithdrawal(id: string, adminId: string): Promise<Transaction>;
}
