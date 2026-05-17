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

  @CreateDateColumn()
  joinedAt!: Date;
}