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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
let WebsocketsGateway = class WebsocketsGateway {
    handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
    }
    handleJoinStream(client, payload) {
        client.join(`session_${payload.sessionId}`);
        console.log(`User ${client.id} joined session ${payload.sessionId}`);
    }
    handleJoinDashboard(client, payload) {
        client.join(`creator_${payload.creatorId}`);
    }
    handleSendGift(client, payload) {
        this.server.to(`session_${payload.sessionId}`).emit('onGiftReceived', {
            message: `${payload.senderName} sent ${payload.giftName}!`,
            gift: payload.giftName,
        });
        this.server.to(`creator_${payload.creatorId}`).emit('onCreatorAlert', {
            type: 'GIFT',
            sender: payload.senderName,
            gift: payload.giftName,
            amount: payload.amount,
        });
    }
};
exports.WebsocketsGateway = WebsocketsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], WebsocketsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinStream'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], WebsocketsGateway.prototype, "handleJoinStream", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinDashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], WebsocketsGateway.prototype, "handleJoinDashboard", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendGift'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], WebsocketsGateway.prototype, "handleSendGift", null);
exports.WebsocketsGateway = WebsocketsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    })
], WebsocketsGateway);
//# sourceMappingURL=websockets.gateway.js.map