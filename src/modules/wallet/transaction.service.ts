import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Import only the Entity and Enums from the same folder (wallet)
import { 
  Transaction, 
  TransactionType, 
  TransactionCategory, 
  TransactionStatus 
} from './wallet.entity';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
  ) {}

  // This is a generic log function used by WalletService
  async log(
    userId: string,
    amount: number,
    type: TransactionType,
    category: TransactionCategory,
    reference: string,
    metadata?: Record<string, any>,
  ) {
    const tx = this.txRepo.create({
      userId,
      amount,
      type,
      category,
      reference,
      metadata,
      status: TransactionStatus.COMPLETED,
    });
    return this.txRepo.save(tx);
  }
}