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
exports.GroupsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const group_entity_1 = require("./entities/group.entity");
const group_member_entity_1 = require("./entities/group-member.entity");
const group_message_entity_1 = require("./entities/group-message.entity");
const notification_entity_1 = require("../notifications/notification.entity");
const uuid_1 = require("uuid");
let GroupsService = class GroupsService {
    constructor(groupRepo, memberRepo, messageRepo, notifRepo, dataSource, eventEmitter) {
        this.groupRepo = groupRepo;
        this.memberRepo = memberRepo;
        this.messageRepo = messageRepo;
        this.notifRepo = notifRepo;
        this.dataSource = dataSource;
        this.eventEmitter = eventEmitter;
    }
    sanitizeUser(user) {
        if (!user)
            return null;
        return {
            id: user.id,
            username: user.username,
            avatarUrl: user.avatarUrl,
            role: user.role,
        };
    }
    async create(name, description, creatorId, fileUrl) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const group = this.groupRepo.create({
                name, description, creatorId, imageUrl: fileUrl,
                inviteLink: (0, uuid_1.v4)().split('-')[0],
            });
            const savedGroup = await queryRunner.manager.save(group);
            const member = this.memberRepo.create({ groupId: savedGroup.id, userId: creatorId, role: group_member_entity_1.GroupMemberRole.ADMIN });
            await queryRunner.manager.save(member);
            await queryRunner.commitTransaction();
            const fullGroup = await this.groupRepo.findOne({ where: { id: savedGroup.id }, relations: ['creator'] });
            return {
                ...fullGroup,
                creator: this.sanitizeUser(fullGroup?.creator)
            };
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    async joinByName(userId, groupName) {
        const group = await this.groupRepo.findOne({
            where: { name: (0, typeorm_2.ILike)(groupName) }
        });
        if (!group) {
            throw new common_1.NotFoundException(`Group '${groupName}' not found.`);
        }
        const existingMember = await this.memberRepo.findOne({
            where: { groupId: group.id, userId }
        });
        if (existingMember) {
            return group;
        }
        const newMember = this.memberRepo.create({
            groupId: group.id,
            userId,
            role: group_member_entity_1.GroupMemberRole.MEMBER
        });
        await this.memberRepo.save(newMember);
        this.eventEmitter.emit('group_joined', { group, userId });
        return group;
    }
    async join(userId, inviteLink) {
        const group = await this.groupRepo.findOne({ where: { inviteLink } });
        if (!group)
            throw new common_1.BadRequestException('Invalid invite link');
        const existingMember = await this.memberRepo.findOne({ where: { groupId: group.id, userId } });
        if (existingMember)
            throw new common_1.BadRequestException('Already a member');
        const newMember = this.memberRepo.create({ groupId: group.id, userId, role: group_member_entity_1.GroupMemberRole.MEMBER });
        await this.memberRepo.save(newMember);
        return this.findById(group.id);
    }
    async findAll() {
        const groups = await this.groupRepo.find({
            order: { createdAt: 'DESC' },
            relations: ['creator']
        });
        return groups.map(g => ({
            ...g,
            creator: this.sanitizeUser(g.creator)
        }));
    }
    async findJoined(userId) {
        const memberships = await this.memberRepo.find({ where: { userId }, relations: ['group', 'group.creator'] });
        return memberships.map(m => ({
            ...m.group,
            creator: this.sanitizeUser(m.group.creator)
        }));
    }
    async findById(id) {
        const group = await this.groupRepo.findOne({ where: { id }, relations: ['creator', 'members', 'members.user'] });
        if (!group)
            return null;
        group.creator = this.sanitizeUser(group.creator);
        if (group.members) {
            group.members = group.members.map(m => ({
                ...m,
                user: this.sanitizeUser(m.user)
            }));
        }
        return group;
    }
    async getGroupDetails(groupId, userId) {
        const group = await this.groupRepo.findOne({
            where: { id: groupId },
            relations: ['members', 'members.user'],
        });
        if (!group)
            throw new common_1.NotFoundException('Group not found');
        const isMember = group.members.some(m => m.userId === userId);
        if (!isMember)
            throw new common_1.ForbiddenException('You are not a member');
        const members = group.members.map(m => ({
            id: m.user.id,
            username: m.user.username,
            avatarUrl: m.user.avatarUrl,
            role: m.role,
        }));
        return {
            id: group.id,
            name: group.name,
            description: group.description,
            imageUrl: group.imageUrl,
            inviteLink: group.inviteLink,
            lockGroup: group.lockGroup || false,
            disappearingTimer: group.disappearingTimer || 0,
            members,
        };
    }
    async updateGroup(groupId, userId, updates) {
        const member = await this.memberRepo.findOne({ where: { groupId, userId } });
        if (!member || member.role !== group_member_entity_1.GroupMemberRole.ADMIN) {
            throw new common_1.ForbiddenException('Only admins can update settings');
        }
        const group = await this.findById(groupId);
        if (!group)
            throw new common_1.NotFoundException('Group not found');
        if (updates.name)
            group.name = updates.name;
        if (updates.description !== undefined)
            group.description = updates.description;
        if (updates.imageUrl)
            group.imageUrl = updates.imageUrl;
        if (updates.lockGroup !== undefined)
            group.lockGroup = updates.lockGroup;
        if (updates.disappearingTimer !== undefined)
            group.disappearingTimer = updates.disappearingTimer;
        const savedGroup = await this.groupRepo.save(group);
        this.eventEmitter.emit('group_updated', savedGroup);
        return savedGroup;
    }
    async resetInviteLink(groupId, userId) {
        const member = await this.memberRepo.findOne({ where: { groupId, userId } });
        if (!member || member.role !== group_member_entity_1.GroupMemberRole.ADMIN)
            throw new common_1.ForbiddenException('Only admins can reset link');
        const group = await this.findById(groupId);
        if (!group)
            throw new common_1.NotFoundException('Group not found');
        group.inviteLink = (0, uuid_1.v4)().split('-')[0];
        return this.groupRepo.save(group);
    }
    async sendMessage(groupId, senderId, content, imageUrl, replyToId) {
        const member = await this.memberRepo.findOne({ where: { groupId, userId: senderId } });
        if (!member)
            throw new common_1.ForbiddenException('Not a member');
        const message = this.messageRepo.create({
            groupId,
            senderId,
            content,
            imageUrl,
            replyToId: replyToId || null
        });
        const savedMessage = await this.messageRepo.save(message);
        const fullMessage = await this.messageRepo.findOne({
            where: { id: savedMessage.id },
            relations: ['sender', 'replyTo', 'replyTo.sender']
        });
        if (fullMessage) {
            fullMessage.sender = this.sanitizeUser(fullMessage.sender);
            if (fullMessage.replyTo) {
                fullMessage.replyTo.sender = this.sanitizeUser(fullMessage.replyTo.sender);
            }
        }
        this.eventEmitter.emit('group_message_created', fullMessage);
        return fullMessage;
    }
    async getMessages(groupId) {
        const messages = await this.messageRepo.find({
            where: { groupId },
            relations: ['sender', 'replyTo', 'replyTo.sender'],
            order: { createdAt: 'ASC' }
        });
        return messages.map(msg => {
            msg.sender = this.sanitizeUser(msg.sender);
            if (msg.replyTo) {
                msg.replyTo.sender = this.sanitizeUser(msg.replyTo.sender);
            }
            return msg;
        });
    }
    async checkAdmin(groupId, userId) {
        const member = await this.memberRepo.findOne({ where: { groupId, userId } });
        if (!member || member.role !== group_member_entity_1.GroupMemberRole.ADMIN)
            throw new common_1.ForbiddenException('Admin privileges required');
        return true;
    }
    async pinMessage(groupId, messageId, userId) {
        await this.checkAdmin(groupId, userId);
        const message = await this.messageRepo.findOne({ where: { id: messageId } });
        if (!message)
            throw new common_1.NotFoundException('Message not found');
        message.isPinned = !message.isPinned;
        const savedMsg = await this.messageRepo.save(message);
        this.eventEmitter.emit('message_updated', {
            groupId,
            id: savedMsg.id,
            isPinned: savedMsg.isPinned
        });
        return savedMsg;
    }
    async kickMember(groupId, targetUserId, adminId) {
        await this.checkAdmin(groupId, adminId);
        await this.messageRepo.delete({ groupId, senderId: targetUserId });
        await this.memberRepo.delete({ groupId, userId: targetUserId });
        this.eventEmitter.emit('kicked_from_group', { groupId, userId: targetUserId });
        this.eventEmitter.emit('user_kicked', { groupId, userId: targetUserId });
        return { success: true };
    }
    async promoteMember(groupId, targetUserId, adminId) {
        await this.checkAdmin(groupId, adminId);
        const targetMember = await this.memberRepo.findOne({ where: { groupId, userId: targetUserId } });
        if (!targetMember)
            throw new common_1.NotFoundException('Member not found');
        targetMember.role = group_member_entity_1.GroupMemberRole.ADMIN;
        const savedMember = await this.memberRepo.save(targetMember);
        this.eventEmitter.emit('user_promoted', {
            groupId,
            userId: targetUserId,
            role: 'ADMIN'
        });
        return savedMember;
    }
    async deleteMessage(groupId, messageId, userId) {
        const message = await this.messageRepo.findOne({ where: { id: messageId } });
        if (!message)
            throw new common_1.NotFoundException('Message not found');
        const member = await this.memberRepo.findOne({ where: { groupId, userId } });
        const isAdmin = member && member.role === group_member_entity_1.GroupMemberRole.ADMIN;
        const isSender = message.senderId === userId;
        if (!isAdmin && !isSender) {
            throw new common_1.ForbiddenException('You cannot delete this message');
        }
        await this.messageRepo.remove(message);
        this.eventEmitter.emit('message_deleted', { groupId, messageId });
        return { success: true };
    }
    async clearGroupChat(groupId, userId) {
        const member = await this.memberRepo.findOne({ where: { groupId, userId } });
        if (!member || member.role !== group_member_entity_1.GroupMemberRole.ADMIN) {
            throw new common_1.ForbiddenException('Only admins can clear chat history');
        }
        await this.messageRepo.delete({ groupId });
        this.eventEmitter.emit('chat_cleared', { groupId });
        return { success: true };
    }
};
exports.GroupsService = GroupsService;
exports.GroupsService = GroupsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(group_entity_1.Group)),
    __param(1, (0, typeorm_1.InjectRepository)(group_member_entity_1.GroupMember)),
    __param(2, (0, typeorm_1.InjectRepository)(group_message_entity_1.GroupMessage)),
    __param(3, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        event_emitter_1.EventEmitter2])
], GroupsService);
//# sourceMappingURL=groups.service.js.map