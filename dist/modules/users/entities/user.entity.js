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
exports.User = exports.KYCStatus = exports.UserRole = void 0;
const typeorm_1 = require("typeorm");
var UserRole;
(function (UserRole) {
    UserRole["FAN"] = "FAN";
    UserRole["CREATOR"] = "CREATOR";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["COMMUNITY_LEAD"] = "COMMUNITY_LEAD";
})(UserRole || (exports.UserRole = UserRole = {}));
var KYCStatus;
(function (KYCStatus) {
    KYCStatus["NONE"] = "NONE";
    KYCStatus["PENDING"] = "PENDING";
    KYCStatus["APPROVED"] = "APPROVED";
    KYCStatus["REJECTED"] = "REJECTED";
})(KYCStatus || (exports.KYCStatus = KYCStatus = {}));
let User = class User {
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        unique: true,
    }),
    __metadata("design:type", String)
], User.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({
        unique: true,
    }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'password_hash',
    }),
    __metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: UserRole,
        default: UserRole.FAN,
    }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'avatar_url',
        nullable: true,
    }),
    __metadata("design:type", String)
], User.prototype, "avatarUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        nullable: true,
    }),
    __metadata("design:type", String)
], User.prototype, "bio", void 0);
__decorate([
    (0, typeorm_1.Column)({
        nullable: true,
    }),
    __metadata("design:type", String)
], User.prototype, "fullName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'id_card_url',
        nullable: true,
    }),
    __metadata("design:type", String)
], User.prototype, "idCardUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'verification_video_url',
        nullable: true,
    }),
    __metadata("design:type", String)
], User.prototype, "verificationVideoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: KYCStatus,
        default: KYCStatus.NONE,
    }),
    __metadata("design:type", String)
], User.prototype, "kycStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'followers_count',
        default: 0,
    }),
    __metadata("design:type", Number)
], User.prototype, "followersCount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'following_count',
        default: 0,
    }),
    __metadata("design:type", Number)
], User.prototype, "followingCount", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => User, (user) => user.following),
    __metadata("design:type", Array)
], User.prototype, "followers", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => User, (user) => user.followers),
    (0, typeorm_1.JoinTable)({
        name: 'user_follows',
        joinColumn: {
            name: 'followerId',
            referencedColumnName: 'id',
        },
        inverseJoinColumn: {
            name: 'followingId',
            referencedColumnName: 'id',
        },
    }),
    __metadata("design:type", Array)
], User.prototype, "following", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'coin_balance',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
    }),
    __metadata("design:type", Number)
], User.prototype, "coinBalance", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'last_login_ip',
        type: 'varchar',
        nullable: true,
    }),
    __metadata("design:type", String)
], User.prototype, "lastLoginIp", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        name: 'created_at',
    }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({
        name: 'updated_at',
    }),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
//# sourceMappingURL=user.entity.js.map