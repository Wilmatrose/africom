import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../users/entities/user.entity'; // Import User entity

@Entity('tournaments')
export class Tournament {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  hostId: string; 

  // RELATION: The host (User) who created the tournament
  @ManyToOne(() => User, { eager: false }) 
  @JoinColumn({ name: 'hostId' })
  host!: User;

  @Column()
  title: string; 

  @Column({ type: 'enum', enum: ['SCHEDULED', 'LIVE', 'FINISHED'], default: 'SCHEDULED' })
  status: string;

  @Column({ type: 'text', nullable: true })
  bracketImageUrl: string; 

  @Column({ default: 0 })
  entryFeeCoins: number; 

  // ✅ NEW: Maximum capacity for the tournament
  @Column({ default: 16 })
  maxParticipants: number;

  // RELATION: List of participants (for pot calculation)
  @OneToMany(() => TournamentParticipant, (participant) => participant.tournament)
  participants!: TournamentParticipant[];

  // NEW: Relation to Matches (Bracket)
  @OneToMany(() => TournamentMatch, (match) => match.tournament)
  matches!: TournamentMatch[];

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('group_messages')
export class GroupMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  groupId: string; // Can reference a Tournament ID or Community ID

  @Column()
  senderId: string;

  @Column()
  senderUsername: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  voiceNoteUrl: string;

  @Column({ default: false })
  isPinned: boolean; 

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('tournament_participants')
export class TournamentParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tournamentId!: string;

  @Column()
  userId!: string;

  // RELATION: Link back to Tournament
  @ManyToOne(() => Tournament, (tournament) => tournament.participants)
  @JoinColumn({ name: 'tournamentId' })
  tournament!: Tournament;

  // RELATION: Link to User
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  joinedAt!: Date;
}

// ==================================================
// NEW ENTITY: TOURNAMENT MATCHES (BRACKET LOGIC)
// ==================================================
@Entity('tournament_matches')
export class TournamentMatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tournamentId: string;

  @Column()
  round: number; // e.g., 1 for First Round, 2 for Semi-Finals, 3 for Finals

  @Column()
  matchNumber: number; // Order within the round (Match 1, Match 2...)

  @Column()
  player1Id: string;

  @Column({ nullable: true })
  player2Id: string; // Nullable in case of "Bye" or odd numbers (though we enforce even)

  @Column({ nullable: true })
  winnerId: string; // The ID of the user who won

  @Column({ nullable: true })
  score: string; // e.g., "2-1"

  @Column({ type: 'enum', enum: ['PENDING', 'LIVE', 'COMPLETED'], default: 'PENDING' })
  status: string;

  // RELATIONS
  @ManyToOne(() => Tournament, (tournament) => tournament.matches)
  @JoinColumn({ name: 'tournamentId' })
  tournament: Tournament;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'player1Id' })
  player1: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'player2Id' })
  player2: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'winnerId' })
  winner: User;
}

@Entity('tournament_reports')
export class TournamentReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reporterId: string; 

  @Column()
  tournamentId: string; 

  @Column()
  tournamentTitle: string;

  @Column()
  hostId: string;

  @Column()
  hostUsername: string;

  @Column({ type: 'text', nullable: true })
  reason: string; 

  @Column({ default: 'PENDING' })
  status: string; 

  @CreateDateColumn()
  createdAt: Date;
}