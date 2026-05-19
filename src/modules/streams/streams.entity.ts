import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/entities/user.entity'; 

@Entity('live_sessions')
export class LiveSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  creatorId: string;

  // UPDATED: Removed 'TIKTOK' from the enum
  @Column()
  platform: 'YOUTUBE' | 'TWITCH';

  // Stores the Video ID (YouTube) or Channel Name (Twitch)
  @Column({ type: 'text' })
  platformStreamId: string; 

  // The full URL pasted by the creator
  @Column({ type: 'text', nullable: true })
  streamUrl: string;

  @Column({ default: false })
  isLive: boolean;

  @Column({ nullable: true })
  title: string;

  @Column({ default: 0 })
  viewers: number;

  @CreateDateColumn()
  startedAt: Date;

  // Relation to fetch creator details (username, avatar) automatically
  @ManyToOne(() => User)
  @JoinColumn({ name: 'creatorId' })
  creator: User;
}