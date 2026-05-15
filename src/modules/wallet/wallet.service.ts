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

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    private readonly usersService: UsersService,
  ) {}

  // ==================================================
  // 1. CREDIT USER (COIN PURCHASE)
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
        description: 'Coin purchase credited',
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
  // 2. DEBIT FAN (SEND GIFT)
  // ==================================================
  async debitFan(
userId: string, amount: number, reference: string, giftName: string,
  ) {
    const user = await this.usersService.findById(userId);

    if (user.coinBalance < amount) {
      throw new BadRequestException('Insufficient funds');
    }

    user.coinBalance -= amount;

    await this.usersService.updateProfile(userId, {
      coinBalance: user.coinBalance,
    });

    const tx = this.transactionRepo.create({
      userId,
      amount,
      type: TransactionType.DEBIT,
      category: TransactionCategory.GIFT_SENT,
      status: TransactionStatus.COMPLETED,
      reference,
      metadata: {
        description: 'Gift sent',
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
  // 3. CREDIT CREATOR (Gift Received)
  // ==================================================
  async creditCreator(
creatorId: string, amount: number, reference: string, giftName: string,
  ) {
    const user = await this.usersService.findById(creatorId);

    user.coinBalance += amount;

    await this.usersService.updateProfile(creatorId, {
      coinBalance: user.coinBalance,
    });

    const tx = this.transactionRepo.create({
      userId: creatorId,
      amount,
      type: TransactionType.CREDIT,
      category: TransactionCategory.GIFT_RECEIVED,
      status: TransactionStatus.COMPLETED,
      reference,
      metadata: {
        description: 'Gift received',
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
  // 4. WITHDRAWAL REQUEST (Deducts coins immediately)
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
    const user = await this.usersService.findById(userId);

    if (user.kycStatus !== KYCStatus.APPROVED) {
      throw new BadRequestException('KYC required');
    }

    if (user.coinBalance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    // DEDUCT IMMEDIATELY
    user.coinBalance -= amount;

    await this.usersService.updateProfile(userId, {
      coinBalance: user.coinBalance,
    });

    const tx = this.transactionRepo.create({
      userId,
      amount,
      type: TransactionType.DEBIT,
      category: TransactionCategory.WITHDRAWAL,
      status: TransactionStatus.PENDING, // Stays pending until Admin Approval
      reference: `WDR-${Date.now()}`,
      metadata: {
        ...bankDetails,
        requestedAt: new Date().toISOString(),
      },
    });

    await this.transactionRepo.save(tx);

    return {
      success: true,
      message: 'Withdrawal submitted',
      newBalance: user.coinBalance,
      transaction: tx,
    };
  }

  // ==================================================
  // 5. USER HISTORY
  // ==================================================
  async getHistory(userId: string) {
    return this.transactionRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // ==================================================
  // 6. ADMIN: ALL TRANSACTIONS
  // ==================================================
  async getAllTransactions() {
    return this.transactionRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  // ==================================================
  // 7. ADMIN: PENDING WITHDRAWALS
  // ==================================================
  async getPendingWithdrawals() {
    return this.transactionRepo.find({
      where: {
        category: TransactionCategory.WITHDRAWAL,
        status: TransactionStatus.PENDING,
      },
      order: { createdAt: 'ASC' }, // Oldest first
    });
  }

  // ==================================================
  // 8. ADMIN: APPROVE WITHDRAWAL (Robust Handling)
  // ==================================================
  async approveWithdrawal(id: string, adminId: string) {
    const tx = await this.transactionRepo.findOne({ where: { id } });

    if (!tx) throw new NotFoundException('Transaction not found');

    // If we are approving, we assume money was sent. 
    // We only change status. No balance change needed.
    if (tx.status !== TransactionStatus.PENDING) {
      // Allow re-approval if previously rejected? 
      // Usually safer to disallow, but for this use case we allow PENDING or REJECTED
      if (tx.status === TransactionStatus.APPROVED) {
        throw new BadRequestException('Already approved');
      }
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
  // 9. ADMIN: REJECT WITHDRAWAL (Refund coins)
  // ==================================================
  async rejectWithdrawal(id: string, adminId: string) {
    const tx = await this.transactionRepo.findOne({ where: { id } });

    if (!tx) throw new NotFoundException('Transaction not found');

    if (tx.status === TransactionStatus.APPROVED) {
      // If already approved, we CANNOT reject/refund easily without external banking system logic.
      // Throwing error prevents accidental reversal of a real payment.
      throw new BadRequestException('Cannot reject approved withdrawal. Contact banking system.');
    }

    if (tx.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Already processed');
    }

    // REFUND LOGIC: Coins were deducted in withdraw(), so we must add them back.
    const user = await this.usersService.findById(tx.userId);

    user.coinBalance += tx.amount;

    await this.usersService.updateProfile(user.id, {
      coinBalance: user.coinBalance,
    });

    tx.status = TransactionStatus.REJECTED;

    tx.metadata = {
      ...tx.metadata,
      processedBy: adminId,
      processedAt: new Date().toISOString(),
      action: 'REJECTED',
      refund: true,
    };

    return this.transactionRepo.save(tx);
  }
}