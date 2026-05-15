import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Transaction,
  TransactionCategory,
  TransactionStatus,
} from './wallet.entity';

import { User } from '../users/entities/user.entity';

@Injectable()
export class AdminWalletService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // ==================================================
  // GET SINGLE USER DATA
  // ==================================================
  async getUserData(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    const transactions =
      await this.transactionRepo.find({
        where: {
          userId: user.id,
        },
        order: {
          createdAt: 'DESC',
        },
      });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        coinBalance: user.coinBalance,
        kycStatus: user.kycStatus,
        createdAt: user.createdAt,
      },

      transactions,
    };
  }

  // ==================================================
  // ALL TRANSACTIONS
  // ==================================================
  async getAllTransactions() {
    return this.transactionRepo.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // ==================================================
  // PENDING WITHDRAWALS
  // ==================================================
  async getPendingWithdrawals() {
    return this.transactionRepo.find({
      where: {
        category:
          TransactionCategory.WITHDRAWAL,
        status: TransactionStatus.PENDING,
      },

      order: {
        createdAt: 'ASC',
      },
    });
  }

  // ==================================================
  // APPROVE WITHDRAWAL
  // ==================================================
  async approveWithdrawal(
    id: string,
    adminId: string,
  ) {
    const tx =
      await this.transactionRepo.findOne({
        where: { id },
      });

    if (!tx) {
      throw new NotFoundException(
        'Transaction not found',
      );
    }

    if (
      tx.status ===
      TransactionStatus.APPROVED
    ) {
      throw new BadRequestException(
        'Already approved',
      );
    }

    tx.status =
      TransactionStatus.APPROVED;

    tx.metadata = {
      ...tx.metadata,
      processedBy: adminId,
      processedAt:
        new Date().toISOString(),
      action: 'APPROVED',
    };

    return this.transactionRepo.save(tx);
  }

  // ==================================================
  // REJECT WITHDRAWAL
  // ==================================================
  async rejectWithdrawal(
    id: string,
    adminId: string,
  ) {
    const tx =
      await this.transactionRepo.findOne({
        where: { id },
      });

    if (!tx) {
      throw new NotFoundException(
        'Transaction not found',
      );
    }

    if (
      tx.status ===
      TransactionStatus.APPROVED
    ) {
      throw new BadRequestException(
        'Cannot reject approved withdrawal',
      );
    }

    if (
      tx.status !==
      TransactionStatus.PENDING
    ) {
      throw new BadRequestException(
        'Already processed',
      );
    }

    const user =
      await this.userRepo.findOne({
        where: {
          id: tx.userId,
        },
      });

    if (user) {
      user.coinBalance += tx.amount;

      await this.userRepo.save(user);
    }

    tx.status =
      TransactionStatus.REJECTED;

    tx.metadata = {
      ...tx.metadata,
      processedBy: adminId,
      processedAt:
        new Date().toISOString(),
      action: 'REJECTED',
      refund: true,
    };

    return this.transactionRepo.save(tx);
  }
}