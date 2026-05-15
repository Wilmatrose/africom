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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const wallet_service_1 = require("../wallet/wallet.service");
const transaction_enum_1 = require("../wallet/transaction.enum");
const user_entity_1 = require("../users/entities/user.entity");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const uuid_1 = require("uuid");
let PaymentsService = class PaymentsService {
    constructor(config, walletService, userRepo) {
        this.config = config;
        this.walletService = walletService;
        this.userRepo = userRepo;
        this.koraSecretKey = this.config.get('KORA_PAY_SECRET_KEY') || '';
    }
    async initiatePayment(userId, amountInNaira) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const coinsToReceive = amountInNaira * 100;
        const reference = `Africom_${(0, uuid_1.v4)()}`;
        try {
            const response = await axios_1.default.post('https://api.korapay.com/merchant/api/v1/charges/initialize', {
                amount: amountInNaira,
                currency: 'NGN',
                reference: reference,
                customer: {
                    email: user.email,
                    name: user.fullName || user.username,
                },
                metadata: {
                    userId: userId,
                    coinsToReceive: coinsToReceive,
                    platform: 'Africom Socials',
                },
            }, {
                headers: {
                    Authorization: `Bearer ${this.koraSecretKey}`,
                    'Content-Type': 'application/json',
                },
            });
            return {
                success: true,
                checkoutUrl: response.data.data.checkout_url,
                reference: response.data.data.reference,
            };
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                console.error('KoraPay Error Response:', error.response?.data || error.message);
                throw new common_1.BadRequestException('Payment initiation failed: ' + (error.response?.data?.message || 'Unknown error'));
            }
            else if (error instanceof Error) {
                console.error('Generic Error:', error.message);
                throw new common_1.BadRequestException('Payment initiation failed: ' + error.message);
            }
            else {
                console.error('Unknown Error:', error);
                throw new common_1.BadRequestException('Payment initiation failed due to an unknown error');
            }
        }
    }
    async verifyWebhook(payload, signature) {
        if (payload.event === 'charge.success') {
            const { data } = payload;
            const userId = data.metadata?.userId;
            const coins = data.metadata?.coinsToReceive;
            const reference = data.reference;
            if (!userId || !coins) {
                console.error('Webhook Error: Missing metadata');
                throw new common_1.BadRequestException('Invalid payload metadata');
            }
            try {
                await this.walletService.creditUser(userId, coins, reference, transaction_enum_1.TransactionCategory.COIN_PURCHASE);
                return { success: true, message: 'Wallet credited' };
            }
            catch (e) {
                console.error('Wallet Crediting Error', e);
                throw new common_1.BadRequestException('Failed to credit wallet');
            }
        }
        return { success: false, message: 'Event not handled' };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(wallet_service_1.WalletService)),
    __param(2, (0, typeorm_2.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        wallet_service_1.WalletService,
        typeorm_1.Repository])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map