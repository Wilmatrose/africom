import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';

import { Transaction, TransactionCategory } from '../wallet/wallet.entity';
import { User, UserRole, KYCStatus } from '../users/entities/user.entity';
import { Tournament } from '../tournaments/tournaments.entity'; // Ensure this path is correct

@Injectable()
export class AdminStatsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    
    @InjectRepository(Tournament)
    private readonly tournamentRepo: Repository<Tournament>,
  ) {}

  // =========================================
  // 1. DASHBOARD OVERVIEW KPIs
  // =========================================
  async getOverview() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Run queries in parallel for performance
    const [
      totalUsers, 
      totalCreators, 
      totalTransactions, 
      totalRevenue,
      newUsersToday,
      activeTournaments,
      pendingKyc
    ] = await Promise.all([
      // Basic Stats
      this.userRepo.count(),
      this.userRepo.count({ where: { role: UserRole.CREATOR } }),
      this.transactionRepo.count(),
      this.transactionRepo
        .createQueryBuilder('tx')
        .select('SUM(tx.amount)', 'sum')
        .where('tx.type = :type', { type: 'CREDIT' })
        .getRawOne(),
        
      // Community Lead Specific Stats
      this.userRepo.count({ where: { createdAt: MoreThan(todayStart) } }),
      this.tournamentRepo.count({ where: { status: 'LIVE' } }), // Or 'SCHEDULED'
      this.userRepo.count({ where: { kycStatus: KYCStatus.PENDING } }),
    ]);

    return {
      // General Stats
      totalUsers,
      totalCreators,
      totalTransactions,
      totalRevenue: Number(totalRevenue?.sum || 0),
      
      // Community Lead Dashboard Stats
      newUsersToday,
      activeTournaments,
      pendingKyc,
    };
  }

  // =========================================
  // 2. DAILY ECONOMY FLOW (TREND ANALYTICS)
  // =========================================
  async getDailyStats(days = 7) {
    const result = [];

    for (let i = 0; i < days; i++) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setDate(end.getDate() - i);
      end.setHours(23, 59, 59, 999);

      const [credits, debits] = await Promise.all([
        this.transactionRepo
          .createQueryBuilder('tx')
          .select('SUM(tx.amount)', 'sum')
          .where('tx.type = :type', { type: 'CREDIT' })
          .andWhere('tx.createdAt BETWEEN :start AND :end', { start, end })
          .getRawOne(),

        this.transactionRepo
          .createQueryBuilder('tx')
          .select('SUM(tx.amount)', 'sum')
          .where('tx.type = :type', { type: 'DEBIT' })
          .andWhere('tx.createdAt BETWEEN :start AND :end', { start, end })
          .getRawOne(),
      ]);

      result.push({
        date: start.toISOString().split('T')[0],
        credits: Number(credits?.sum || 0),
        debits: Number(debits?.sum || 0),
      });
    }

    return result.reverse();
  }

  // =========================================
  // 3. FRAUD SIGNALS (BASIC RISK LAYER)
  // =========================================
  async getFraudSignals() {
    // High activity users (possible bot / abuse)
    const suspiciousUsers = await this.transactionRepo
      .createQueryBuilder('tx')
      .select('tx.userId')
      .addSelect('COUNT(tx.id)', 'count')
      .groupBy('tx.userId')
      .having('COUNT(tx.id) > 20')
      .getRawMany();

    // Large withdrawals (risk detection)
    const largeWithdrawals = await this.transactionRepo.find({
      where: {
        category: TransactionCategory.WITHDRAWAL,
      },
    });

    const flaggedWithdrawals = largeWithdrawals.filter(
      (tx) => Number(tx.amount) > 50000,
    );

    return {
      highActivityUsers: suspiciousUsers,
      largeWithdrawals: flaggedWithdrawals,
    };
  }

  // =========================================
  // 4. SYSTEM HEALTH SNAPSHOT
  // =========================================
  async getSystemHealth() {
    const totalUsers = await this.userRepo.count();

    const activeToday = await this.transactionRepo
      .createQueryBuilder('tx')
      .select('COUNT(DISTINCT tx.userId)', 'count')
      .where('tx.createdAt >= NOW() - INTERVAL \'1 day\'')
      .getRawOne();

    return {
      totalUsers,
      activeToday: Number(activeToday?.count || 0),
    };
  }
}