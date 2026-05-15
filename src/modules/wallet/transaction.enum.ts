export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

export enum TransactionCategory {
  COIN_PURCHASE = 'COIN_PURCHASE',
  GIFT_SENT = 'GIFT_SENT',
  GIFT_RECEIVED = 'GIFT_RECEIVED',
  WITHDRAWAL = 'WITHDRAWAL',

}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}