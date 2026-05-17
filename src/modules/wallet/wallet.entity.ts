import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

export enum TransactionCategory {
  COIN_PURCHASE = 'COIN_PURCHASE',
  GIFT_SENT = 'GIFT_SENT',
  GIFT_RECEIVED = 'GIFT_RECEIVED',
  WITHDRAWAL = 'WITHDRAWAL',
  
  // TOURNAMENTS & COMMUNITIES
  TOURNAMENT_JOIN = 'TOURNAMENT_JOIN', 
  TOURNAMENT_WIN = 'TOURNAMENT_WIN',
  TOURNAMENT_REFUND = 'TOURNAMENT_REFUND',
  
  // ✅ ADDED: New Categories for Payout Split
  TOURNAMENT_HOST_REWARD = 'TOURNAMENT_HOST_REWARD', 
  PLATFORM_FEE = 'PLATFORM_FEE',
  
  COMMUNITY_JOIN = 'COMMUNITY_JOIN',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column('decimal')
  amount!: number;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type!: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionCategory,
  })
  category!: TransactionCategory;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.COMPLETED,
  })
  status!: TransactionStatus;

  @Column()
  reference!: string;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;
}