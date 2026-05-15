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
exports.AdminWalletService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const wallet_entity_1 = require("./wallet.entity");
const user_entity_1 = require("../users/entities/user.entity");
let AdminWalletService = class AdminWalletService {
    constructor(transactionRepo, userRepo) {
        this.transactionRepo = transactionRepo;
        this.userRepo = userRepo;
    }
    async getUserData(userId) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const transactions = await this.transactionRepo.find({
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
    async getAllTransactions() {
        return this.transactionRepo.find({
            order: {
                createdAt: 'DESC',
            },
        });
    }
    async getPendingWithdrawals() {
        return this.transactionRepo.find({
            where: {
                category: wallet_entity_1.TransactionCategory.WITHDRAWAL,
                status: wallet_entity_1.TransactionStatus.PENDING,
            },
            order: {
                createdAt: 'ASC',
            },
        });
    }
    async approveWithdrawal(id, adminId) {
        const tx = await this.transactionRepo.findOne({
            where: { id },
        });
        if (!tx) {
            throw new common_1.NotFoundException('Transaction not found');
        }
        if (tx.status ===
            wallet_entity_1.TransactionStatus.APPROVED) {
            throw new common_1.BadRequestException('Already approved');
        }
        tx.status =
            wallet_entity_1.TransactionStatus.APPROVED;
        tx.metadata = {
            ...tx.metadata,
            processedBy: adminId,
            processedAt: new Date().toISOString(),
            action: 'APPROVED',
        };
        return this.transactionRepo.save(tx);
    }
    async rejectWithdrawal(id, adminId) {
        const tx = await this.transactionRepo.findOne({
            where: { id },
        });
        if (!tx) {
            throw new common_1.NotFoundException('Transaction not found');
        }
        if (tx.status ===
            wallet_entity_1.TransactionStatus.APPROVED) {
            throw new common_1.BadRequestException('Cannot reject approved withdrawal');
        }
        if (tx.status !==
            wallet_entity_1.TransactionStatus.PENDING) {
            throw new common_1.BadRequestException('Already processed');
        }
        const user = await this.userRepo.findOne({
            where: {
                id: tx.userId,
            },
        });
        if (user) {
            user.coinBalance += tx.amount;
            await this.userRepo.save(user);
        }
        tx.status =
            wallet_entity_1.TransactionStatus.REJECTED;
        tx.metadata = {
            ...tx.metadata,
            processedBy: adminId,
            processedAt: new Date().toISOString(),
            action: 'REJECTED',
            refund: true,
        };
        return this.transactionRepo.save(tx);
    }
};
exports.AdminWalletService = AdminWalletService;
exports.AdminWalletService = AdminWalletService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(wallet_entity_1.Transaction)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], AdminWalletService);
//# sourceMappingURL=admin-wallet.service.js.map