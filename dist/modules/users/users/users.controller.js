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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const uuid_1 = require("uuid");
const path_1 = require("path");
const users_service_1 = require("./users.service");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const roles_decorator_1 = require("../../admin/roles.decorator");
const admin_guard_1 = require("../../admin/admin.guard");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async getMe(req) {
        return this.usersService.findById(req.user.id);
    }
    async updateMyProfile(req, updates) {
        return this.usersService.updateProfile(req.user.id, updates);
    }
    async changePassword(req, body) {
        return this.usersService.changePassword(req.user.id, body.oldPassword, body.newPassword);
    }
    async uploadAvatar(req, file) {
        if (!file) {
            throw new common_1.BadRequestException('File is required');
        }
        const avatarUrl = `http://localhost:3000/uploads/avatars/${file.filename}`;
        await this.usersService.updateAvatar(req.user.id, avatarUrl);
        return {
            success: true,
            message: 'Avatar uploaded successfully',
            avatarUrl,
        };
    }
    async submitKyc(req, body, files) {
        const idCardFile = files.idCard?.[0];
        const videoFile = files.verificationVideo?.[0];
        if (!idCardFile || !videoFile) {
            throw new common_1.BadRequestException('Both ID Card and Video are required');
        }
        const baseUrl = 'http://localhost:3000';
        const idCardUrl = `${baseUrl}/uploads/kyc/${idCardFile.filename}`;
        const videoUrl = `${baseUrl}/uploads/kyc/${videoFile.filename}`;
        return this.usersService.requestCreatorUpgrade(req.user.id, body.fullName, idCardUrl, videoUrl);
    }
    async getUser(id) {
        return this.usersService.findById(id);
    }
    async banUser(id) {
        return this.usersService.banUser(id);
    }
    async unbanUser(id) {
        return this.usersService.unbanUser(id);
    }
    async approveKyc(id) {
        return this.usersService.approveCreator(id);
    }
    async rejectKyc(id) {
        return this.usersService.rejectCreator(id);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMe", null);
__decorate([
    (0, common_1.Put)('me'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateMyProfile", null);
__decorate([
    (0, common_1.Post)('me/password'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Post)('me/avatar'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/avatars',
            filename: (req, file, callback) => {
                const uniqueName = (0, uuid_1.v4)();
                const extension = (0, path_1.extname)(file.originalname);
                callback(null, `${uniqueName}${extension}`);
            },
        }),
        fileFilter: (req, file, callback) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/i)) {
                return callback(new common_1.BadRequestException('Only image files are allowed!'), false);
            }
            callback(null, true);
        },
    })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.Post)('me/kyc'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
        {
            name: 'idCard',
            maxCount: 1,
        },
        {
            name: 'verificationVideo',
            maxCount: 1,
        },
    ], {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/kyc',
            filename: (req, file, callback) => {
                const userId = req.user?.id || 'anonymous';
                const uniqueName = `${userId}_${(0, uuid_1.v4)()}`;
                const extension = (0, path_1.extname)(file.originalname);
                callback(null, `${uniqueName}${extension}`);
            },
        }),
    })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "submitKyc", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUser", null);
__decorate([
    (0, common_1.Patch)(':id/ban'),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMMUNITY_LEAD'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "banUser", null);
__decorate([
    (0, common_1.Patch)(':id/unban'),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMMUNITY_LEAD'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "unbanUser", null);
__decorate([
    (0, common_1.Patch)(':id/approve-kyc'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "approveKyc", null);
__decorate([
    (0, common_1.Patch)(':id/reject-kyc'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "rejectKyc", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map