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
exports.CommunitiesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const communities_entity_1 = require("./communities.entity");
const user_entity_1 = require("../users/entities/user.entity");
const wallet_entity_1 = require("../wallet/wallet.entity");
let CommunitiesService = class CommunitiesService {
    constructor(communityRepo, postRepo, participantRepo, userRepo, transactionRepo) {
        this.communityRepo = communityRepo;
        this.postRepo = postRepo;
        this.participantRepo = participantRepo;
        this.userRepo = userRepo;
        this.transactionRepo = transactionRepo;
    }
    async createCommunity(creatorId, name, minCoins) {
        const community = this.communityRepo.create({
            creatorId,
            name,
            minCoinsToJoin: minCoins,
        });
        return this.communityRepo.save(community);
    }
    async getAllCommunities() {
        const communities = await this.communityRepo.find({
            relations: ['creator'],
            order: { createdAt: 'DESC' },
        });
        return communities.map(c => ({
            id: c.id,
            name: c.name,
            minCoinsToJoin: c.minCoinsToJoin,
            imageUrl: c.imageUrl,
            createdAt: c.createdAt,
            creator: c.creator ? {
                id: c.creator.id,
                username: c.creator.username,
                avatarUrl: c.creator.avatarUrl,
            } : null,
        }));
    }
    async findById(id) {
        const community = await this.communityRepo.findOne({
            where: { id },
            relations: ['creator'],
        });
        if (!community) {
            throw new common_1.NotFoundException('Community not found');
        }
        return {
            id: community.id,
            name: community.name,
            minCoinsToJoin: community.minCoinsToJoin,
            imageUrl: community.imageUrl,
            createdAt: community.createdAt,
            creator: community.creator ? {
                id: community.creator.id,
                username: community.creator.username,
                avatarUrl: community.creator.avatarUrl,
            } : null,
        };
    }
    async joinCommunity(communityId, userId) {
        const community = await this.communityRepo.findOne({ where: { id: communityId } });
        if (!community)
            throw new common_1.BadRequestException('Community not found');
        const existing = await this.participantRepo.findOne({ where: { communityId, userId } });
        if (existing)
            return { message: 'Already a member' };
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        if (user.coinBalance < community.minCoinsToJoin) {
            throw new common_1.BadRequestException(`Need ${community.minCoinsToJoin} coins to join`);
        }
        user.coinBalance -= community.minCoinsToJoin;
        await this.userRepo.save(user);
        const tx = this.transactionRepo.create({
            userId: user.id,
            amount: community.minCoinsToJoin,
            type: wallet_entity_1.TransactionType.DEBIT,
            category: wallet_entity_1.TransactionCategory.COMMUNITY_JOIN,
            reference: `community-${community.id}`,
            metadata: { communityName: community.name },
            status: wallet_entity_1.TransactionStatus.COMPLETED,
        });
        await this.transactionRepo.save(tx);
        const participant = this.participantRepo.create({ communityId, userId });
        await this.participantRepo.save(participant);
        return { success: true, newBalance: user.coinBalance };
    }
    async createPost(communityId, authorId, authorName, text, voiceUrl) {
        const community = await this.communityRepo.findOne({ where: { id: communityId } });
        if (!community)
            throw new common_1.BadRequestException('Community not found');
        if (community.creatorId !== authorId) {
            const isMember = await this.participantRepo.findOne({
                where: { communityId, userId: authorId }
            });
            if (!isMember)
                throw new common_1.ForbiddenException('Must join community to post');
        }
        const post = this.postRepo.create({
            communityId,
            authorId,
            authorName,
            textContent: text,
            voiceNoteUrl: voiceUrl,
        });
        return this.postRepo.save(post);
    }
    async getPosts(communityId) {
        return this.postRepo.find({
            where: { communityId },
            order: { createdAt: 'DESC' }
        });
    }
};
exports.CommunitiesService = CommunitiesService;
exports.CommunitiesService = CommunitiesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(communities_entity_1.Community)),
    __param(1, (0, typeorm_1.InjectRepository)(communities_entity_1.CommunityPost)),
    __param(2, (0, typeorm_1.InjectRepository)(communities_entity_1.CommunityParticipant)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(4, (0, typeorm_1.InjectRepository)(wallet_entity_1.Transaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CommunitiesService);
//# sourceMappingURL=communities.service.js.map