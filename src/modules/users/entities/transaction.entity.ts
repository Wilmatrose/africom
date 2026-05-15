import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../entities/user.entity';

export enum TransactionType {
  CREDIT = 'CREDIT', // Money coming in (Buying coins, Winning)
  DEBIT = 'DEBIT',   // Money going out (Joining, Withdrawing)
}

export enum TransactionCategory {
  PURCHASE = 'PURCHASE',       // User bought coins
  WITHDRAWAL = 'WITHDRAWAL',   // User cashed out
  TOURNAMENT = 'TOURNAMENT',   // Paid to join tournament
  COMMUNITY = 'COMMUNITY',     // Paid to join community
  REWARD = 'REWARD',           // Admin gave coins
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId!: string; // Who paid/received

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'enum', enum: TransactionType })
  type!: TransactionType;

  @Column({ type: 'enum', enum: TransactionCategory })
  category!: TransactionCategory;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ nullable: true })
  description!: string; // e.g. "Joined Tournament #123"

  @CreateDateColumn()
  createdAt!: Date;
}