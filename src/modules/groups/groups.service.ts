import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, ILike, SelectQueryBuilder } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Group } from './entities/group.entity';
import { GroupMember, GroupMemberRole } from './entities/group-member.entity';
import { GroupMessage } from './entities/group-message.entity';
import { GroupMessageReaction } from './entities/group-message-reaction.entity';
import { Notification } from '../notifications/notification.entity';
import { FilesService } from '../../common/services/files.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group) private readonly groupRepo: Repository<Group>,
    @InjectRepository(GroupMember) private readonly memberRepo: Repository<GroupMember>,
    @InjectRepository(GroupMessage) private readonly messageRepo: Repository<GroupMessage>,
    @InjectRepository(GroupMessageReaction) private readonly reactionRepo: Repository<GroupMessageReaction>,
    @InjectRepository(Notification) private readonly notifRepo: Repository<Notification>,
    private dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly filesService: FilesService,
  ) {}

  private sanitizeUser(user: any) {
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      role: user.role,
    };
  }

  // =========================
  // REACTIONS SYSTEM
  // =========================
  async toggleReaction(groupId: string, messageId: string, userId: string, emoji: string) {
    const member = await this.memberRepo.findOne({ where: { groupId, userId } });
    if (!member) throw new ForbiddenException('You are not a member of this group');

    const message = await this.messageRepo.findOne({ where: { id: messageId, groupId } });
    if (!message) throw new NotFoundException('Message not found');

    if (!GroupMessageReaction.ALLOWED_EMOJIS.includes(emoji)) {
      throw new BadRequestException('Invalid reaction emoji');
    }

    const existingReaction = await this.reactionRepo.findOne({
      where: { messageId, userId, emoji }
    });

    let actionType: 'added' | 'removed';

    if (existingReaction) {
      await this.reactionRepo.remove(existingReaction);
      actionType = 'removed';
    } else {
      const newReaction = this.reactionRepo.create({ messageId, userId, emoji });
      await this.reactionRepo.save(newReaction);
      actionType = 'added';
    }

    // Fetch updated reactions with user data efficiently
    const updatedReactions = await this.reactionRepo.find({
      where: { messageId },
      relations: ['user'] // Ensure user is loaded
    });

    const payload = {
      groupId,
      messageId,
      emoji,
      userId,
      action: actionType,
      reactions: updatedReactions.map(r => ({
        emoji: r.emoji,
        userId: r.userId,
        username: r.user?.username ?? 'Unknown'
      }))
    };

    this.eventEmitter.emit('message_reaction_updated', payload);
    
    return payload;
  }

  // =========================
  // CREATE
  // =========================
  async create(name: string, description: string, creatorId: string, file?: Express.Multer.File) {
    let fileUrl: string | undefined;
    if (file) {
      fileUrl = await this.filesService.uploadImage(file);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const group = this.groupRepo.create({
        name, 
        description, 
        creatorId, 
        imageUrl: fileUrl, 
        inviteLink: uuidv4().split('-')[0],
      });
      const savedGroup = await queryRunner.manager.save(group);
      const member = this.memberRepo.create({ groupId: savedGroup.id, userId: creatorId, role: GroupMemberRole.ADMIN });
      await queryRunner.manager.save(member);
      await queryRunner.commitTransaction();
      
      const fullGroup = await this.groupRepo.findOne({ where: { id: savedGroup.id }, relations: ['creator'] });
      return {
        ...fullGroup,
        creator: this.sanitizeUser(fullGroup?.creator)
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async joinByName(userId: string, groupName: string) {
    const group = await this.groupRepo.findOne({ where: { name: ILike(groupName) } });
    if (!group) throw new NotFoundException(`Group '${groupName}' not found.`);
    const existingMember = await this.memberRepo.findOne({ where: { groupId: group.id, userId } });
    if (existingMember) return group;

    const newMember = this.memberRepo.create({ groupId: group.id, userId, role: GroupMemberRole.MEMBER });
    await this.memberRepo.save(newMember);
    this.eventEmitter.emit('group_joined', { group, userId });
    return group;
  }

  async join(userId: string, inviteLink: string) {
    const group = await this.groupRepo.findOne({ where: { inviteLink } });
    if (!group) throw new BadRequestException('Invalid invite link');
    const existingMember = await this.memberRepo.findOne({ where: { groupId: group.id, userId } });
    if (existingMember) throw new BadRequestException('Already a member');
    const newMember = this.memberRepo.create({ groupId: group.id, userId, role: GroupMemberRole.MEMBER });
    await this.memberRepo.save(newMember);
    return this.findById(group.id);
  }
  
  async findAll() { 
    const groups = await this.groupRepo.find({ order: { createdAt: 'DESC' }, relations: ['creator'] });
    return groups.map(g => ({ ...g, creator: this.sanitizeUser(g.creator) }));
  }

  async findJoined(userId: string) {
    const memberships = await this.memberRepo.find({ where: { userId }, relations: ['group', 'group.creator'] });
    return memberships.map(m => ({ ...m.group, creator: this.sanitizeUser(m.group.creator) }));
  }

  async findById(id: string) { 
    const group = await this.groupRepo.findOne({ where: { id }, relations: ['creator', 'members', 'members.user'] });
    if (!group) return null;
    (group as any).creator = this.sanitizeUser(group.creator);
    if (group.members) {
      (group as any).members = group.members.map(m => ({ ...m, user: this.sanitizeUser(m.user) }));
    }
    return group;
  }

  async getGroupDetails(groupId: string, userId: string) {
    // Optimized: Select specific fields to avoid fetching heavy user data for all members
    const group = await this.groupRepo.findOne({ 
      where: { id: groupId }, 
      relations: ['members'] // Don't need full user object for all members here
    });
    
    if (!group) throw new NotFoundException('Group not found');
    
    // Check membership efficiently
    const myMembership = await this.memberRepo.findOne({ 
      where: { groupId, userId },
      relations: ['user'] // Load only MY user data
    });

    if (!myMembership) throw new ForbiddenException('You are not a member');

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      imageUrl: group.imageUrl,
      inviteLink: group.inviteLink,
      lockGroup: (group as any).lockGroup || false, 
      disappearingTimer: (group as any).disappearingTimer || 0,
      creatorId: group.creatorId,
      // Return minimal member list (frontend usually uses separate endpoint for full list)
      // or map just the count
      memberCount: group.members.length,
      // Return current user's specific info
      me: {
        id: myMembership.userId,
        username: myMembership.user.username,
        avatarUrl: myMembership.user.avatarUrl,
        role: myMembership.role
      }
    };
  }

  async updateGroup(groupId: string, userId: string, updates: any) {
    const member = await this.memberRepo.findOne({ where: { groupId, userId } });
    if (!member || member.role !== GroupMemberRole.ADMIN) throw new ForbiddenException('Only admins can update settings');
    
    // Use findById to get existing data
    const groupEntity = await this.findById(groupId);
    if (!groupEntity) throw new NotFoundException('Group not found');

    // Re-fetch as entity to save
    const group = await this.groupRepo.findOne({ where: { id: groupId } });

    if (updates.file) group.imageUrl = await this.filesService.uploadImage(updates.file);
    if (updates.name) group.name = updates.name;
    if (updates.description !== undefined) group.description = updates.description;
    if (updates.lockGroup !== undefined) (group as any).lockGroup = updates.lockGroup;
    if (updates.disappearingTimer !== undefined) (group as any).disappearingTimer = updates.disappearingTimer;

    const savedGroup = await this.groupRepo.save(group);
    this.eventEmitter.emit('group_updated', savedGroup);
    return savedGroup;
  }

  async resetInviteLink(groupId: string, userId: string) {
    const member = await this.memberRepo.findOne({ where: { groupId, userId } });
    if (!member || member.role !== GroupMemberRole.ADMIN) throw new ForbiddenException('Only admins can reset link');
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if(!group) throw new NotFoundException('Group not found');
    group.inviteLink = uuidv4().split('-')[0];
    return this.groupRepo.save(group);
  }

  // =========================
  // CHAT SYSTEM (OPTIMIZED)
  // =========================

  async sendMessage(groupId: string, senderId: string, content: string, file?: Express.Multer.File, replyToId?: string) {
    const member = await this.memberRepo.findOne({ where: { groupId, userId: senderId } });
    if (!member) throw new ForbiddenException('Not a member');
    
    let imageUrl: string | undefined;
    if (file) imageUrl = await this.filesService.uploadImage(file);
    
    const message = this.messageRepo.create({ 
      groupId, 
      senderId, 
      content, 
      imageUrl, 
      replyToId: replyToId || null
    });
    
    const savedMessage = await this.messageRepo.save(message);
    
    // OPTIMIZATION: Select specific fields instead of loading full heavy objects
    const fullMessage = await this.messageRepo.createQueryBuilder('msg')
      .leftJoinAndSelect('msg.sender', 'sender')
      .leftJoinAndSelect('msg.replyTo', 'replyTo')
      .leftJoinAndSelect('replyTo.sender', 'replyToSender')
      .where('msg.id = :id', { id: savedMessage.id })
      .select([
        'msg.id', 'msg.content', 'msg.imageUrl', 'msg.createdAt', 'msg.replyToId',
        'sender.id', 'sender.username', 'sender.avatarUrl',
        'replyTo.id', 'replyTo.content', 
        'replyToSender.id', 'replyToSender.username'
      ])
      .getOne();

    this.eventEmitter.emit('group_message_created', fullMessage);
    return fullMessage;
  }

  async getMessages(groupId: string, page: number = 1, limit: number = 50) {
    // FIX: Added Pagination. Defaults to fetching last 50 messages.
    // Frontend should pass page=1 for initial load.
    const skip = (page - 1) * limit;

    const messages = await this.messageRepo.createQueryBuilder('msg')
      .leftJoinAndSelect('msg.sender', 'sender')
      .leftJoinAndSelect('msg.replyTo', 'replyTo')
      .leftJoinAndSelect('replyTo.sender', 'replyToSender')
      .leftJoinAndSelect('msg.reactions', 'reaction')
      .leftJoinAndSelect('reaction.user', 'reactionUser') // FIX: Load reaction user
      .where('msg.groupId = :groupId', { groupId })
      .orderBy('msg.createdAt', 'DESC') // Get newest
      .skip(skip)
      .take(limit)
      .select([ // OPTIMIZATION: Select ONLY required fields
        'msg.id', 'msg.content', 'msg.imageUrl', 'msg.createdAt', 'msg.replyToId', 'msg.isPinned',
        'sender.id', 'sender.username', 'sender.avatarUrl',
        'replyTo.id', 'replyTo.content', 'replyTo.imageUrl',
        'replyToSender.id', 'replyToSender.username',
        'reaction.id', 'reaction.emoji', 'reaction.userId',
        'reactionUser.id', 'reactionUser.username'
      ])
      .getMany();

    // Map to clean format (and reverse for chat display order ASC)
    return messages.reverse().map(msg => {
      const m: any = msg;
      m.sender = this.sanitizeUser(msg.sender);
      
      if (msg.replyTo) {
        m.replyTo = {
          id: msg.replyTo.id,
          content: msg.replyTo.content,
          imageUrl: msg.replyTo.imageUrl,
          sender: this.sanitizeUser((msg.replyTo as any).sender) // replyToSender
        };
      }

      // Map reactions efficiently
      m.reactions = (msg.reactions || []).map(r => ({
        emoji: r.emoji,
        userId: r.userId,
        username: (r.user as any)?.username ?? 'Unknown'
      }));

      return m;
    });
  }

  private async checkAdmin(groupId: string, userId: string) {
    const member = await this.memberRepo.findOne({ where: { groupId, userId } });
    if (!member || member.role !== GroupMemberRole.ADMIN) throw new ForbiddenException('Admin privileges required');
    return true;
  }

  async pinMessage(groupId: string, messageId: string, userId: string) {
    await this.checkAdmin(groupId, userId);
    const message = await this.messageRepo.findOne({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');
    message.isPinned = !message.isPinned;
    const savedMsg = await this.messageRepo.save(message);

    this.eventEmitter.emit('message_updated', { groupId, id: savedMsg.id, isPinned: savedMsg.isPinned });
    return savedMsg;
  }

  async kickMember(groupId: string, targetUserId: string, adminId: string) {
    await this.checkAdmin(groupId, adminId);

    await this.messageRepo.delete({ groupId, senderId: targetUserId });
    await this.memberRepo.delete({ groupId, userId: targetUserId });

    this.eventEmitter.emit('kicked_from_group', { groupId, userId: targetUserId });
    this.eventEmitter.emit('user_kicked', { groupId, userId: targetUserId });
    return { success: true };
  }

  async promoteMember(groupId: string, targetUserId: string, adminId: string) {
    await this.checkAdmin(groupId, adminId);
    const targetMember = await this.memberRepo.findOne({ where: { groupId, userId: targetUserId } });
    if (!targetMember) throw new NotFoundException('Member not found');
    targetMember.role = GroupMemberRole.ADMIN;
    const savedMember = await this.memberRepo.save(targetMember);

    this.eventEmitter.emit('user_promoted', { groupId, userId: targetUserId, role: 'ADMIN' });
    return savedMember;
  }

  async deleteMessage(groupId: string, messageId: string, userId: string) {
    const message = await this.messageRepo.findOne({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');

    const member = await this.memberRepo.findOne({ where: { groupId, userId } });
    const isAdmin = member && member.role === GroupMemberRole.ADMIN;
    const isSender = message.senderId === userId;

    if (!isAdmin && !isSender) throw new ForbiddenException('You cannot delete this message');

    await this.messageRepo.remove(message);
    this.eventEmitter.emit('message_deleted', { groupId, messageId });
    return { success: true };
  }

  async clearGroupChat(groupId: string, userId: string) {
    const member = await this.memberRepo.findOne({ where: { groupId, userId } });
    if (!member || member.role !== GroupMemberRole.ADMIN) throw new ForbiddenException('Only admins can clear chat history');

    await this.messageRepo.delete({ groupId });
    this.eventEmitter.emit('chat_cleared', { groupId });
    return { success: true };
  }

  async deleteGroup(groupId: string, userId: string) {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');
    if (group.creatorId !== userId) throw new ForbiddenException('Only the group creator can delete the group');

    await this.messageRepo.delete({ groupId });
    await this.memberRepo.delete({ groupId });
    await this.groupRepo.remove(group);

    this.eventEmitter.emit('group_deleted', { groupId });
    return { success: true };
  }
}