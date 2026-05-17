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
  TournamentReport,
} from './tournaments.entity';

import { User } from '../users/entities/user.entity';

import { 
  Transaction, 
  TransactionType, 
  TransactionCategory, 
  TransactionStatus 
} from '../wallet/wallet.entity';
import { FilesService } from '../../common/services/files.service'; 

@Injectable()
export class TournamentsService {
  constructor(
    @InjectRepository(Tournament)
    private readonly tournamentRepo: Repository<Tournament>,

    @InjectRepository(GroupMessage)
    private readonly messageRepo: Repository<GroupMessage>,

    @InjectRepository(TournamentParticipant)
    private readonly participantRepo: Repository<TournamentParticipant>,

    @InjectRepository(TournamentReport)
    private readonly reportRepo: Repository<TournamentReport>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    
    private readonly eventEmitter: EventEmitter2,
    private readonly filesService: FilesService, 
  ) {}

  // =========================
  // CREATE (WITH CLOUDINARY UPLOAD)
  // =========================
  async createTournament(
    hostId: string,
    title: string,
    file: Express.Multer.File,
    fee: number,
    maxParticipants?: number, 
  ) {
    let bracketImageUrl: string | null = null;

    if (file) {
      bracketImageUrl = await this.filesService.uploadImage(file);
    }

    const tournament = this.tournamentRepo.create({
      hostId,
      title,
      bracketImageUrl: bracketImageUrl,
      entryFeeCoins: fee,
      maxParticipants: maxParticipants || 16,
      status: 'SCHEDULED',
    });

    return this.tournamentRepo.save(tournament);
  }

