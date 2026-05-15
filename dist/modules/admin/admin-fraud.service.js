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
exports.AdminFraudService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const wallet_entity_1 = require("../wallet/wallet.entity");
const transaction_enum_1 = require("../wallet/transaction.enum");
let AdminFraudService = class AdminFraudService {
    constructor(txRepo) {
        this.txRepo = txRepo;
    }
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
    async detectLargeWithdrawals() {
        const txs = await this.txRepo.find({
            where: {
                category: transaction_enum_1.TransactionCategory.WITHDRAWAL,
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
};
exports.AdminFraudService = AdminFraudService;
exports.AdminFraudService = AdminFraudService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(wallet_entity_1.Transaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AdminFraudService);
//# sourceMappingURL=admin-fraud.service.js.map