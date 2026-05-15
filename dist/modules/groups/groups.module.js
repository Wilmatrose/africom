"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("../auth/auth.module");
const event_emitter_1 = require("@nestjs/event-emitter");
const groups_controller_1 = require("./groups.controller");
const groups_service_1 = require("./groups.service");
const groups_gateway_1 = require("./groups.gateway");
const group_entity_1 = require("./entities/group.entity");
const group_member_entity_1 = require("./entities/group-member.entity");
const group_message_entity_1 = require("./entities/group-message.entity");
const notification_entity_1 = require("../notifications/notification.entity");
let GroupsModule = class GroupsModule {
};
exports.GroupsModule = GroupsModule;
exports.GroupsModule = GroupsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                group_entity_1.Group,
                group_member_entity_1.GroupMember,
                group_message_entity_1.GroupMessage,
                notification_entity_1.Notification,
            ]),
            (0, common_1.forwardRef)(() => auth_module_1.AuthModule),
            event_emitter_1.EventEmitterModule.forRoot(),
        ],
        controllers: [groups_controller_1.GroupsController],
        providers: [groups_service_1.GroupsService, groups_gateway_1.GroupsGateway],
        exports: [groups_service_1.GroupsService],
    })
], GroupsModule);
//# sourceMappingURL=groups.module.js.map