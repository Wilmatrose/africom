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
exports.TournamentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const tournaments_entity_1 = require("./tournaments.entity");
const user_entity_1 = require("../users/entities/user.entity");
const wallet_entity_1 = require("../wallet/wallet.entity");
let TournamentsService = class TournamentsService {
    constructor(tournamentRepo, messageRepo, participantRepo, userRepo, transactionRepo, eventEmitter) {
        this.tournamentRepo = tournamentRepo;
        this.messageRepo = messageRepo;
        this.participantRepo = participantRepo;
        this.userRepo = userRepo;
        this.transactionRepo = transactionRepo;
        this.eventEmitter = eventEmitter;
    }
    async createTournament(hostId, title, bracketUrl, fee) {
        const tournament = this.tournamentRepo.create({
            hostId,
            title,
            bracketImageUrl: bracketUrl,
            entryFeeCoins: fee,
            status: 'SCHEDULED',
        });
        return this.tournamentRepo.save(tournament);
    }
    async getTournaments() {
        const tournaments = await this.tournamentRepo.find({
            relations: ['host'],
            order: {
                createdAt: 'DESC',
            },
        });
        return tournaments.map(t => ({
            id: t.id,
            title: t.title,
            status: t.status,
            entryFeeCoins: t.entryFeeCoins,
            bracketImageUrl: t.bracketImageUrl,
            createdAt: t.createdAt,
            creator: t.host ? {
                id: t.host.id,
                username: t.host.username,
                avatarUrl: t.host.avatarUrl,
            } : null,
        }));
    }
    async joinTournament(tournamentId, userId) {
        const tournament = await this.tournamentRepo.findOne({
            where: { id: tournamentId },
        });
        if (!tournament)
            throw new common_1.BadRequestException('Tournament not found');
        if (tournament.status !== 'SCHEDULED')
            throw new common_1.BadRequestException('Tournament already started');
        const existingParticipant = await this.participantRepo.findOne({
            where: { tournamentId, userId },
        });
        if (existingParticipant)
            return { message: 'Already joined' };
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        if (user.coinBalance < tournament.entryFeeCoins) {
            throw new common_1.BadRequestException('Insufficient Coins');
        }
        user.coinBalance -= tournament.entryFeeCoins;
        await this.userRepo.save(user);
        const tx = this.transactionRepo.create({
            userId: user.id,
            amount: tournament.entryFeeCoins,
            type: wallet_entity_1.TransactionType.DEBIT,
            category: wallet_entity_1.TransactionCategory.TOURNAMENT_JOIN,
            reference: `tournament-${tournament.id}`,
            metadata: { tournamentName: tournament.title },
            status: wallet_entity_1.TransactionStatus.COMPLETED,
        });
        await this.transactionRepo.save(tx);
        const participant = this.participantRepo.create({ tournamentId, userId });
        await this.participantRepo.save(participant);
        return { message: 'Joined', newBalance: user.coinBalance };
    }
    async startTournament(tournamentId, userId) {
        const tournament = await this.tournamentRepo.findOne({ where: { id: tournamentId } });
        if (!tournament)
            throw new common_1.NotFoundException('Tournament not found');
        if (tournament.hostId !== userId)
            throw new common_1.ForbiddenException('Only the host can start');
        if (tournament.status !== 'SCHEDULED')
            throw new common_1.BadRequestException('Tournament cannot be started');
        tournament.status = 'LIVE';
        await this.tournamentRepo.save(tournament);
        this.eventEmitter.emit('tournament_started', {
            tournamentId: tournament.id,
            title: tournament.title
        });
        return { success: true, status: 'LIVE' };
    }
    async endTournament(tournamentId, userId, winnerId) {
        const tournament = await this.tournamentRepo.findOne({
            where: { id: tournamentId },
            relations: ['participants']
        });
        if (!tournament)
            throw new common_1.NotFoundException('Tournament not found');
        if (tournament.hostId !== userId)
            throw new common_1.ForbiddenException('Only the host can end');
        if (tournament.status === 'FINISHED')
            throw new common_1.BadRequestException('Already finished');
        const pot = tournament.entryFeeCoins * (tournament.participants?.length || 0);
        if (winnerId && pot > 0) {
            const winner = await this.userRepo.findOne({ where: { id: winnerId } });
            if (winner) {
                winner.coinBalance += pot;
                await this.userRepo.save(winner);
                const tx = this.transactionRepo.create({
                    userId: winner.id,
                    amount: pot,
                    type: wallet_entity_1.TransactionType.CREDIT,
                    category: wallet_entity_1.TransactionCategory.TOURNAMENT_WIN,
                    reference: `win-${tournament.id}`,
                    status: wallet_entity_1.TransactionStatus.COMPLETED,
                });
                await this.transactionRepo.save(tx);
            }
        }
        tournament.status = 'FINISHED';
        await this.tournamentRepo.save(tournament);
        this.eventEmitter.emit('tournament_ended', { tournamentId: tournament.id });
        return { success: true, winnerBalance: pot };
    }
    async sendMessage(groupId, senderId, username, content) {
        const tournament = await this.tournamentRepo.findOne({ where: { id: groupId } });
        if (!tournament)
            throw new common_1.BadRequestException('Tournament not found');
        if (tournament.hostId !== senderId) {
            const participant = await this.participantRepo.findOne({
                where: { tournamentId: groupId, userId: senderId },
            });
            if (!participant)
                throw new common_1.ForbiddenException('Payment required');
        }
        const message = this.messageRepo.create({
            groupId,
            senderId,
            senderUsername: username,
            content,
            isPinned: false,
        });
        const savedMessage = await this.messageRepo.save(message);
        this.eventEmitter.emit('tournament_message', savedMessage);
        return savedMessage;
    }
    async getMessages(groupId) {
        return this.messageRepo.find({
            where: { groupId },
            order: { createdAt: 'ASC' },
        });
    }
};
exports.TournamentsService = TournamentsService;
exports.TournamentsService = TournamentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tournaments_entity_1.Tournament)),
    __param(1, (0, typeorm_1.InjectRepository)(tournaments_entity_1.GroupMessage)),
    __param(2, (0, typeorm_1.InjectRepository)(tournaments_entity_1.TournamentParticipant)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(4, (0, typeorm_1.InjectRepository)(wallet_entity_1.Transaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        event_emitter_1.EventEmitter2])
], TournamentsService);
//# sourceMappingURL=tournaments.service.js.map