  // =========================
  // GET ALL (ENRICHED WITH HOST DATA)
  // =========================
  async getTournaments() {
    const tournaments = await this.tournamentRepo.find({
      relations: ['host', 'participants'], 
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
      maxParticipants: t.maxParticipants,
      currentParticipants: t.participants?.length || 0,
      createdAt: t.createdAt,
      creator: t.host ? {
        id: t.host.id,
        username: t.host.username,
        avatarUrl: t.host.avatarUrl,
      } : null,
    }));
  }

  // =========================
  // JOIN (PAYMENT LOGIC + CAPACITY CHECK)
  // =========================
  async joinTournament(tournamentId: string, userId: string) {
    const tournament = await this.tournamentRepo.findOne({
      where: { id: tournamentId },
      relations: ['participants'], 
    });

    if (!tournament) throw new BadRequestException('Tournament not found');
    if (tournament.status !== 'SCHEDULED') throw new BadRequestException('Tournament already started');

    // Check Capacity
    if (tournament.participants.length >= tournament.maxParticipants) {
      throw new BadRequestException('Tournament is full');
    }

    const existingParticipant = await this.participantRepo.findOne({
      where: { tournamentId, userId },
    });

    if (existingParticipant) return { message: 'Already joined' };

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    if (user.coinBalance < tournament.entryFeeCoins) {
      throw new BadRequestException('Insufficient Funds');
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
      reference: `tournament-join-${tournament.id}`,
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

    this.eventEmitter.emit('tournament_started', { 
      tournamentId: tournament.id, 
      title: tournament.title 
    });

    return { success: true, status: 'LIVE' };
  }

  // =========================
  // END TOURNAMENT & PAYOUT (10% HOST, 5% PLATFORM, 85% WINNER)
  // =========================
  async endTournament(tournamentId: string, userId: string, winnerId?: string) {
    const tournament = await this.tournamentRepo.findOne({ 
      where: { id: tournamentId },
      relations: ['participants', 'host']
    });
    
    if (!tournament) throw new NotFoundException('Tournament not found');
    if (tournament.hostId !== userId) throw new ForbiddenException('Only the host can end');
    if (tournament.status === 'FINISHED') throw new BadRequestException('Already finished');

    const pot = tournament.entryFeeCoins * (tournament.participants?.length || 0);

    if (winnerId && pot > 0) {
      // 1. CALCULATE SPLITS
      const hostShare = Math.floor(pot * 0.10); // 10%
      const platformFee = Math.floor(pot * 0.05);  // 5%
      const winnerShare = pot - hostShare - platformFee; // Remainder (85%)

      // 2. PAY HOST
      if (hostShare > 0) {
        tournament.host.coinBalance += hostShare;
        await this.userRepo.save(tournament.host);

        await this.transactionRepo.save({
          userId: tournament.host.id,
          amount: hostShare,
          type: TransactionType.CREDIT,
          category: TransactionCategory.TOURNAMENT_HOST_REWARD, // New category or use generic
          reference: `host-reward-${tournament.id}`,
          status: TransactionStatus.COMPLETED,
        });
      }

      // 3. LOG PLATFORM FEE (System Transaction)
      if (platformFee > 0) {
        // We log this to a system user or just keep a record. 
        // For now, we'll log it with userId: 'SYSTEM' or similar if you have one, 
        // otherwise we just log the transaction without a user ID (adjust entity if needed).
        // Assuming we want to track it, let's create a transaction with the Host ID as reference for accounting.
        await this.transactionRepo.save({
          userId: 'SYSTEM', // Or a specific platform admin ID
          amount: platformFee,
          type: TransactionType.CREDIT, // Platform revenue
          category: TransactionCategory.PLATFORM_FEE,
          reference: `platform-fee-${tournament.id}`,
          status: TransactionStatus.COMPLETED,
        });
      }

      // 4. PAY WINNER
      const winner = await this.userRepo.findOne({ where: { id: winnerId } });
      if (winner) {
        winner.coinBalance += winnerShare;
        await this.userRepo.save(winner);

        await this.transactionRepo.save({
          userId: winner.id,
          amount: winnerShare,
          type: TransactionType.CREDIT,
          category: TransactionCategory.TOURNAMENT_WIN,
          reference: `win-${tournament.id}`,
          status: TransactionStatus.COMPLETED,
        });
      }
    }

    tournament.status = 'FINISHED';
    await this.tournamentRepo.save(tournament);

    this.eventEmitter.emit('tournament_ended', { tournamentId: tournament.id });

    return { success: true, winnerBalance: pot };
  }

  // =========================
  // SUBMIT REPORT (FRAUD / ABUSE)
  // =========================
  async submitReport(
    tournamentId: string,
    reporterId: string,
    reason: string,
    tournamentData: any // Snapshot data passed from controller
  ) {
    const report = this.reportRepo.create({
      reporterId,
      tournamentId,
      tournamentTitle: tournamentData.title,
      hostId: tournamentData.hostId,
      hostUsername: tournamentData.hostUsername,
      reason,
      status: 'PENDING',
    });

    await this.reportRepo.save(report);
    
    // Ideally, emit an event for Admin Dashboard to show a new notification
    // this.eventEmitter.emit('new_report', report);
    
    return { success: true, message: 'Report submitted for review.' };
  }

  // =========================
  // CANCEL TOURNAMENT (HOST ONLY, REFUND ALL)
  // =========================
  async cancelTournament(tournamentId: string, userId: string) {
    const tournament = await this.tournamentRepo.findOne({ 
      where: { id: tournamentId },
      relations: ['participants']
    });

    if (!tournament) throw new NotFoundException('Tournament not found');
    if (tournament.hostId !== userId) throw new ForbiddenException('Only the host can cancel');
    if (tournament.status !== 'SCHEDULED') throw new BadRequestException('Can only cancel scheduled tournaments');

    for (const participant of tournament.participants) {
      const user = await this.userRepo.findOne({ where: { id: participant.userId } });
      if (user) {
        user.coinBalance += tournament.entryFeeCoins;
        await this.userRepo.save(user);

        await this.transactionRepo.save({
          userId: user.id,
          amount: tournament.entryFeeCoins,
          type: TransactionType.CREDIT,
          category: TransactionCategory.TOURNAMENT_REFUND,
          reference: `cancel-${tournament.id}`,
          status: TransactionStatus.COMPLETED,
        });
      }
    }

    await this.participantRepo.delete({ tournamentId });
    await this.tournamentRepo.delete(tournamentId);

    this.eventEmitter.emit('tournament_cancelled', { tournamentId });

    return { success: true };
  }

  // =========================
  // KICK PARTICIPANT (HOST ONLY, REFUND ONE)
  // =========================
  async kickParticipant(tournamentId: string, targetUserId: string, hostId: string) {
    const tournament = await this.tournamentRepo.findOne({
      where: { id: tournamentId },
      relations: ['participants']
    });

    if (!tournament) throw new NotFoundException('Tournament not found');
    if (tournament.hostId !== hostId) throw new ForbiddenException('Only the host can kick');
    if (tournament.status !== 'SCHEDULED') throw new BadRequestException('Can only kick scheduled tournaments');

    const participant = tournament.participants.find(p => p.userId === targetUserId);
    if (!participant) throw new NotFoundException('Participant not found');

    const user = await this.userRepo.findOne({ where: { id: targetUserId } });
    if (user) {
      user.coinBalance += tournament.entryFeeCoins;
      await this.userRepo.save(user);

      await this.transactionRepo.save({
        userId: user.id,
        amount: tournament.entryFeeCoins,
        type: TransactionType.CREDIT,
        category: TransactionCategory.TOURNAMENT_REFUND,
        reference: `kick-${tournament.id}`,
        status: TransactionStatus.COMPLETED,
      });
    }

    await this.participantRepo.remove(participant);

    this.eventEmitter.emit('tournament_user_kicked', { tournamentId, userId: targetUserId });

    return { success: true };
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
    
    this.eventEmitter.emit('tournament_message', savedMessage);
    
    return savedMessage;
  }

  async getMessages(groupId: string, currentUserId: string) {
    // Security Check
    const tournament = await this.tournamentRepo.findOne({ where: { id: groupId } });
    if (!tournament) throw new BadRequestException('Tournament not found');

    if (tournament.hostId !== currentUserId) {
      const isParticipant = await this.participantRepo.exists({
        where: { tournamentId: groupId, userId: currentUserId },
      });
      
      if (!isParticipant) {
        throw new ForbiddenException('Access Denied: Join tournament to view chat.');
      }
    }

    return this.messageRepo.find({
      where: { groupId },
      order: { createdAt: 'ASC' },
    });
  }
}