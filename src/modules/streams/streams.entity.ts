import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/entities/user.entity'; // Adjust path to your User entity

@Entity('live_sessions')
export class LiveSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  creatorId: string;

  // REMOVED: creatorName (We will get this from the User relation)
  // REMOVED: thumbnailUrl (We will get avatar from the User relation)

  @Column()
  platform: 'YOUTUBE' | 'TWITCH' | 'TIKTOK';

  // The clean ID extracted from the URL (e.g., "dQw4w9WgXcQ" or "emergency_gadgets")
  @Column()
  platformStreamId: string; 

  // NEW: The full URL pasted by the creator
  @Column({ nullable: true })
  streamUrl: string;

  @Column({ default: false })
  isLive: boolean;

  @Column({ nullable: true })
  title: string;

  @CreateDateColumn()
  startedAt: Date;

  // OPTIONAL: Relation to easily fetch user data (recommended)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'creatorId' })
  creator: User;
}