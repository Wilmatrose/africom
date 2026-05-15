"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminStatsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const wallet_entity_1 = require("../wallet/wallet.entity");
const user_entity_1 = require("../users/entities/user.entity");
const tournaments_entity_1 = require("../tournaments/tournaments.entity");
let AdminStatsService = class AdminStatsService {
    constructor(transactionRepo, userRepo, tournamentRepo) {
        this.transactionRepo = transactionRepo;
        this.userRepo = userRepo;
        this.tournamentRepo = tournamentRepo;
    }
    async getOverview() {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const [totalUsers, totalCreators, totalTransactions, totalRevenue, newUsersToday, activeTournaments, pendingKyc] = await Promise.all([
            this.userRepo.count(),
            this.userRepo.count({ where: { role: user_entity_1.UserRole.CREATOR } }),
            this.transactionRepo.count(),
            this.transactionRepo
                .createQueryBuilder('tx')
                .select('SUM(tx.amount)', 'sum')
                .where('tx.type = :type', { type: 'CREDIT' })
                .getRawOne(),
            this.userRepo.count({ where: { createdAt: (0, typeorm_2.MoreThan)(todayStart) } }),
            this.tournamentRepo.count({ where: { status: 'LIVE' } }),
            this.userRepo.count({ where: { kycStatus: user_entity_1.KYCStatus.PENDING } }),
        ]);
        return {
            totalUsers,
            totalCreators,
            totalTransactions,
            totalRevenue: Number(totalRevenue?.sum || 0),
            newUsersToday,
            activeTournaments,
            pendingKyc,
        };
    }
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
    async getFraudSignals() {
        const suspiciousUsers = await this.transactionRepo
            .createQueryBuilder('tx')
            .select('tx.userId')
            .addSelect('COUNT(tx.id)', 'count')
            .groupBy('tx.userId')
            .having('COUNT(tx.id) > 20')
            .getRawMany();
        const largeWithdrawals = await this.transactionRepo.find({
            where: {
                category: wallet_entity_1.TransactionCategory.WITHDRAWAL,
            },
        });
        const flaggedWithdrawals = largeWithdrawals.filter((tx) => Number(tx.amount) > 50000);
        return {
            highActivityUsers: suspiciousUsers,
            largeWithdrawals: flaggedWithdrawals,
        };
    }
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
};
exports.AdminStatsService = AdminStatsService;
exports.AdminStatsService = AdminStatsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(wallet_entity_1.Transaction)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(tournaments_entity_1.Tournament)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdminStatsService);
//# sourceMappingURL=admin-stats.service.js.map