import { Repository } from 'typeorm';
import { Transaction, TransactionType, TransactionCategory } from './wallet.entity';
export declare class TransactionService {
    private readonly txRepo;
    constructor(txRepo: Repository<Transaction>);
    log(userId: string, amount: number, type: TransactionType, category: TransactionCategory, reference: string, metadata?: Record<string, any>): Promise<Transaction>;
}
