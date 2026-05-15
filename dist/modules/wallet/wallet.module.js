"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const wallet_service_1 = require("./wallet.service");
const wallet_controller_1 = require("./wallet.controller");
const wallet_entity_1 = require("./wallet.entity");
const admin_wallet_service_1 = require("./admin-wallet.service");
const transaction_service_1 = require("./transaction.service");
const websockets_module_1 = require("../websockets/websockets.module");
const users_module_1 = require("../users/users.module");
let WalletModule = class WalletModule {
};
exports.WalletModule = WalletModule;
exports.WalletModule = WalletModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([wallet_entity_1.Transaction]),
            websockets_module_1.WebsocketsModule,
            users_module_1.UsersModule,
        ],
        controllers: [wallet_controller_1.WalletController],
        providers: [
            wallet_service_1.WalletService,
            admin_wallet_service_1.AdminWalletService,
            transaction_service_1.TransactionService,
        ],
        exports: [
            wallet_service_1.WalletService,
            admin_wallet_service_1.AdminWalletService,
            transaction_service_1.TransactionService,
        ],
    })
], WalletModule);
//# sourceMappingURL=wallet.module.js.map