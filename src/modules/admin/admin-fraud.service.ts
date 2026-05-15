import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';

import { Transaction } from '../wallet/wallet.entity';
import { TransactionCategory } from '../wallet/transaction.enum';

@Injectable()
export class AdminFraudService {
  constructor(
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
  ) {}

  // =========================================
  // HIGH FREQUENCY USERS (24H)
  // =========================================
  async detectHighFrequencyUsers() {
    const since = new Date();
    since.setHours(since.getHours() - 24);

    return this.txRepo
      .createQueryBuilder('tx')
      .select('tx.userId', 'userId')
      .addSelect('COUNT(tx.id)', 'txCount')
      .where('tx.createdAt >= :since', { since })
      .groupBy('tx.userId')
      .having('COUNT(tx.id) > 20')
      .getRawMany();
  }

  // =========================================
  // LARGE WITHDRAWALS
  // =========================================
  async detectLargeWithdrawals() {
    const txs = await this.txRepo.find({
      where: {
        category: TransactionCategory.WITHDRAWAL,
      },
      order: { createdAt: 'DESC' },
    });

    return txs
      .filter(tx => Number(tx.amount) >= 50000)
      .map(tx => ({
        userId: tx.userId,
        transactionId: tx.id,
        amount: tx.amount,
        risk: 'LARGE_WITHDRAWAL',
      }));
  }

  // =========================================
  // FULL FRAUD REPORT
  // =========================================
  async getFraudReport() {
    const [highFrequencyUsers, largeWithdrawals] = await Promise.all([
      this.detectHighFrequencyUsers(),
      this.detectLargeWithdrawals(),
    ]);

    return {
      timestamp: new Date(),
      highFrequencyUsers,
      largeWithdrawals,
    };
  }
}