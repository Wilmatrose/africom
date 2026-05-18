import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/entities/user.entity'; 

@Entity('live_sessions')
export class LiveSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  creatorId: string;

  @Column()
  platform: 'YOUTUBE' | 'TWITCH' | 'TIKTOK';

  // FIX: Changed to 'text' to accommodate full URLs for TikTok short links
  // Previously, this might have been a varchar(255) which could cut off long URLs.
  @Column({ type: 'text' })
  platformStreamId: string; 

  // The full URL pasted by the creator (useful for frontend if ID isn't enough)
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