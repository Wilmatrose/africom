import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  Tournament,
  GroupMessage,
  TournamentParticipant,
} from './tournaments.entity';

import { User } from '../users/entities/user.entity';

import { 
  Transaction, 
  TransactionType, 
  TransactionCategory, 
  TransactionStatus 
} from '../wallet/wallet.entity';
import { FilesService } from '../../common/services/files.service'; // IMPORT CLOUDINARY SERVICE

@Injectable()
export class TournamentsService {
  constructor(
    @InjectRepository(Tournament)
    private readonly tournamentRepo: Repository<Tournament>,

    @InjectRepository(GroupMessage)
    private readonly messageRepo: Repository<GroupMessage>,

    @InjectRepository(TournamentParticipant)
    private readonly participantRepo: Repository<TournamentParticipant>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    
    private readonly eventEmitter: EventEmitter2,
    private readonly filesService: FilesService, // INJECT CLOUDINARY SERVICE
  ) {}

  // =========================
  // CREATE (WITH CLOUDINARY UPLOAD)
  // =========================
  async createTournament(
    hostId: string,
    title: string,
    file: Express.Multer.File, // Changed from bracketUrl string to File object
    fee: number,
  ) {
    let bracketImageUrl: string | null = null;

    // ✅ FIX: Upload to Cloudinary if file exists
    if (file) {
      bracketImageUrl = await this.filesService.uploadImage(file);
    }

    const tournament = this.tournamentRepo.create({
      hostId,
      title,
      bracketImageUrl: bracketImageUrl, // Save the Cloudinary URL
      entryFeeCoins: fee,
      status: 'SCHEDULED',
    });

    return this.tournamentRepo.save(tournament);
  }

  // =========================
  // GET ALL (ENRICHED WITH HOST DATA)
  // =========================
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

  // =========================
  // JOIN (PAYMENT LOGIC)
  // =========================
  async joinTournament(tournamentId: string, userId: string) {
    const tournament = await this.tournamentRepo.findOne({
      where: { id: tournamentId },
    });

    if (!tournament) throw new BadRequestException('Tournament not found');
    if (tournament.status !== 'SCHEDULED') throw new BadRequestException('Tournament already started');

    const existingParticipant = await this.participantRepo.findOne({
      where: { tournamentId, userId },
    });

    if (existingParticipant) return { message: 'Already joined' };

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    if (user.coinBalance < tournament.entryFeeCoins) {
      throw new BadRequestException('Insufficient Coins');
    }

    // 1. Deduct coins
    user.coinBalance -= tournament.entryFeeCoins;
    await this.userRepo.save(user);

    // 2. Log transaction
    const tx = this.transactionRepo.create({
      userId: user.id,
      amount: tournament.entryFeeCoins,
      type: TransactionType.DEBIT,
      category: TransactionCategory.TOURNAMENT_JOIN,
      reference: `tournament-${tournament.id}`,
      metadata: { tournamentName: tournament.title },
      status: TransactionStatus.COMPLETED,
    });
    await this.transactionRepo.save(tx);

    // 3. Create participant
    const participant = this.participantRepo.create({ tournamentId, userId });
    await this.participantRepo.save(participant);

    return { message: 'Joined', newBalance: user.coinBalance };
  }

  // =========================
  // START TOURNAMENT (HOST ONLY)
  // =========================
  async startTournament(tournamentId: string, userId: string) {
    const tournament = await this.tournamentRepo.findOne({ where: { id: tournamentId } });
    if (!tournament) throw new NotFoundException('Tournament not found');
    
    if (tournament.hostId !== userId) throw new ForbiddenException('Only the host can start');
    if (tournament.status !== 'SCHEDULED') throw new BadRequestException('Tournament cannot be started');

    tournament.status = 'LIVE';
    await this.tournamentRepo.save(tournament);

    // Emit event for Push Notifications
    this.eventEmitter.emit('tournament_started', { 
      tournamentId: tournament.id, 
      title: tournament.title 
    });

    return { success: true, status: 'LIVE' };
  }

  // =========================
  // END TOURNAMENT & PAYOUT
  // =========================
  async endTournament(tournamentId: string, userId: string, winnerId?: string) {
    const tournament = await this.tournamentRepo.findOne({ 
      where: { id: tournamentId },
      relations: ['participants']
    });
    
    if (!tournament) throw new NotFoundException('Tournament not found');
    if (tournament.hostId !== userId) throw new ForbiddenException('Only the host can end');
    if (tournament.status === 'FINISHED') throw new BadRequestException('Already finished');

    // 1. Calculate Pot
    const pot = tournament.entryFeeCoins * (tournament.participants?.length || 0);

    // 2. Distribute Winnings
    if (winnerId && pot > 0) {
      const winner = await this.userRepo.findOne({ where: { id: winnerId } });
      if (winner) {
        winner.coinBalance += pot;
        await this.userRepo.save(winner);

        // Log Winning Transaction
        const tx = this.transactionRepo.create({
          userId: winner.id,
          amount: pot,
          type: TransactionType.CREDIT,
          category: TransactionCategory.TOURNAMENT_WIN,
          reference: `win-${tournament.id}`,
          status: TransactionStatus.COMPLETED,
        });
        await this.transactionRepo.save(tx);
      }
    }

    // 3. Update Status
    tournament.status = 'FINISHED';
    await this.tournamentRepo.save(tournament);

    this.eventEmitter.emit('tournament_ended', { tournamentId: tournament.id });

    return { success: true, winnerBalance: pot };
  }

  // =========================
  // CHAT SYSTEM
  // =========================
  async sendMessage(
    groupId: string,
    senderId: string,
    username: string,
    content: string,
  ) {
    const tournament = await this.tournamentRepo.findOne({ where: { id: groupId } });
    if (!tournament) throw new BadRequestException('Tournament not found');

    if (tournament.hostId !== senderId) {
      const participant = await this.participantRepo.findOne({
        where: { tournamentId: groupId, userId: senderId },
      });
      if (!participant) throw new ForbiddenException('Payment required');
    }

    const message = this.messageRepo.create({
      groupId,
      senderId,
      senderUsername: username,
      content,
      isPinned: false,
    });

    const savedMessage = await this.messageRepo.save(message);
    
    // Emit to Socket
    this.eventEmitter.emit('tournament_message', savedMessage);
    
    return savedMessage;
  }

  async getMessages(groupId: string) {
    return this.messageRepo.find({
      where: { groupId },
      order: { createdAt: 'ASC' },
    });
  }
}