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
exports.WalletController = void 0;
const common_1 = require("@nestjs/common");
const wallet_service_1 = require("./wallet.service");
const users_service_1 = require("../users/users/users.service");
const websockets_gateway_1 = require("../websockets/websockets.gateway");
const wallet_entity_1 = require("./wallet.entity");
const passport_1 = require("@nestjs/passport");
let WalletController = class WalletController {
    constructor(walletService, usersService, websocketsGateway) {
        this.walletService = walletService;
        this.usersService = usersService;
        this.websocketsGateway = websocketsGateway;
    }
    async getMyWallet(req) {
        const userId = req.user.id;
        const user = await this.usersService.findById(userId);
        return {
            balance: user.coinBalance,
            currency: 'NGN',
        };
    }
    async getHistory(req, userId) {
        if (req.user.id !== userId && req.user.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('You can only view your own history');
        }
        return this.walletService.getHistory(userId);
    }
    async buyCoins(req, body) {
        const userId = req.user.id;
        const result = await this.walletService.creditUser(userId, body.amount, body.reference || 'COIN_PURCHASE', wallet_entity_1.TransactionCategory.COIN_PURCHASE);
        this.websocketsGateway.server
            .to(`user_${userId}`)
            .emit('balanceUpdated', { newBalance: result.newBalance });
        return result;
    }
    async sendGift(req, body) {
        const senderId = req.user.id;
        const sender = await this.usersService.findById(senderId);
        const recipient = await this.usersService.findByUsername(body.recipientUsername);
        if (!recipient) {
            throw new common_1.NotFoundException(`User "${body.recipientUsername}" not found`);
        }
        if (senderId === recipient.id) {
            throw new common_1.ForbiddenException('You cannot send gifts to yourself');
        }
        const ref = `gift-${Date.now()}`;
        const giftName = `${body.amount} Coins`;
        await this.walletService.debitFan(senderId, body.amount, ref, giftName);
        await this.walletService.creditCreator(recipient.id, body.amount, ref, giftName);
        this.websocketsGateway.server.to(`user_${recipient.id}`).emit('onCreatorAlert', {
            type: 'GIFT',
            sender: sender.username,
            gift: giftName,
            amount: body.amount,
        });
        return { success: true, message: `Gift sent to ${body.recipientUsername}` };
    }
    async withdraw(req, body) {
        const userId = req.user.id;
        const result = await this.walletService.withdraw(userId, body.amount, body.bankDetails);
        this.websocketsGateway.server.to(`user_${userId}`).emit('onNotification', {
            message: 'Withdrawal request submitted.',
        });
        return result;
    }
};
exports.WalletController = WalletController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getMyWallet", null);
__decorate([
    (0, common_1.Get)('history/:userId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Post)('buy'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "buyCoins", null);
__decorate([
    (0, common_1.Post)('gift'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "sendGift", null);
__decorate([
    (0, common_1.Post)('withdraw'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "withdraw", null);
exports.WalletController = WalletController = __decorate([
    (0, common_1.Controller)('wallet'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [wallet_service_1.WalletService,
        users_service_1.UsersService,
        websockets_gateway_1.WebsocketsGateway])
], WalletController);
//# sourceMappingURL=wallet.controller.js.map