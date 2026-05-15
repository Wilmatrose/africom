import { User } from '../entities/user.entity';
export declare enum TransactionType {
    CREDIT = "CREDIT",
    DEBIT = "DEBIT"
}
export declare enum TransactionCategory {
    PURCHASE = "PURCHASE",
    WITHDRAWAL = "WITHDRAWAL",
    TOURNAMENT = "TOURNAMENT",
    COMMUNITY = "COMMUNITY",
    REWARD = "REWARD"
}
export declare class Transaction {
    id: string;
    userId: string;
    user: User;
    type: TransactionType;
    category: TransactionCategory;
    amount: number;
    description: string;
    createdAt: Date;
}
