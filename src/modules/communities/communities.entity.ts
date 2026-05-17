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

  // Relation to Creator
  @ManyToOne(() => User, { onDelete: 'SET NULL' }) // If user is deleted, set creator to null
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

  // Relation to Posts
  // FIX: Added cascade: ['remove']. Deleting a Community will delete all its Posts.
  @OneToMany(() => CommunityPost, post => post.community, { cascade: ['remove'] })
  posts: CommunityPost[];

  // Relation to Participants
  // FIX: Added cascade: ['remove']. Deleting a Community will remove all Participants.
  @OneToMany(() => CommunityParticipant, participant => participant.community, { cascade: ['remove'] })
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

  // Relation to Community
  @ManyToOne(() => Community, community => community.participants, { onDelete: 'CASCADE' })
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

  // Relation to Community
  @ManyToOne(() => Community, community => community.posts, { onDelete: 'CASCADE' })
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

  // Relation to Reactions
  // FIX: Added cascade: ['remove']. Deleting a Post will delete all its Reactions.
  @OneToMany(() => CommunityPostReaction, reaction => reaction.post, { cascade: ['remove'] })
  reactions: CommunityPostReaction[];
}

// ==================================================
// ENTITY: REACTIONS
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

  // Relation to Post
  @ManyToOne(() => CommunityPost, post => post.reactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: CommunityPost;

  // Relation to User
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}