export declare enum TransactionType {
    CREDIT = "CREDIT",
    DEBIT = "DEBIT"
}
export declare enum TransactionCategory {
    COIN_PURCHASE = "COIN_PURCHASE",
    GIFT_SENT = "GIFT_SENT",
    GIFT_RECEIVED = "GIFT_RECEIVED",
    WITHDRAWAL = "WITHDRAWAL",
    TOURNAMENT_JOIN = "TOURNAMENT_JOIN",
    TOURNAMENT_WIN = "TOURNAMENT_WIN",
    COMMUNITY_JOIN = "COMMUNITY_JOIN"
}
export declare enum TransactionStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export declare class Transaction {
    id: string;
    userId: string;
    amount: number;
    type: TransactionType;
    category: TransactionCategory;
    status: TransactionStatus;
    reference: string;
    metadata?: Record<string, any>;
    createdAt: Date;
}
