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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const path_1 = require("path");
const fs_1 = require("fs");
const users_service_1 = require("../users/users/users.service");
const admin_wallet_service_1 = require("../wallet/admin-wallet.service");
const admin_stats_service_1 = require("./admin-stats.service");
const admin_guard_1 = require("./admin.guard");
const roles_decorator_1 = require("./roles.decorator");
let AdminController = class AdminController {
    constructor(usersService, adminWallet, adminStats) {
        this.usersService = usersService;
        this.adminWallet = adminWallet;
        this.adminStats = adminStats;
    }
    async getOverview() {
        return this.adminStats.getOverview();
    }
    async getDailyStats() {
        return this.adminStats.getDailyStats(7);
    }
    async getSystemHealth() {
        return this.adminStats.getSystemHealth();
    }
    async getKycStats() {
        const pending = await this.usersService.getPendingKycCount();
        return { pending };
    }
    async getPendingKycQueue() {
        return this.usersService.getPendingKyc();
    }
    async getKycDocument(userId, req, res) {
        const user = await this.usersService.findById(userId);
        const type = req.query.type;
        let fileUrl;
        if (type === 'id')
            fileUrl = user.idCardUrl;
        if (type === 'video')
            fileUrl = user.verificationVideoUrl;
        if (!fileUrl) {
            throw new common_1.NotFoundException('Document not found for this user.');
        }
        const filename = fileUrl.split('/').pop();
        const filePath = (0, path_1.join)(process.cwd(), 'uploads', 'kyc', filename);
        if (!(0, fs_1.existsSync)(filePath)) {
            throw new common_1.NotFoundException('File missing on server.');
        }
        return res.sendFile(filePath);
    }
    async approveKyc(id) {
        return this.usersService.approveCreator(id);
    }
    async rejectKyc(id) {
        return this.usersService.rejectCreator(id);
    }
    async getUsers() {
        const users = await this.usersService.getAllUsers();
        return {
            total: users.length,
            users,
        };
    }
    async downloadUserData(id, req, res) {
        const data = await this.adminWallet.getUserData(id);
        if (!data) {
            return res.status(404).json({
                message: 'User data not found',
            });
        }
        const exportData = {
            user: data.user,
            transactions: data.transactions,
            exportedAt: new Date().toISOString(),
        };
        const fileName = `user_data_${id}.json`;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        return res.send(JSON.stringify(exportData, null, 2));
    }
    async getTransactions() {
        const transactions = await this.adminWallet.getAllTransactions();
        return {
            total: transactions.length,
            transactions,
        };
    }
    async getWithdrawals() {
        const withdrawals = await this.adminWallet.getPendingWithdrawals();
        return {
            total: withdrawals.length,
            withdrawals,
        };
    }
    async approve(id, req) {
        const adminId = req.user?.userId;
        const result = await this.adminWallet.approveWithdrawal(id, adminId);
        return {
            message: 'Withdrawal approved',
            adminId,
            result,
        };
    }
    async reject(id, req) {
        const adminId = req.user?.userId;
        const result = await this.adminWallet.rejectWithdrawal(id, adminId);
        return {
            message: 'Withdrawal rejected',
            adminId,
            result,
        };
    }
    async getFraudSignals() {
        return this.adminStats.getFraudSignals();
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMMUNITY_LEAD'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('stats/daily'),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMMUNITY_LEAD'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDailyStats", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMMUNITY_LEAD'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSystemHealth", null);
__decorate([
    (0, common_1.Get)('kyc-stats'),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMMUNITY_LEAD'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getKycStats", null);
__decorate([
    (0, common_1.Get)('kyc/pending'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPendingKycQueue", null);
__decorate([
    (0, common_1.Get)('kyc/:id/documents'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getKycDocument", null);
__decorate([
    (0, common_1.Patch)('kyc/:id/approve'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveKyc", null);
__decorate([
    (0, common_1.Patch)('kyc/:id/reject'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectKyc", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMMUNITY_LEAD'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('users/:id/download'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "downloadUserData", null);
__decorate([
    (0, common_1.Get)('transactions'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Get)('withdrawals'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getWithdrawals", null);
__decorate([
    (0, common_1.Patch)('withdrawals/:id/approve'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)('withdrawals/:id/reject'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "reject", null);
__decorate([
    (0, common_1.Get)('fraud'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getFraudSignals", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        admin_wallet_service_1.AdminWalletService,
        admin_stats_service_1.AdminStatsService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map