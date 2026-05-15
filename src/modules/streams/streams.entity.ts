import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('live_sessions')
export class LiveSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  creatorId: string;

  @Column()
  creatorName: string;

  @Column()
  platform: 'YOUTUBE' | 'TWITCH' | 'TIKTOK';

  // We store the ID so the Mobile App can construct the deep link
  // e.g., for TikTok: "@username", for YouTube: "video_id"
  @Column()
  platformStreamId: string; 

  @Column({ default: false })
  isLive: boolean;

  @Column({ nullable: true })
  title: string;

  @CreateDateColumn()
  startedAt: Date;


@Column({ nullable: true })
thumbnailUrl: string;
}

