import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Community, CommunityPost, CommunityParticipant, CommunityPostReaction } from './communities.entity';
import { User } from '../users/entities/user.entity';
import { 
  Transaction, 
  TransactionType, 
  TransactionCategory, 
  TransactionStatus 
} from '../wallet/wallet.entity';
import { FilesService } from '../../common/services/files.service';

@Injectable()
export class CommunitiesService {
  constructor(
    @InjectRepository(Community)
    private communityRepo: Repository<Community>,
    @InjectRepository(CommunityPost)
    private postRepo: Repository<CommunityPost>,
    @InjectRepository(CommunityParticipant)
    private participantRepo: Repository<CommunityParticipant>,
    @InjectRepository(CommunityPostReaction)
    private reactionRepo: Repository<CommunityPostReaction>, // <--- INJECT REACTION REPO
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    private readonly filesService: FilesService,
  ) {}

  // ==================================================
  // CREATE COMMUNITY
  // ==================================================
  async createCommunity(
    creatorId: string, 
    name: string, 
    minCoins: number,
    description?: string,
    file?: Express.Multer.File 
  ) {
    if (!name || name.trim() === '') {
      throw new BadRequestException('Community name is required');
    }

    let imageUrl: string | undefined;

    if (file) {
      imageUrl = await this.filesService.uploadImage(file);
    }

    const community = this.communityRepo.create({
      creatorId,
      name: name.trim(),
      description: description ? description.trim() : undefined,
      minCoinsToJoin: minCoins,
      imageUrl: imageUrl,
    });
    
    return this.communityRepo.save(community);
  }

