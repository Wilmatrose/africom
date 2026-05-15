import { Repository } from 'typeorm';
import { Transaction } from '../wallet/wallet.entity';
export declare class AdminFraudService {
    private readonly txRepo;
    constructor(txRepo: Repository<Transaction>);
    detectHighFrequencyUsers(): Promise<any[]>;
    detectLargeWithdrawals(): Promise<{
        userId: string;
        transactionId: string;
        amount: number;
        risk: string;
    }[]>;
    getFraudReport(): Promise<{
        timestamp: Date;
        highFrequencyUsers: any[];
        largeWithdrawals: {
            userId: string;
            transactionId: string;
            amount: number;
            risk: string;
        }[];
    }>;
}
