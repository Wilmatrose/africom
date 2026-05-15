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
exports.GroupsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const event_emitter_1 = require("@nestjs/event-emitter");
const common_1 = require("@nestjs/common");
const ws_jwt_guard_1 = require("../auth/ws-jwt.guard");
let GroupsGateway = class GroupsGateway {
    async handleJoinGroup(client, data) {
        client.join(data.groupId);
        console.log(`Client joined group: ${data.groupId}`);
    }
    handleGroupMessageEvent(payload) {
        this.server.to(payload.groupId).emit('newMessage', payload);
    }
    handleKickedFromGroupEvent(payload) {
        this.server.to(payload.groupId).emit('kicked_from_group', payload);
    }
    handleUserKickedEvent(payload) {
        this.server.to(payload.groupId).emit('user_kicked', payload);
    }
    handleMessageDeletedEvent(payload) {
        this.server.to(payload.groupId).emit('message_deleted', payload);
    }
    handleChatClearedEvent(payload) {
        this.server.to(payload.groupId).emit('chat_cleared', payload);
    }
    handleMessageUpdatedEvent(payload) {
        this.server.to(payload.groupId).emit('message_updated', payload);
    }
    handleUserPromotedEvent(payload) {
        this.server.to(payload.groupId).emit('user_promoted', payload);
    }
};
exports.GroupsGateway = GroupsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], GroupsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinGroup'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], GroupsGateway.prototype, "handleJoinGroup", null);
__decorate([
    (0, event_emitter_1.OnEvent)('group_message_created'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GroupsGateway.prototype, "handleGroupMessageEvent", null);
__decorate([
    (0, event_emitter_1.OnEvent)('kicked_from_group'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GroupsGateway.prototype, "handleKickedFromGroupEvent", null);
__decorate([
    (0, event_emitter_1.OnEvent)('user_kicked'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GroupsGateway.prototype, "handleUserKickedEvent", null);
__decorate([
    (0, event_emitter_1.OnEvent)('message_deleted'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GroupsGateway.prototype, "handleMessageDeletedEvent", null);
__decorate([
    (0, event_emitter_1.OnEvent)('chat_cleared'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GroupsGateway.prototype, "handleChatClearedEvent", null);
__decorate([
    (0, event_emitter_1.OnEvent)('message_updated'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GroupsGateway.prototype, "handleMessageUpdatedEvent", null);
__decorate([
    (0, event_emitter_1.OnEvent)('user_promoted'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GroupsGateway.prototype, "handleUserPromotedEvent", null);
exports.GroupsGateway = GroupsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*', credentials: true },
        namespace: 'groups',
    }),
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard)
], GroupsGateway);
//# sourceMappingURL=groups.gateway.js.map