  // ==================================================
  // GET ALL
  // ==================================================
  async getAllCommunities() {
    const communities = await this.communityRepo.find({
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });

    return communities.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      minCoinsToJoin: c.minCoinsToJoin,
      imageUrl: c.imageUrl,
      createdAt: c.createdAt,
      creator: c.creator ? {
        id: c.creator.id,
        username: c.creator.username,
        avatarUrl: c.creator.avatarUrl,
      } : null,
    }));
  }

  // ==================================================
  // FIND BY ID
  // ==================================================
  async findById(id: string) {
    const community = await this.communityRepo.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!community) throw new NotFoundException('Community not found');

    return {
      id: community.id,
      name: community.name,
      description: community.description,
      minCoinsToJoin: community.minCoinsToJoin,
      imageUrl: community.imageUrl,
      createdAt: community.createdAt,
      creator: community.creator ? {
        id: community.creator.id,
        username: community.creator.username,
        avatarUrl: community.creator.avatarUrl,
      } : null,
    };
  }

   // ==================================================
  // JOIN COMMUNITY (FIXED)
  // ==================================================
  async joinCommunity(communityId: string, userId: string) {
    const community = await this.communityRepo.findOne({ where: { id: communityId } });
    if (!community) throw new BadRequestException('Community not found');

    // CHECK 1: Is the user the Creator?
    // Creators do not need to pay to join their own community.
    if (community.creatorId === userId) {
      console.log(`User ${userId} is the creator. Allowing free access.`);
      
      // Check if they are already in the participant list (soft join)
      const existing = await this.participantRepo.findOne({ where: { communityId, userId } });
      if (!existing) {
        const participant = this.participantRepo.create({ communityId, userId });
        await this.participantRepo.save(participant);
      }
      
      return { success: true, newBalance: 'N/A (Creator)', message: 'Welcome back, Creator' };
    }

    // CHECK 2: Is the user already a member?
    const existing = await this.participantRepo.findOne({ where: { communityId, userId } });
    if (existing) {
      console.log(`User ${userId} is already a member.`);
      return { message: 'Already a member' };
    }

    // CHECK 3: Fetch User
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    // CHECK 4: Validate Payment
    // LOG THIS TO YOUR CONSOLE TO SEE THE VALUES
    console.log(`Join Attempt: User Balance [${user.coinBalance}] vs Fee [${community.minCoinsToJoin}]`);

    if (user.coinBalance < community.minCoinsToJoin) {
      throw new BadRequestException(`Insufficient coins. Need ${community.minCoinsToJoin}, you have ${user.coinBalance}`);
    }

    // DEDUCT COINS
    user.coinBalance -= community.minCoinsToJoin;
    await this.userRepo.save(user);

    // LOG TRANSACTION
    const tx = this.transactionRepo.create({
      userId: user.id,
      amount: community.minCoinsToJoin,
      type: TransactionType.DEBIT,
      category: TransactionCategory.COMMUNITY_JOIN,
      reference: `community-${community.id}`,
      metadata: { communityName: community.name },
      status: TransactionStatus.COMPLETED,
    });
    await this.transactionRepo.save(tx);

    // CREATE PARTICIPANT
    const participant = this.participantRepo.create({ communityId, userId });
    await this.participantRepo.save(participant);

    return { success: true, newBalance: user.coinBalance };
  }

  // ==================================================
  // CREATE POST (CREATOR ONLY + MEDIA SUPPORT)
  // ==================================================
  async createPost(
    communityId: string, 
    authorId: string, 
    authorName: string, 
    text: string,
    file?: Express.Multer.File
  ) {
    const community = await this.communityRepo.findOne({ where: { id: communityId } });
    if (!community) throw new BadRequestException('Community not found');

    if (community.creatorId !== authorId) {
      throw new ForbiddenException('Only the community creator can post.');
    }

    let mediaUrl: string | undefined;

    if (file) {
      if (file.mimetype.startsWith('video/')) {
        mediaUrl = await this.filesService.uploadVideo(file);
      } else {
        mediaUrl = await this.filesService.uploadImage(file);
      }
    }

    const post = this.postRepo.create({
      communityId,
      authorId,
      authorName,
      textContent: text,
      mediaUrl: mediaUrl, 
    });

    return this.postRepo.save(post);
  }

  // ==================================================
  // DELETE COMMUNITY
  // ==================================================
  async deleteCommunity(communityId: string, userId: string) {
    const community = await this.communityRepo.findOne({ where: { id: communityId } });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    if (community.creatorId !== userId) {
      throw new ForbiddenException('You are not authorized to delete this community');
    }

    await this.communityRepo.remove(community);
    
    return { message: 'Community deleted successfully' };
  }

  // ==================================================
  // REACTION LOGIC
  // ==================================================
  async toggleReaction(postId: string, userId: string, emoji: string) {
    // 1. Check if post exists
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    // 2. Check if user has already reacted to this post
    const existingReaction = await this.reactionRepo.findOne({
      where: { postId, userId },
    });

    if (existingReaction) {
      // Case A: User clicked the SAME emoji -> Remove reaction (Toggle off)
      if (existingReaction.emoji === emoji) {
        await this.reactionRepo.remove(existingReaction);
        return { action: 'removed', emoji: null };
      } 
      // Case B: User clicked a DIFFERENT emoji -> Update reaction
      else {
        existingReaction.emoji = emoji;
        await this.reactionRepo.save(existingReaction);
        return { action: 'updated', emoji: emoji };
      }
    } else {
      // Case C: User has not reacted yet -> Create new reaction
      const newReaction = this.reactionRepo.create({
        postId,
        userId,
        emoji,
      });
      await this.reactionRepo.save(newReaction);
      return { action: 'added', emoji: emoji };
    }
  }

  // ==================================================
  // GET POSTS (WITH REACTION COUNTS)
  // ==================================================
  async getPosts(communityId: string) {
    const posts = await this.postRepo.find({ 
      where: { communityId }, 
      order: { createdAt: 'DESC' } 
    });

    // Attach reaction counts to each post
    // Note: For very large scale, use a QueryBuilder with GROUP BY.
    // For this app size, iterating is acceptable.
    const postsWithReactions = await Promise.all(
      posts.map(async (post) => {
        const reactions = await this.reactionRepo.find({
          where: { postId: post.id },
          select: ['emoji'], // Only fetch emoji to save bandwidth
        });

        // Count occurrences of each emoji
        const counts = reactions.reduce((acc, reaction) => {
          acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Convert to array format for frontend: [{ emoji: "❤️", count: 5 }, ...]
        const reactionList = Object.keys(counts).map((emoji) => ({
          emoji,
          count: counts[emoji],
        }));

        return {
          ...post,
          reactions: reactionList,
        };
      }),
    );

    return postsWithReactions;
  }
}