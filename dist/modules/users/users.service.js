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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
let UsersService = class UsersService {
    constructor(userRepo) {
        this.userRepo = userRepo;
    }
    async createUser(username, email, passwordHash) {
        const existingUser = await this.userRepo.findOne({ where: { username } });
        if (existingUser) {
            throw new common_1.BadRequestException('Username already exists');
        }
        const existingEmail = await this.userRepo.findOne({ where: { email } });
        if (existingEmail) {
            throw new common_1.BadRequestException('Email already exists');
        }
        const user = this.userRepo.create({
            username,
            email,
            passwordHash,
            role: user_entity_1.UserRole.FAN,
            coinBalance: 0,
            kycStatus: user_entity_1.KYCStatus.NONE,
        });
        return this.userRepo.save(user);
    }
    async findByUsername(username) {
        return this.userRepo.findOne({
            where: { username },
            select: ['id', 'username', 'email', 'passwordHash', 'role', 'coinBalance'],
        });
    }
    async findById(id) {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async getAllUsers() {
        const users = await this.userRepo.find({
            order: { createdAt: 'DESC' },
        });
        return users.map((u) => ({
            id: u.id,
            username: u.username,
            email: u.email,
            role: u.role,
            coinBalance: u.coinBalance,
            kycStatus: u.kycStatus,
            createdAt: u.createdAt,
            ipAddress: u.lastLoginIp,
            status: u.status || 'ACTIVE',
        }));
    }
    async getUsersByRole(role) {
        return this.userRepo.find({
            where: { role },
            order: { createdAt: 'DESC' },
        });
    }
    async banUser(id) {
        const user = await this.findById(id);
        if (user.role === user_entity_1.UserRole.ADMIN) {
            throw new common_1.BadRequestException('Cannot ban an Administrator');
        }
        return { message: `User ${user.username} has been banned successfully.` };
    }
    async unbanUser(id) {
        await this.findById(id);
        return { message: 'User has been unbanned.' };
    }
    async increaseBalance(userId, amount) {
        await this.findById(userId);
        await this.userRepo.increment({ id: userId }, 'coinBalance', amount);
        return this.findById(userId);
    }
    async decreaseBalance(userId, amount) {
        const user = await this.findById(userId);
        if (user.coinBalance < amount) {
            throw new common_1.BadRequestException('Insufficient balance');
        }
        await this.userRepo.decrement({ id: userId }, 'coinBalance', amount);
        return this.findById(userId);
    }
    async requestCreatorUpgrade(userId, fullName, idCardUrl, verificationVideoUrl) {
        const user = await this.findById(userId);
        if (user.role === user_entity_1.UserRole.CREATOR) {
            throw new common_1.BadRequestException('Already a Creator');
        }
        if (user.kycStatus === user_entity_1.KYCStatus.PENDING) {
            throw new common_1.BadRequestException('Already pending review');
        }
        Object.assign(user, {
            fullName,
            idCardUrl,
            verificationVideoUrl,
            kycStatus: user_entity_1.KYCStatus.PENDING,
        });
        await this.userRepo.save(user);
        return { message: 'Submitted for verification' };
    }
    async approveCreator(userId) {
        const user = await this.findById(userId);
        if (user.kycStatus !== user_entity_1.KYCStatus.PENDING) {
            throw new common_1.BadRequestException('Not pending approval');
        }
        user.role = user_entity_1.UserRole.CREATOR;
        user.kycStatus = user_entity_1.KYCStatus.APPROVED;
        return this.userRepo.save(user);
    }
    async updateProfile(userId, updates) {
        await this.userRepo.update(userId, updates);
        return this.findById(userId);
    }
    async updateAvatar(userId, avatarUrl) {
        await this.userRepo.update(userId, {
            avatarUrl: avatarUrl,
        });
        return this.findById(userId);
    }
    async getUserStats() {
        const users = await this.userRepo.find();
        return {
            totalUsers: users.length,
            fans: users.filter((u) => u.role === user_entity_1.UserRole.FAN).length,
            creators: users.filter((u) => u.role === user_entity_1.UserRole.CREATOR).length,
            pendingKyc: users.filter((u) => u.kycStatus === user_entity_1.KYCStatus.PENDING).length,
        };
    }
    async updateLastLoginIp(userId, ip) {
        await this.userRepo.update(userId, {
            lastLoginIp: ip,
        });
    }
    async getPendingKycCount() {
        return this.userRepo.count({
            where: { kycStatus: user_entity_1.KYCStatus.PENDING },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map