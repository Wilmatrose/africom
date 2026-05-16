import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Transaction,
  TransactionType,
  TransactionCategory,
  TransactionStatus,
} from './wallet.entity';

import { UsersService } from '../users/users/users.service';
import { KYCStatus } from '../users/entities/user.entity';
import { User } from '../users/entities/user.entity'; // Import User Entity for Locking

@Injectable()
export class WalletService {
  // Rate: 10 Naira = 1 Coin
  private readonly NAIRA_PER_COIN = 10;

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    // Inject User Repo for Locking
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly usersService: UsersService,
  ) {}

  // ==================================================
  // 1. PURCHASE COINS (Called by Payments Webhook)
  // ==================================================
  async purchaseCoins(userId: string, amountInNaira: number, reference: string) {
    // Convert Naira to Coins
    const coinsToCredit = amountInNaira / this.NAIRA_PER_COIN;

    await this.userRepo.manager.transaction(async (transactionalEntityManager) => {
      // 1. Lock User Row
      const user = await transactionalEntityManager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) throw new NotFoundException('User not found');

      // 2. Update Balance
      user.coinBalance += coinsToCredit;
      await transactionalEntityManager.save(User, user);

      // 3. Log Transaction
      const tx = transactionalEntityManager.create(Transaction, {
        userId,
        amount: coinsToCredit,
        type: TransactionType.CREDIT,
        category: TransactionCategory.COIN_PURCHASE,
        status: TransactionStatus.COMPLETED,
        reference,
        metadata: {
          description: 'Coin purchase credited',
          paidAmount: amountInNaira, // Store original Naira amount
        },
      });

      await transactionalEntityManager.save(Transaction, tx);
    });

    // Fetch updated user to return fresh state
    const updatedUser = await this.usersService.findById(userId);
    return {
      success: true,
      newBalance: updatedUser.coinBalance,
      coinsAdded: coinsToCredit,
    };
  }

  // ==================================================
  // 2. CREDIT USER (Generic / Legacy)
  // ==================================================
  async creditUser(
    userId: string,
    amount: number,
    reference: string,
    category: TransactionCategory,
  ) {
    const user = await this.usersService.findById(userId);

    user.coinBalance += amount;

    await this.usersService.updateProfile(userId, {
      coinBalance: user.coinBalance,
    });

    const tx = this.transactionRepo.create({
      userId,
      amount,
      type: TransactionType.CREDIT,
      category,
      status: TransactionStatus.COMPLETED,
      reference,
      metadata: {
        description: 'Coins credited',
      },
    });

    await this.transactionRepo.save(tx);

    return {
      success: true,
      newBalance: user.coinBalance,
      transaction: tx,
    };
  }

  // ==================================================
  // 3. DEBIT FAN (SEND GIFT) - WITH LOCKING
  // ==================================================
  async debitFan(
    userId: string, 
    amount: number, 
    reference: string, 
    giftName: string,
  ) {
    await this.userRepo.manager.transaction(async (transactionalEntityManager) => {
      // 1. Lock User Row
      const user = await transactionalEntityManager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) throw new NotFoundException('User not found');

      if (user.coinBalance < amount) {
        throw new BadRequestException('Insufficient funds');
      }

      // 2. Deduct
      user.coinBalance -= amount;
      await transactionalEntityManager.save(User, user);

      // 3. Log Transaction
      const tx = transactionalEntityManager.create(Transaction, {
        userId,
        amount,
        type: TransactionType.DEBIT,
        category: TransactionCategory.GIFT_SENT,
        status: TransactionStatus.COMPLETED,
        reference,
        metadata: {
          description: 'Gift sent',
          giftName: giftName,
        },
      });

      await transactionalEntityManager.save(Transaction, tx);
    });

    const updatedUser = await this.usersService.findById(userId);
    return {
      success: true,
      newBalance: updatedUser.coinBalance,
    };
  }

  // ==================================================
  // 4. CREDIT CREATOR (Gift Received) - WITH LOCKING
  // ==================================================
  async creditCreator(
    creatorId: string, 
    amount: number, 
    reference: string, 
    giftName: string,
  ) {
    await this.userRepo.manager.transaction(async (transactionalEntityManager) => {
      // 1. Lock User Row
      const user = await transactionalEntityManager.findOne(User, {
        where: { id: creatorId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) throw new NotFoundException('Creator not found');

      // 2. Add Coins
      user.coinBalance += amount;
      await transactionalEntityManager.save(User, user);

      // 3. Log Transaction
      const tx = transactionalEntityManager.create(Transaction, {
        userId: creatorId,
        amount,
        type: TransactionType.CREDIT,
        category: TransactionCategory.GIFT_RECEIVED,
        status: TransactionStatus.COMPLETED,
        reference,
        metadata: {
          description: 'Gift received',
          giftName: giftName,
        },
      });

      await transactionalEntityManager.save(Transaction, tx);
    });

    const updatedUser = await this.usersService.findById(creatorId);
    return {
      success: true,
      newBalance: updatedUser.coinBalance,
    };
  }

  // ==================================================
  // 5. WITHDRAWAL REQUEST - WITH LOCKING
  // ==================================================
  async withdraw(
    userId: string,
    amount: number,
    bankDetails: {
      accountName: string;
      accountNumber: string;
      bankName: string;
    },
  ) {
    await this.userRepo.manager.transaction(async (transactionalEntityManager) => {
      // 1. Lock User Row
      const user = await transactionalEntityManager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) throw new NotFoundException('User not found');

      if (user.kycStatus !== KYCStatus.APPROVED) {
        throw new BadRequestException('KYC required');
      }

      if (user.coinBalance < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      // 2. Deduct
      user.coinBalance -= amount;
      await transactionalEntityManager.save(User, user);

      // 3. Log Transaction
      const tx = transactionalEntityManager.create(Transaction, {
        userId,
        amount,
        type: TransactionType.DEBIT,
        category: TransactionCategory.WITHDRAWAL,
        status: TransactionStatus.PENDING,
        reference: `WDR-${Date.now()}`,
        metadata: {
          ...bankDetails,
          requestedAt: new Date().toISOString(),
        },
      });

      await transactionalEntityManager.save(Transaction, tx);
    });

    const updatedUser = await this.usersService.findById(userId);
    return {
      success: true,
      message: 'Withdrawal submitted',
      newBalance: updatedUser.coinBalance,
    };
  }

  // ==================================================
  // 6. USER HISTORY
  // ==================================================
  async getHistory(userId: string) {
    return this.transactionRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // ==================================================
  // 7. ADMIN: ALL TRANSACTIONS
  // ==================================================
  async getAllTransactions() {
    return this.transactionRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  // ==================================================
  // 8. ADMIN: PENDING WITHDRAWALS
  // ==================================================
  async getPendingWithdrawals() {
    return this.transactionRepo.find({
      where: {
        category: TransactionCategory.WITHDRAWAL,
        status: TransactionStatus.PENDING,
      },
      order: { createdAt: 'ASC' },
    });
  }

  // ==================================================
  // 9. ADMIN: APPROVE WITHDRAWAL
  // ==================================================
  async approveWithdrawal(id: string, adminId: string) {
    const tx = await this.transactionRepo.findOne({ where: { id } });

    if (!tx) throw new NotFoundException('Transaction not found');

    if (tx.status === TransactionStatus.APPROVED) {
      throw new BadRequestException('Already approved');
    }

    tx.status = TransactionStatus.APPROVED;
    tx.metadata = {
      ...tx.metadata,
      processedBy: adminId,
      processedAt: new Date().toISOString(),
      action: 'APPROVED',
    };

    return this.transactionRepo.save(tx);
  }

  // ==================================================
  // 10. ADMIN: REJECT WITHDRAWAL (Refund) - WITH LOCKING
  // ==================================================
  async rejectWithdrawal(id: string, adminId: string) {
    const tx = await this.transactionRepo.findOne({ where: { id } });

    if (!tx) throw new NotFoundException('Transaction not found');

    if (tx.status === TransactionStatus.APPROVED) {
      throw new BadRequestException('Cannot reject approved withdrawal.');
    }

    if (tx.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Already processed');
    }

    // Refund with Locking
    await this.userRepo.manager.transaction(async (transactionalEntityManager) => {
      const user = await transactionalEntityManager.findOne(User, {
        where: { id: tx.userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) throw new NotFoundException('User not found');

      // Refund Coins
      user.coinBalance += tx.amount;
      await transactionalEntityManager.save(User, user);

      // Update Transaction Status
      tx.status = TransactionStatus.REJECTED;
      tx.metadata = {
        ...tx.metadata,
        processedBy: adminId,
        processedAt: new Date().toISOString(),
        action: 'REJECTED',
        refund: true,
      };
      
      await transactionalEntityManager.save(Transaction, tx);
    });

    return this.transactionRepo.save(tx);
  }
}