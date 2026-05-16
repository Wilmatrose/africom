import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

// Updated Enum to match WalletService logic
export enum TransactionCategory {
  COIN_PURCHASE = 'COIN_PURCHASE',
  GIFT_SENT = 'GIFT_SENT',
  GIFT_RECEIVED = 'GIFT_RECEIVED',
  WITHDRAWAL = 'WITHDRAWAL',
  TOURNAMENT_JOIN = 'TOURNAMENT_JOIN',
  TOURNAMENT_WIN = 'TOURNAMENT_WIN',
  COMMUNITY_JOIN = 'COMMUNITY_JOIN',
  ADMIN_REFUND = 'ADMIN_REFUND',
}

// New Enum for Withdrawal Status
export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FAILED = 'FAILED',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  // Changed to 'int' to match User coinBalance
  @Column({ type: 'int' })
  amount!: number;

  @Column({ type: 'enum', enum: TransactionType })
  type!: TransactionType;

  @Column({ type: 'enum', enum: TransactionCategory })
  category!: TransactionCategory;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.COMPLETED })
  status!: TransactionStatus;

  // Unique Reference from KoraPay or Internal ID
  @Column({ unique: true, nullable: true }) 
  reference!: string;

  // Flexible data storage (Bank details, Gift names, etc.)
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ nullable: true })
  description!: string;

  @CreateDateColumn()
  createdAt!: Date;
}