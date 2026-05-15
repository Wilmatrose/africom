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
exports.MessagingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const message_entity_1 = require("../entities/message.entity");
const user_entity_1 = require("../users/entities/user.entity");
const notification_entity_1 = require("../notifications/notification.entity");
const event_emitter_1 = require("@nestjs/event-emitter");
let MessagingService = class MessagingService {
    constructor(msgRepo, userRepo, notifRepo, eventEmitter) {
        this.msgRepo = msgRepo;
        this.userRepo = userRepo;
        this.notifRepo = notifRepo;
        this.eventEmitter = eventEmitter;
    }
    async getInbox(userId) {
        const conversations = await this.msgRepo.find({
            where: [
                { senderId: userId, isAccepted: true },
                { receiverId: userId, isAccepted: true },
            ],
            order: { createdAt: 'DESC' },
            relations: ['sender', 'receiver'],
        });
        const requests = await this.msgRepo.find({
            where: { receiverId: userId, isRequest: true, isAccepted: false },
            order: { createdAt: 'DESC' },
            relations: ['sender', 'receiver'],
        });
        return {
            conversations: conversations.map(m => this.sanitizeMessage(m, userId)),
            requests: requests.map(m => this.sanitizeMessage(m, userId)),
        };
    }
    async getMessages(userId, otherUserId) {
        const messages = await this.msgRepo.find({
            where: [
                { senderId: userId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: userId },
            ],
            order: { createdAt: 'ASC' },
            relations: ['sender', 'receiver'],
        });
        return messages.map(m => this.sanitizeMessage(m, userId));
    }
    async sendMessage(senderId, receiverId, content, imageUrl) {
        const sender = await this.userRepo.findOne({
            where: { id: senderId },
            relations: ['following', 'followers']
        });
        const receiver = await this.userRepo.findOne({ where: { id: receiverId } });
        if (!receiver)
            throw new common_1.NotFoundException('User not found');
        const isFollowing = sender.following.some(u => u.id === receiverId);
        if (!isFollowing) {
            throw new common_1.ForbiddenException('You must follow this user to send a message');
        }
        const isMutual = sender.followers.some(u => u.id === receiverId);
        const message = this.msgRepo.create({
            sender,
            receiver,
            senderId,
            receiverId,
            content,
            imageUrl,
            isRequest: !isMutual,
            isAccepted: isMutual,
        });
        const saved = await this.msgRepo.save(message);
        const payload = this.sanitizeMessage(saved, senderId);
        this.eventEmitter.emit('private_message', { ...payload, receiverId });
        if (!isMutual) {
            await this.createNotif(receiverId, 'MESSAGE_REQUEST', `${sender.username} sent a message request.`, saved.id);
        }
        else {
            await this.createNotif(receiverId, 'NEW_MESSAGE', `New message from ${sender.username}`, saved.id);
        }
        return payload;
    }
    async acceptRequest(userId, requestId) {
        const request = await this.msgRepo.findOne({ where: { id: requestId } });
        if (!request)
            throw new common_1.NotFoundException('Request not found');
        if (request.receiverId !== userId)
            throw new common_1.ForbiddenException('Not authorized');
        request.isAccepted = true;
        request.isRequest = false;
        return this.msgRepo.save(request);
    }
    async getUnreadCount(userId) {
        const count = await this.msgRepo.count({
            where: {
                receiverId: userId,
                isRead: false,
                isAccepted: true
            }
        });
        return { count };
    }
    async markMessagesAsRead(userId, senderId) {
        await this.msgRepo.update({
            receiverId: userId,
            senderId: senderId,
            isRead: false
        }, {
            isRead: true
        });
        return { success: true };
    }
    async createNotif(userId, type, msg, relatedId) {
        const notif = this.notifRepo.create({ userId, type, message: msg, relatedId });
        await this.notifRepo.save(notif);
        this.eventEmitter.emit('notification', { userId, type, message: msg });
    }
    sanitizeMessage(msg, currentUserId) {
        return {
            id: msg.id,
            content: msg.content,
            imageUrl: msg.imageUrl,
            createdAt: msg.createdAt,
            isRequest: msg.isRequest,
            isAccepted: msg.isAccepted,
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            isMine: msg.senderId === currentUserId,
            sender: this.sanitizeUser(msg.sender),
        };
    }
    sanitizeUser(user) {
        if (!user)
            return null;
        return { id: user.id, username: user.username, avatarUrl: user.avatarUrl };
    }
};
exports.MessagingService = MessagingService;
exports.MessagingService = MessagingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(message_entity_1.Message)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        event_emitter_1.EventEmitter2])
], MessagingService);
//# sourceMappingURL=messaging.service.js.map