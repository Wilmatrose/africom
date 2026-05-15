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
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const wallet_entity_1 = require("./wallet.entity");
const users_service_1 = require("../users/users/users.service");
const user_entity_1 = require("../users/entities/user.entity");
let WalletService = class WalletService {
    constructor(transactionRepo, usersService) {
        this.transactionRepo = transactionRepo;
        this.usersService = usersService;
    }
    async creditUser(userId, amount, reference, category) {
        const user = await this.usersService.findById(userId);
        user.coinBalance += amount;
        await this.usersService.updateProfile(userId, {
            coinBalance: user.coinBalance,
        });
        const tx = this.transactionRepo.create({
            userId,
            amount,
            type: wallet_entity_1.TransactionType.CREDIT,
            category,
            status: wallet_entity_1.TransactionStatus.COMPLETED,
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
    async debitFan(userId, amount, reference, giftName) {
        const user = await this.usersService.findById(userId);
        if (user.coinBalance < amount) {
            throw new common_1.BadRequestException('Insufficient funds');
        }
        user.coinBalance -= amount;
        await this.usersService.updateProfile(userId, {
            coinBalance: user.coinBalance,
        });
        const tx = this.transactionRepo.create({
            userId,
            amount,
            type: wallet_entity_1.TransactionType.DEBIT,
            category: wallet_entity_1.TransactionCategory.GIFT_SENT,
            status: wallet_entity_1.TransactionStatus.COMPLETED,
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
    async creditCreator(creatorId, amount, reference, giftName) {
        const user = await this.usersService.findById(creatorId);
        user.coinBalance += amount;
        await this.usersService.updateProfile(creatorId, {
            coinBalance: user.coinBalance,
        });
        const tx = this.transactionRepo.create({
            userId: creatorId,
            amount,
            type: wallet_entity_1.TransactionType.CREDIT,
            category: wallet_entity_1.TransactionCategory.GIFT_RECEIVED,
            status: wallet_entity_1.TransactionStatus.COMPLETED,
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
    async withdraw(userId, amount, bankDetails) {
        const user = await this.usersService.findById(userId);
        if (user.kycStatus !== user_entity_1.KYCStatus.APPROVED) {
            throw new common_1.BadRequestException('KYC required');
        }
        if (user.coinBalance < amount) {
            throw new common_1.BadRequestException('Insufficient balance');
        }
        user.coinBalance -= amount;
        await this.usersService.updateProfile(userId, {
            coinBalance: user.coinBalance,
        });
        const tx = this.transactionRepo.create({
            userId,
            amount,
            type: wallet_entity_1.TransactionType.DEBIT,
            category: wallet_entity_1.TransactionCategory.WITHDRAWAL,
            status: wallet_entity_1.TransactionStatus.PENDING,
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
    async getHistory(userId) {
        return this.transactionRepo.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }
    async getAllTransactions() {
        return this.transactionRepo.find({
            order: { createdAt: 'DESC' },
        });
    }
    async getPendingWithdrawals() {
        return this.transactionRepo.find({
            where: {
                category: wallet_entity_1.TransactionCategory.WITHDRAWAL,
                status: wallet_entity_1.TransactionStatus.PENDING,
            },
            order: { createdAt: 'ASC' },
        });
    }
    async approveWithdrawal(id, adminId) {
        const tx = await this.transactionRepo.findOne({ where: { id } });
        if (!tx)
            throw new common_1.NotFoundException('Transaction not found');
        if (tx.status !== wallet_entity_1.TransactionStatus.PENDING) {
            if (tx.status === wallet_entity_1.TransactionStatus.APPROVED) {
                throw new common_1.BadRequestException('Already approved');
            }
        }
        tx.status = wallet_entity_1.TransactionStatus.APPROVED;
        tx.metadata = {
            ...tx.metadata,
            processedBy: adminId,
            processedAt: new Date().toISOString(),
            action: 'APPROVED',
        };
        return this.transactionRepo.save(tx);
    }
    async rejectWithdrawal(id, adminId) {
        const tx = await this.transactionRepo.findOne({ where: { id } });
        if (!tx)
            throw new common_1.NotFoundException('Transaction not found');
        if (tx.status === wallet_entity_1.TransactionStatus.APPROVED) {
            throw new common_1.BadRequestException('Cannot reject approved withdrawal. Contact banking system.');
        }
        if (tx.status !== wallet_entity_1.TransactionStatus.PENDING) {
            throw new common_1.BadRequestException('Already processed');
        }
        const user = await this.usersService.findById(tx.userId);
        user.coinBalance += tx.amount;
        await this.usersService.updateProfile(user.id, {
            coinBalance: user.coinBalance,
        });
        tx.status = wallet_entity_1.TransactionStatus.REJECTED;
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
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(wallet_entity_1.Transaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        users_service_1.UsersService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map