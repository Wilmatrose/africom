"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const users_module_1 = require("./modules/users/users.module");
const wallet_module_1 = require("./modules/wallet/wallet.module");
const payments_module_1 = require("./modules/payments/payments.module");
const streams_module_1 = require("./modules/streams/streams.module");
const websockets_module_1 = require("./modules/websockets/websockets.module");
const tournaments_module_1 = require("./modules/tournaments/tournaments.module");
const communities_module_1 = require("./modules/communities/communities.module");
const auth_module_1 = require("./modules/auth/auth.module");
const admin_module_1 = require("./modules/admin/admin.module");
const groups_module_1 = require("./modules/groups/groups.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'postgres',
                    host: config.get('DB_HOST') ?? 'localhost',
                    port: Number(config.get('DB_PORT')) ?? 5432,
                    username: config.get('DB_USER') ?? 'postgres',
                    password: config.get('DB_PASSWORD') ?? 'root',
                    database: config.get('DB_NAME') ?? 'africom_db',
                    autoLoadEntities: true,
                    synchronize: false,
                    logging: true,
                }),
            }),
            users_module_1.UsersModule,
            wallet_module_1.WalletModule,
            payments_module_1.PaymentsModule,
            streams_module_1.StreamsModule,
            websockets_module_1.WebsocketsModule,
            auth_module_1.AuthModule,
            admin_module_1.AdminModule,
            tournaments_module_1.TournamentsModule,
            communities_module_1.CommunitiesModule,
            groups_module_1.GroupsModule,
            notifications_module_1.NotificationsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map