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
exports.GroupMember = exports.GroupMemberRole = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const group_entity_1 = require("./group.entity");
var GroupMemberRole;
(function (GroupMemberRole) {
    GroupMemberRole["ADMIN"] = "ADMIN";
    GroupMemberRole["MEMBER"] = "MEMBER";
})(GroupMemberRole || (exports.GroupMemberRole = GroupMemberRole = {}));
let GroupMember = class GroupMember {
};
exports.GroupMember = GroupMember;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], GroupMember.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], GroupMember.prototype, "groupId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], GroupMember.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: GroupMemberRole, default: GroupMemberRole.MEMBER }),
    __metadata("design:type", String)
], GroupMember.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => group_entity_1.Group, group => group.members),
    (0, typeorm_1.JoinColumn)({ name: 'groupId' }),
    __metadata("design:type", group_entity_1.Group)
], GroupMember.prototype, "group", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], GroupMember.prototype, "user", void 0);
exports.GroupMember = GroupMember = __decorate([
    (0, typeorm_1.Entity)()
], GroupMember);
//# sourceMappingURL=group-member.entity.js.map