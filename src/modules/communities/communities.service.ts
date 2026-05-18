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
    private reactionRepo: Repository<CommunityPostReaction>,
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
  // FIND BY ID (UPDATED: Secure Participant Data + Creator Access)
  // ==================================================
  async findById(id: string) {
    // 1. Fetch Community with Creator, Participants, AND Participant User Data
    const community = await this.communityRepo.findOne({
      where: { id },
      relations: ['creator', 'participants', 'participants.user'], 
    });

    if (!community) throw new NotFoundException('Community not found');

    // 2. Map existing participants with Username/Avatar (Safe Display)
    const participants = community.participants.map(p => ({
      userId: p.userId,
      username: p.user?.username ?? 'Unknown User',
      avatarUrl: p.user?.avatarUrl ?? null,
      joinedAt: p.joinedAt,
    }));

    // 3. Inject Creator into participants list if missing
    const isCreatorInList = participants.some(p => p.userId === community.creatorId);

    if (!isCreatorInList && community.creatorId) {
      participants.push({
        userId: community.creatorId,
        username: community.creator?.username ?? 'Host',
        avatarUrl: community.creator?.avatarUrl ?? null,
        joinedAt: community.createdAt,
      });
    }

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
      // Return the secure list with usernames
      participants: participants,
    };
  }

  // ==================================================
  // JOIN COMMUNITY (UPDATED WITH CREATOR CREDITING)
  // ==================================================
  async joinCommunity(communityId: string, userId: string) {
    const community = await this.communityRepo.findOne({ where: { id: communityId } });
    if (!community) throw new BadRequestException('Community not found');

    // CHECK 1: Is the user the Creator?
    if (community.creatorId === userId) {
      console.log(`User ${userId} is the creator. Allowing free access.`);
      
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

    // CHECK 3: Fetch Joining User
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    // CHECK 4: Validate Payment
    if (user.coinBalance < community.minCoinsToJoin) {
      throw new BadRequestException(`Insufficient coins. Need ${community.minCoinsToJoin}, you have ${user.coinBalance}`);
    }

    // DEDUCT COINS (USER)
    user.coinBalance -= community.minCoinsToJoin;
    await this.userRepo.save(user);

    // LOG TRANSACTION (USER DEBIT)
    const userTx = this.transactionRepo.create({
      userId: user.id,
      amount: community.minCoinsToJoin,
      type: TransactionType.DEBIT,
      category: TransactionCategory.COMMUNITY_JOIN,
      reference: `community-join-${community.id}`,
      metadata: { communityName: community.name, role: 'member' },
      status: TransactionStatus.COMPLETED,
    });
    await this.transactionRepo.save(userTx);

    // CREDIT COINS (CREATOR)
    const creator = await this.userRepo.findOne({ where: { id: community.creatorId } });
    if (creator) {
      creator.coinBalance = Number(creator.coinBalance) + Number(community.minCoinsToJoin);
      await this.userRepo.save(creator);

      // LOG TRANSACTION (CREATOR CREDIT)
      const creatorTx = this.transactionRepo.create({
        userId: creator.id,
        amount: community.minCoinsToJoin,
        type: TransactionType.CREDIT,
        category: TransactionCategory.COMMUNITY_JOIN,
        reference: `community-earning-${community.id}`,
        metadata: { communityName: community.name, payingUserId: user.id, role: 'creator' },
        status: TransactionStatus.COMPLETED,
      });
      await this.transactionRepo.save(creatorTx);
    }

    // CREATE PARTICIPANT
    const participant = this.participantRepo.create({ communityId, userId });
    await this.participantRepo.save(participant);

    return { success: true, newBalance: user.coinBalance };
  }

  // ==================================================
  // EXIT COMMUNITY
  // ==================================================
  async exitCommunity(communityId: string, userId: string) {
    const community = await this.communityRepo.findOne({ where: { id: communityId } });
    if (!community) throw new NotFoundException('Community not found');

    if (community.creatorId === userId) {
      throw new ForbiddenException('Creators cannot exit their own community. Please delete it instead.');
    }

    const participant = await this.participantRepo.findOne({ 
      where: { communityId, userId } 
    });

    if (!participant) {
      throw new BadRequestException('You are not a member of this community');
    }

    await this.participantRepo.remove(participant);

    return { success: true, message: 'Exited community successfully' };
  }

  // ==================================================
  // UPDATE COMMUNITY
  // ==================================================
  async updateCommunity(
    communityId: string, 
    userId: string, 
    updates: { 
      name?: string; 
      description?: string; 
      minCoinsToJoin?: number; 
      file?: Express.Multer.File 
    }
  ) {
    const community = await this.communityRepo.findOne({ where: { id: communityId } });
    
    if (!community) throw new NotFoundException('Community not found');
    if (community.creatorId !== userId) throw new ForbiddenException('Only the creator can update settings');

    let imageUrl = community.imageUrl;

    if (updates.file) {
      imageUrl = await this.filesService.uploadImage(updates.file);
    }

    community.name = updates.name || community.name;
    community.description = updates.description !== undefined ? updates.description : community.description;
    community.minCoinsToJoin = updates.minCoinsToJoin !== undefined ? updates.minCoinsToJoin : community.minCoinsToJoin;
    community.imageUrl = imageUrl;

    return this.communityRepo.save(community);
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
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const existingReaction = await this.reactionRepo.findOne({
      where: { postId, userId },
    });

    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        await this.reactionRepo.remove(existingReaction);
        return { action: 'removed', emoji: null };
      } else {
        existingReaction.emoji = emoji;
        await this.reactionRepo.save(existingReaction);
        return { action: 'updated', emoji: emoji };
      }
    } else {
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

    const postsWithReactions = await Promise.all(
      posts.map(async (post) => {
        const reactions = await this.reactionRepo.find({
          where: { postId: post.id },
          select: ['emoji'],
        });

        const counts = reactions.reduce((acc, reaction) => {
          acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

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