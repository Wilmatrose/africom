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
exports.GroupsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const uuid_1 = require("uuid");
const path_1 = require("path");
const groups_service_1 = require("./groups.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let GroupsController = class GroupsController {
    constructor(groupsService) {
        this.groupsService = groupsService;
    }
    async getAll() {
        return this.groupsService.findAll();
    }
    async getJoined(req) {
        return this.groupsService.findJoined(req.user.id);
    }
    async joinByName(req, body) {
        return this.groupsService.joinByName(req.user.id, body.name);
    }
    async getDetails(id, req) {
        return this.groupsService.getGroupDetails(id, req.user.id);
    }
    async getOne(id) {
        return this.groupsService.findById(id);
    }
    async join(body, req) {
        return this.groupsService.join(req.user.id, body.inviteLink);
    }
    async create(file, body, req) {
        if (!body.name)
            throw new common_1.BadRequestException('Group name is required');
        const fileUrl = file ? `http://localhost:3000/uploads/groups/${file.filename}` : undefined;
        return this.groupsService.create(body.name, body.description || '', req.user.id, fileUrl);
    }
    async update(id, body, file, req) {
        const imageUrl = file ? `http://localhost:3000/uploads/groups/${file.filename}` : undefined;
        const lockGroup = body.lockGroup === 'true';
        const disappearingTimer = body.disappearingTimer ? parseInt(body.disappearingTimer) : undefined;
        return this.groupsService.updateGroup(id, req.user.id, {
            name: body.name,
            description: body.description,
            imageUrl,
            lockGroup,
            disappearingTimer
        });
    }
    async resetLink(id, req) {
        return this.groupsService.resetInviteLink(id, req.user.id);
    }
    async getMessages(groupId) {
        return this.groupsService.getMessages(groupId);
    }
    async sendMessage(groupId, file, body, req) {
        const content = body.content || '';
        const imageUrl = file ? `http://localhost:3000/uploads/chat/${file.filename}` : undefined;
        const replyToId = body.replyToId;
        return this.groupsService.sendMessage(groupId, req.user.id, content, imageUrl, replyToId);
    }
    async pinMessage(groupId, messageId, req) {
        return this.groupsService.pinMessage(groupId, messageId, req.user.id);
    }
    async kickMember(groupId, targetUserId, req) {
        return this.groupsService.kickMember(groupId, targetUserId, req.user.id);
    }
    async promoteMember(groupId, targetUserId, req) {
        return this.groupsService.promoteMember(groupId, targetUserId, req.user.id);
    }
    async deleteMessage(groupId, messageId, req) {
        return this.groupsService.deleteMessage(groupId, messageId, req.user.id);
    }
    async clearChat(groupId, req) {
        return this.groupsService.clearGroupChat(groupId, req.user.id);
    }
};
exports.GroupsController = GroupsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)('joined'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getJoined", null);
__decorate([
    (0, common_1.Post)('join-by-name'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "joinByName", null);
__decorate([
    (0, common_1.Get)(':id/details'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getDetails", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)('join'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "join", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/groups',
            filename: (req, file, callback) => {
                const uniqueName = (0, uuid_1.v4)();
                const extension = (0, path_1.extname)(file.originalname);
                callback(null, `${uniqueName}${extension}`);
            },
        }),
        fileFilter: (req, file, callback) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
                return callback(new common_1.BadRequestException('Only image files are allowed!'), false);
            }
            callback(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({ destination: './uploads/groups', filename: (req, file, cb) => {
                const uniqueName = (0, uuid_1.v4)();
                cb(null, `${uniqueName}${(0, path_1.extname)(file.originalname)}`);
            } })
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/reset-link'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "resetLink", null);
__decorate([
    (0, common_1.Get)(':id/messages'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)(':id/messages'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/chat',
            filename: (req, file, callback) => {
                const uniqueName = (0, uuid_1.v4)();
                callback(null, `${uniqueName}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Patch)(':id/messages/:messageId/pin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('messageId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "pinMessage", null);
__decorate([
    (0, common_1.Post)(':id/kick/:userId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "kickMember", null);
__decorate([
    (0, common_1.Post)(':id/promote/:userId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "promoteMember", null);
__decorate([
    (0, common_1.Delete)(':id/messages/:messageId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('messageId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "deleteMessage", null);
__decorate([
    (0, common_1.Delete)(':id/messages'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "clearChat", null);
exports.GroupsController = GroupsController = __decorate([
    (0, common_1.Controller)('groups'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [groups_service_1.GroupsService])
], GroupsController);
//# sourceMappingURL=groups.controller.js.map