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
exports.Group = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const group_member_entity_1 = require("./group-member.entity");
const group_message_entity_1 = require("./group-message.entity");
let Group = class Group {
};
exports.Group = Group;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Group.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Group.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Group.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'image_url', nullable: true }),
    __metadata("design:type", String)
], Group.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'profile_pic_url', nullable: true }),
    __metadata("design:type", String)
], Group.prototype, "profilePicUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'invite_link', unique: true, nullable: true }),
    __metadata("design:type", String)
], Group.prototype, "inviteLink", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lock_group', default: false }),
    __metadata("design:type", Boolean)
], Group.prototype, "lockGroup", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'disappearing_timer', default: 0 }),
    __metadata("design:type", Number)
], Group.prototype, "disappearingTimer", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'creator_id' }),
    __metadata("design:type", user_entity_1.User)
], Group.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'creator_id' }),
    __metadata("design:type", String)
], Group.prototype, "creatorId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Group.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => group_member_entity_1.GroupMember, (member) => member.group, { cascade: true }),
    __metadata("design:type", Array)
], Group.prototype, "members", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => group_message_entity_1.GroupMessage, (message) => message.group, { cascade: true }),
    __metadata("design:type", Array)
], Group.prototype, "messages", void 0);
exports.Group = Group = __decorate([
    (0, typeorm_1.Entity)('groups')
], Group);
//# sourceMappingURL=group.entity.js.map