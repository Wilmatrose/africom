"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const admin_controller_1 = require("./admin.controller");
const admin_guard_1 = require("./admin.guard");
const admin_stats_service_1 = require("./admin-stats.service");
const wallet_module_1 = require("../wallet/wallet.module");
const users_module_1 = require("../users/users.module");
const wallet_entity_1 = require("../wallet/wallet.entity");
const user_entity_1 = require("../users/entities/user.entity");
const tournaments_entity_1 = require("../tournaments/tournaments.entity");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            wallet_module_1.WalletModule,
            users_module_1.UsersModule,
            typeorm_1.TypeOrmModule.forFeature([
                wallet_entity_1.Transaction,
                user_entity_1.User,
                tournaments_entity_1.Tournament,
            ]),
        ],
        controllers: [admin_controller_1.AdminController],
        providers: [
            admin_guard_1.AdminGuard,
            admin_stats_service_1.AdminStatsService,
        ],
        exports: [admin_stats_service_1.AdminStatsService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map