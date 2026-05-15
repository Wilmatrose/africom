import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/entities/user.entity'; // Import User entity

@Entity('communities')
export class Community {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  creatorId: string;

  // RELATION: The user who created the community
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'creatorId' })
  creator!: User;

  @Column()
  name: string; 

  @Column({ default: 0 })
  minCoinsToJoin: number; 

  @Column({ nullable: true })
  imageUrl: string; // Added for community icons

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('community_participants')
export class CommunityParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  communityId!: string;

  @Column()
  userId!: string;

  @CreateDateColumn()
  joinedAt!: Date;
}

@Entity('community_posts')
export class CommunityPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  communityId: string;

  @Column()
  authorId: string;

  @Column()
  authorName: string;

  @Column({ type: 'text', nullable: true })
  textContent: string;

  @Column({ nullable: true })
  voiceNoteUrl: string; 

  @CreateDateColumn()
  createdAt: Date;
}