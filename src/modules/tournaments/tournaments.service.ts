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
  TournamentMatch, // Imported Entity
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

    @InjectRepository(TournamentMatch) // Injected Match Repo
    private readonly matchRepo: Repository<TournamentMatch>,

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

  // =========================
  // FIND BY ID
  // =========================
  async findById(id: string) {
    const tournament = await this.tournamentRepo.findOne({
      where: { id },
      relations: ['host', 'participants', 'participants.user'], 
    });

    if (!tournament) throw new NotFoundException('Tournament not found');

    const participants = tournament.participants.map(p => ({
      userId: p.userId,
      username: p.user?.username ?? 'Unknown User',
      avatarUrl: p.user?.avatarUrl ?? null,
      joinedAt: p.joinedAt,
    }));

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

    if (tournament.hostId === userId) {
      const existing = await this.participantRepo.findOne({ where: { tournamentId, userId } });
      if (!existing) {
        const participant = this.participantRepo.create({ tournamentId, userId });
        await this.participantRepo.save(participant);
      }
      return { success: true, newBalance: 'N/A (Host)', message: 'Welcome back, Host' };
    }

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

    user.coinBalance -= tournament.entryFeeCoins;
    await this.userRepo.save(user);

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

    const participant = this.participantRepo.create({ tournamentId, userId });
    await this.participantRepo.save(participant);

    return { message: 'Joined', newBalance: user.coinBalance };
  }

  // ==================================================
  // START TOURNAMENT (GENERATES BRACKET)
  // ==================================================
  async startTournament(tournamentId: string, userId: string) {
    const tournament = await this.tournamentRepo.findOne({ 
      where: { id: tournamentId },
      relations: ['participants'] 
    });

    if (!tournament) throw new NotFoundException('Tournament not found');
    if (tournament.hostId !== userId) throw new ForbiddenException('Only the host can start');
    if (tournament.status !== 'SCHEDULED') throw new BadRequestException('Tournament already started');
    if (tournament.participants.length !== tournament.maxParticipants) {
      throw new BadRequestException(`Tournament is not full. Need ${tournament.maxParticipants} players.`);
    }

    // 1. Update Status
    tournament.status = 'LIVE';
    await this.tournamentRepo.save(tournament);

    // 2. Generate Bracket
    await this._generateBracket(tournament);

    this.eventEmitter.emit('tournament_started', { 
      tournamentId: tournament.id, 
      title: tournament.title 
    });

    return { success: true, status: 'LIVE' };
  }

  // ==================================================
  // PRIVATE: GENERATE BRACKET LOGIC
  // ==================================================
  private async _generateBracket(tournament: Tournament) {
    // 1. Get all participant IDs
    const ids = tournament.participants.map(p => p.userId);
    
    // 2. Random Shuffle (Fisher-Yates)
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }

    // 3. Create Round 1 Matches
    const totalRounds = Math.log2(tournament.maxParticipants);
    const matchesToCreate = tournament.maxParticipants / 2;

    for (let i = 0; i < matchesToCreate; i++) {
      const match = this.matchRepo.create({
        tournamentId: tournament.id,
        round: 1,
        matchNumber: i + 1,
        player1Id: ids[i * 2],
        player2Id: ids[i * 2 + 1],
        status: 'PENDING',
      });
      await this.matchRepo.save(match);
    }

    // 4. Create placeholders for future rounds (To make frontend rendering easier)
    let currentMatchCount = matchesToCreate;
    for (let r = 2; r <= totalRounds; r++) {
      currentMatchCount = currentMatchCount / 2;
      for (let m = 0; m < currentMatchCount; m++) {
        const match = this.matchRepo.create({
          tournamentId: tournament.id,
          round: r,
          matchNumber: m + 1,
          // Players are null until previous round completes
          status: 'PENDING', 
        });
        await this.matchRepo.save(match);
      }
    }
  }

  // ==================================================
  // GET MATCHES (FOR BRACKET UI)
  // ==================================================
  async getMatches(tournamentId: string) {
    const matches = await this.matchRepo.find({
      where: { tournamentId },
      relations: ['player1', 'player2', 'winner'], // Eager load user data
      order: { round: 'ASC', matchNumber: 'ASC' },
    });

    // Map to safe display object
    return matches.map(m => ({
      id: m.id,
      round: m.round,
      matchNumber: m.matchNumber,
      status: m.status,
      score: m.score,
      player1: m.player1Id ? {
        id: m.player1Id,
        username: m.player1?.username ?? 'TBD',
        avatarUrl: m.player1?.avatarUrl,
      } : null,
      player2: m.player2Id ? {
        id: m.player2Id,
        username: m.player2?.username ?? 'TBD',
        avatarUrl: m.player2?.avatarUrl,
      } : null,
      winnerId: m.winnerId,
      winnerUsername: m.winner?.username,
    }));
  }

  // ==================================================
  // REPORT MATCH RESULT (LOGIC TO PROPAGATE WINNER)
  // ==================================================
  async reportMatchResult(matchId: string, winnerId: string, score: string, reporterId: string) {
    const match = await this.matchRepo.findOne({ 
      where: { id: matchId }, 
      relations: ['tournament', 'tournament.participants'] 
    });
    
    if (!match) throw new NotFoundException('Match not found');
    if (match.status === 'COMPLETED') throw new BadRequestException('Match already finished');

    // Security: Only Host or Players involved can report
    const isHost = match.tournament.hostId === reporterId;
    const isPlayer = (match.player1Id === reporterId || match.player2Id === reporterId);
    if (!isHost && !isPlayer) throw new ForbiddenException('Not authorized to report this match');

    // Validate winner is one of the players
    if (match.player1Id !== winnerId && match.player2Id !== winnerId) {
      throw new BadRequestException('Winner must be one of the players in the match');
    }

    // 1. Update Match
    match.winnerId = winnerId;
    match.score = score;
    match.status = 'COMPLETED';
    await this.matchRepo.save(match);

    // 2. Propagate Winner to Next Round
    await this._advanceWinner(match, winnerId);

    return { success: true };
  }

  // ==================================================
  // SET MATCH WINNER (HOST OVERRIDE)
  // ==================================================
  async setMatchWinner(matchId: string, winnerId: string, hostId: string) {
    const match = await this.matchRepo.findOne({ 
      where: { id: matchId }, 
      relations: ['tournament'] 
    });

    if (!match) throw new NotFoundException('Match not found');
    if (match.tournament.hostId !== hostId) throw new ForbiddenException('Only host can override');

    // Reuse logic
    return this.reportMatchResult(matchId, winnerId, 'Admin Decision', hostId);
  }

  // ==================================================
  // PRIVATE: ADVANCE WINNER TO NEXT ROUND
  // ==================================================
  private async _advanceWinner(finishedMatch: TournamentMatch, winnerId: string) {
    const tournament = finishedMatch.tournament;
    const nextRound = finishedMatch.round + 1;
    
    // Check if tournament is finished
    const totalRounds = Math.log2(tournament.maxParticipants);
    if (finishedMatch.round === totalRounds) {
      // This was the Final. End Tournament.
      await this.endTournament(tournament.id, tournament.hostId, winnerId);
      return;
    }

    // Determine next match number
    // Logic: Matches 1&2 feed into Match 1 of next round. Matches 3&4 feed into Match 2.
    const nextMatchNumber = Math.ceil(finishedMatch.matchNumber / 2);
    
    const nextMatch = await this.matchRepo.findOne({
      where: { tournamentId: tournament.id, round: nextRound, matchNumber: nextMatchNumber }
    });

    if (nextMatch) {
      // Determine if winner goes to Player 1 or Player 2 slot
      // Odd match numbers (1, 3, 5) feed into Player 1. Even (2, 4, 6) feed into Player 2.
      if (finishedMatch.matchNumber % 2 === 1) {
        nextMatch.player1Id = winnerId;
      } else {
        nextMatch.player2Id = winnerId;
      }
      
      // If both players are assigned, set status to PENDING (Ready to play)
      if (nextMatch.player1Id && nextMatch.player2Id) {
        nextMatch.status = 'PENDING';
      }
      
      await this.matchRepo.save(nextMatch);
    }
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
      const hostShare = Math.floor(pot * 0.10); 
      const platformFee = Math.floor(pot * 0.05);  
      const winnerShare = pot - hostShare - platformFee; 

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
}