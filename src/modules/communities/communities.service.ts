import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Community, CommunityPost, CommunityParticipant } from './communities.entity';
import { User } from '../users/entities/user.entity';
import { 
  Transaction, 
  TransactionType, 
  TransactionCategory, 
  TransactionStatus 
} from '../wallet/wallet.entity';

@Injectable()
export class CommunitiesService {
  constructor(
    @InjectRepository(Community)
    private communityRepo: Repository<Community>,
    @InjectRepository(CommunityPost)
    private postRepo: Repository<CommunityPost>,
    @InjectRepository(CommunityParticipant)
    private participantRepo: Repository<CommunityParticipant>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
  ) {}

  // ==================================================
  // CREATE COMMUNITY
  // ==================================================
  async createCommunity(creatorId: string, name: string, minCoins: number) {
    const community = this.communityRepo.create({
      creatorId,
      name,
      minCoinsToJoin: minCoins,
    });
    return this.communityRepo.save(community);
  }

  // ==================================================
  // GET ALL (ENRICHED WITH CREATOR DATA)
  // ==================================================
  async getAllCommunities() {
    const communities = await this.communityRepo.find({
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });

    return communities.map(c => ({
      id: c.id,
      name: c.name,
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
  // NEW: GET ONE BY ID (FOR COMMUNITY DETAIL PAGE)
  // ==================================================
  async findById(id: string) {
    const community = await this.communityRepo.findOne({
      where: { id },
      relations: ['creator'], // Load creator relation
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    // Return mapped object consistent with getAll
    return {
      id: community.id,
      name: community.name,
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
  // JOIN COMMUNITY (PAYMENT LOGIC)
  // ==================================================
  async joinCommunity(communityId: string, userId: string) {
    const community = await this.communityRepo.findOne({ where: { id: communityId } });
    if (!community) throw new BadRequestException('Community not found');

    const existing = await this.participantRepo.findOne({ where: { communityId, userId } });
    if (existing) return { message: 'Already a member' };

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    if (user.coinBalance < community.minCoinsToJoin) {
      throw new BadRequestException(`Need ${community.minCoinsToJoin} coins to join`);
    }

    // Deduct Coins
    user.coinBalance -= community.minCoinsToJoin;
    await this.userRepo.save(user);

    // Log Transaction
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

    // Create Participant
    const participant = this.participantRepo.create({ communityId, userId });
    await this.participantRepo.save(participant);

    return { success: true, newBalance: user.coinBalance };
  }

  // ==================================================
  // CREATE POST (SECURE)
  // ==================================================
  async createPost(communityId: string, authorId: string, authorName: string, text: string, voiceUrl?: string) {
    const community = await this.communityRepo.findOne({ where: { id: communityId } });
    if (!community) throw new BadRequestException('Community not found');

    if (community.creatorId !== authorId) {
      const isMember = await this.participantRepo.findOne({ 
        where: { communityId, userId: authorId } 
      });
      if (!isMember) throw new ForbiddenException('Must join community to post');
    }

    const post = this.postRepo.create({
      communityId,
      authorId,
      authorName,
      textContent: text,
      voiceNoteUrl: voiceUrl,
    });
    return this.postRepo.save(post);
  }

  // ==================================================
  // GET POSTS
  // ==================================================
  async getPosts(communityId: string) {
    return this.postRepo.find({ 
      where: { communityId }, 
      order: { createdAt: 'DESC' } 
    });
  }
}