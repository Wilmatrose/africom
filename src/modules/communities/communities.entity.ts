import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  ManyToOne, 
  OneToMany, 
  JoinColumn 
} from 'typeorm';
import { User } from '../users/entities/user.entity';

@Entity('communities')
export class Community {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  creatorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creatorId' })
  creator!: User;

  @Column()
  name: string;

  // ==================================================
  // ADDED: Description Column
  // ==================================================
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: 0 })
  minCoinsToJoin: number;

  @Column({ nullable: true })
  imageUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  // ==================================================
  // ADDED: Relations for Posts and Participants
  // ==================================================
  @OneToMany(() => CommunityPost, post => post.community)
  posts: CommunityPost[];

  @OneToMany(() => CommunityParticipant, participant => participant.community)
  participants: CommunityParticipant[];
}

@Entity('community_participants')
export class CommunityParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  communityId!: string;

  @Column()
  userId!: string;

  // Added back-reference
  @ManyToOne(() => Community, community => community.participants)
  @JoinColumn({ name: 'communityId' })
  community: Community;

  @CreateDateColumn()
  joinedAt!: Date;
}

@Entity('community_posts')
export class CommunityPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  communityId: string;

  // Added back-reference
  @ManyToOne(() => Community, community => community.posts)
  @JoinColumn({ name: 'communityId' })
  community: Community;

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