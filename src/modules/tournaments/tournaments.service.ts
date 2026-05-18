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
  // CREATE (STRICT SIZE VALIDATION)
  // =========================
  async createTournament(
    hostId: string,
    title: string,
    file: Express.Multer.File,
    fee: number,
    maxParticipants?: number, 
  ) {
    // FIX: Enforce Power of 2 sizes (4, 8, 16, 32)
    const validSizes = [4, 8, 16, 32];
    const size = maxParticipants || 8;

    if (!validSizes.includes(size)) {
      throw new BadRequestException('Tournament size must be 4, 8, 16, or 32');
    }

    let bracketImageUrl: string | null = null;
    if (file) {
      bracketImageUrl = await this.filesService.uploadImage(file);
    }

    const tournament = this.tournamentRepo.create({
      hostId,
      title,
      bracketImageUrl: bracketImageUrl,
      entryFeeCoins: fee,
      maxParticipants: size,
      status: 'SCHEDULED',
    });

    return this.tournamentRepo.save(tournament);
  }

  // =========================
  // GET ALL
  // =========================
  async getTournaments() {
    const tournaments = await this.tournamentRepo.find({
      relations: ['host', 'participants'], 
      order: { createdAt: 'DESC' },
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

  // ==================================================
  // NEW: FIND BY ID (Secure Participant Data)
  // ==================================================
  async findById(id: string) {
    // 1. Fetch Tournament with relations
    // Note: 'participants.user' requires the User relation in TournamentParticipant entity
    const tournament = await this.tournamentRepo.findOne({
      where: { id },
      relations: ['host', 'participants', 'participants.user'], 
    });

    if (!tournament) throw new NotFoundException('Tournament not found');

    // 2. Map participants with Username/Avatar (Safe Display)
    const participants = tournament.participants.map(p => ({
      userId: p.userId,
      username: p.user?.username ?? 'Unknown User',
      avatarUrl: p.user?.avatarUrl ?? null,
      joinedAt: p.joinedAt,
    }));

    // 3. Inject Host into participants list if missing
    const isHostInList = participants.some(p => p.userId === tournament.hostId);

    if (!isHostInList && tournament.hostId) {
      participants.push({
        userId: tournament.hostId,
        username: tournament.host?.username ?? 'Host',
        avatarUrl: tournament.host?.avatarUrl ?? null,
        joinedAt: tournament.createdAt,
      });
    }

    return {
      id: tournament.id,
      title: tournament.title,
      status: tournament.status,
      entryFeeCoins: tournament.entryFeeCoins,
      maxParticipants: tournament.maxParticipants,
      createdAt: tournament.createdAt,
      hostId: tournament.hostId,
      creator: tournament.host ? {
        id: tournament.host.id,
        username: tournament.host.username,
        avatarUrl: tournament.host.avatarUrl,
      } : null,
      // Return the secure list
      participants: participants,
    };
  }

  // =========================
  // JOIN (LOCK WHEN FULL)
  // =========================
  async joinTournament(tournamentId: string, userId: string) {
    const tournament = await this.tournamentRepo.findOne({
      where: { id: tournamentId },
      relations: ['participants'], 
    });

    if (!tournament) throw new BadRequestException('Tournament not found');
    if (tournament.status !== 'SCHEDULED') throw new BadRequestException('Tournament already started');

    // CHECK 1: Is the user the Host? (Free Entry)
    if (tournament.hostId === userId) {
      const existing = await this.participantRepo.findOne({ where: { tournamentId, userId } });
      if (!existing) {
        const participant = this.participantRepo.create({ tournamentId, userId });
        await this.participantRepo.save(participant);
      }
      return { success: true, newBalance: 'N/A (Host)', message: 'Welcome back, Host' };
    }

    // CHECK 2: Capacity Lock
    if (tournament.participants.length >= tournament.maxParticipants) {
      throw new BadRequestException('Tournament is full. No slots left.');
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
  // START TOURNAMENT (MANUAL & STRICT)
  // =========================
  async startTournament(tournamentId: string, userId: string) {
    const tournament = await this.tournamentRepo.findOne({ 
      where: { id: tournamentId },
      relations: ['participants'] 
    });

    if (!tournament) throw new NotFoundException('Tournament not found');
    
    if (tournament.hostId !== userId) throw new ForbiddenException('Only the host can start');
    if (tournament.status !== 'SCHEDULED') throw new BadRequestException('Tournament cannot be started');

    // FIX: Enforce Full Capacity before Starting
    if (tournament.participants.length !== tournament.maxParticipants) {
      throw new BadRequestException(`Tournament is not full. Need ${tournament.maxParticipants} players, have ${tournament.participants.length}.`);
    }

    tournament.status = 'LIVE';
    await this.tournamentRepo.save(tournament);

    // TODO: Generate Bracket Matches here in future step

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
      relations: ['participants', 'host']
    });
    
    if (!tournament) throw new NotFoundException('Tournament not found');
    if (tournament.hostId !== userId) throw new ForbiddenException('Only the host can end');
    if (tournament.status === 'FINISHED') throw new BadRequestException('Already finished');

    const pot = tournament.entryFeeCoins * (tournament.participants?.length || 0);

    if (winnerId && pot > 0) {
      // 1. CALCULATE SPLITS (10% Host, 5% Platform, 85% Winner)
      const hostShare = Math.floor(pot * 0.10); 
      const platformFee = Math.floor(pot * 0.05);  
      const winnerShare = pot - hostShare - platformFee; 

      // 2. PAY HOST
      if (hostShare > 0) {
        tournament.host.coinBalance += hostShare;
        await this.userRepo.save(tournament.host);

        await this.transactionRepo.save({
          userId: tournament.host.id,
          amount: hostShare,
          type: TransactionType.CREDIT,
          category: TransactionCategory.TOURNAMENT_HOST_REWARD, 
          reference: `host-reward-${tournament.id}`,
          status: TransactionStatus.COMPLETED,
        });
      }

      // 3. LOG PLATFORM FEE
      if (platformFee > 0) {
        await this.transactionRepo.save({
          userId: 'SYSTEM', 
          amount: platformFee,
          type: TransactionType.CREDIT, 
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
  // SUBMIT REPORT
  // =========================
  async submitReport(
    tournamentId: string,
    reporterId: string,
    reason: string,
    tournamentData: any 
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
    return { success: true, message: 'Report submitted for review.' };
  }

  // =========================
  // CANCEL TOURNAMENT
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
  // KICK PARTICIPANT
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