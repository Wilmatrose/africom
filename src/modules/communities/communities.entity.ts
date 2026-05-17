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

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: 0 })
  minCoinsToJoin: number;

  @Column({ nullable: true })
  imageUrl: string;

  @CreateDateColumn()
  createdAt: Date;

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
  mediaUrl: string; 

  @CreateDateColumn()
  createdAt: Date;

  // ==================================================
  // RELATION: REACTIONS
  // ==================================================
  @OneToMany(() => CommunityPostReaction, reaction => reaction.post)
  reactions: CommunityPostReaction[];
}

// ==================================================
// NEW ENTITY: REACTIONS
// ==================================================
@Entity('community_post_reactions')
export class CommunityPostReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  postId: string;

  @Column()
  userId: string;

  // Stores the emoji character, e.g., "❤️", "👍"
  @Column({ type: 'varchar', length: 10 })
  emoji: string;

  @CreateDateColumn()
  reactedAt: Date;

  // Relations
  @ManyToOne(() => CommunityPost, post => post.reactions)
  @JoinColumn({ name: 'postId' })
  post: CommunityPost;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}