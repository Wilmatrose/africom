import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, ILike } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Group } from './entities/group.entity';
import { GroupMember, GroupMemberRole } from './entities/group-member.entity';
import { GroupMessage } from './entities/group-message.entity';
import { Notification } from '../notifications/notification.entity';
import { FilesService } from '../../common/services/files.service'; // IMPORT CLOUDINARY SERVICE
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group) private readonly groupRepo: Repository<Group>,
    @InjectRepository(GroupMember) private readonly memberRepo: Repository<GroupMember>,
    @InjectRepository(GroupMessage) private readonly messageRepo: Repository<GroupMessage>,
    @InjectRepository(Notification) private readonly notifRepo: Repository<Notification>,
    private dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly filesService: FilesService, // INJECT CLOUDINARY SERVICE
  ) {}

  // =========================
  // HELPER: SECURITY SANITIZATION
  // =========================
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
  // CREATE (WITH CLOUDINARY UPLOAD)
  // =========================
  async create(name: string, description: string, creatorId: string, file?: Express.Multer.File) {
    let fileUrl: string | undefined;

    // ✅ FIX: Upload to Cloudinary if file exists
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
        imageUrl: fileUrl, // Save Cloudinary URL
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

  // =========================
  // JOIN BY NAME
  // =========================
  async joinByName(userId: string, groupName: string) {
    const group = await this.groupRepo.findOne({ 
      where: { name: ILike(groupName) } 
    });

    if (!group) {
      throw new NotFoundException(`Group '${groupName}' not found.`);
    }

    const existingMember = await this.memberRepo.findOne({ 
      where: { groupId: group.id, userId } 
    });
    
    if (existingMember) {
      return group;
    }

    const newMember = this.memberRepo.create({ 
      groupId: group.id, 
      userId, 
      role: GroupMemberRole.MEMBER 
    });
    await this.memberRepo.save(newMember);

    this.eventEmitter.emit('group_joined', { group, userId });

    return group;
  }

  // =========================
  // JOIN (Via Invite Link)
  // =========================
  async join(userId: string, inviteLink: string) {
    const group = await this.groupRepo.findOne({ where: { inviteLink } });
    if (!group) throw new BadRequestException('Invalid invite link');
    const existingMember = await this.memberRepo.findOne({ where: { groupId: group.id, userId } });
    if (existingMember) throw new BadRequestException('Already a member');
    const newMember = this.memberRepo.create({ groupId: group.id, userId, role: GroupMemberRole.MEMBER });
    await this.memberRepo.save(newMember);
    return this.findById(group.id);
  }
  
  // =========================
  // FIND ALL
  // =========================
  async findAll() { 
    const groups = await this.groupRepo.find({ 
      order: { createdAt: 'DESC' }, 
      relations: ['creator'] 
    });

    return groups.map(g => ({
      ...g,
      creator: this.sanitizeUser(g.creator)
    }));
  }

  async findJoined(userId: string) {
    const memberships = await this.memberRepo.find({ where: { userId }, relations: ['group', 'group.creator'] });
    return memberships.map(m => ({
      ...m.group,
      creator: this.sanitizeUser(m.group.creator)
    }));
  }

  async findById(id: string) { 
    const group = await this.groupRepo.findOne({ where: { id }, relations: ['creator', 'members', 'members.user'] });
    if (!group) return null;
    
    (group as any).creator = this.sanitizeUser(group.creator);
    
    if (group.members) {
      (group as any).members = group.members.map(m => ({
        ...m,
        user: this.sanitizeUser(m.user)
      }));
    }
    
    return group;
  }

  // =========================
  // GROUP DETAILS & SETTINGS
  // =========================

  async getGroupDetails(groupId: string, userId: string) {
    const group = await this.groupRepo.findOne({
      where: { id: groupId },
      relations: ['members', 'members.user'],
    });
    if (!group) throw new NotFoundException('Group not found');

    const isMember = group.members.some(m => m.userId === userId);
    if (!isMember) throw new ForbiddenException('You are not a member');

    const members = group.members.map(m => ({
      id: m.user.id,
      username: m.user.username,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
    }));

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      imageUrl: group.imageUrl,
      inviteLink: group.inviteLink,
      lockGroup: (group as any).lockGroup || false, 
      disappearingTimer: (group as any).disappearingTimer || 0,
      members,
    };
  }

  async updateGroup(groupId: string, userId: string, updates: any) {
    const member = await this.memberRepo.findOne({ where: { groupId, userId } });
    if (!member || member.role !== GroupMemberRole.ADMIN) {
      throw new ForbiddenException('Only admins can update settings');
    }

    const group = await this.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');

    // ✅ FIX: Handle Image Upload
    if (updates.file) {
      group.imageUrl = await this.filesService.uploadImage(updates.file);
    }

    if (updates.name) group.name = updates.name;
    if (updates.description !== undefined) group.description = updates.description;
    // Note: file property is handled above, ignored here if passed in updates object
    if (updates.lockGroup !== undefined) (group as any).lockGroup = updates.lockGroup;
    if (updates.disappearingTimer !== undefined) (group as any).disappearingTimer = updates.disappearingTimer;

    const savedGroup = await this.groupRepo.save(group);
    this.eventEmitter.emit('group_updated', savedGroup);
    return savedGroup;
  }

  async resetInviteLink(groupId: string, userId: string) {
    const member = await this.memberRepo.findOne({ where: { groupId, userId } });
    if (!member || member.role !== GroupMemberRole.ADMIN) throw new ForbiddenException('Only admins can reset link');
    
    const group = await this.findById(groupId);
    if(!group) throw new NotFoundException('Group not found');
    
    group.inviteLink = uuidv4().split('-')[0];
    return this.groupRepo.save(group);
  }

  // =========================
  // CHAT SYSTEM (WITH CLOUDINARY)
  // =========================

  async sendMessage(groupId: string, senderId: string, content: string, file?: Express.Multer.File, replyToId?: string) {
    const member = await this.memberRepo.findOne({ where: { groupId, userId: senderId } });
    if (!member) throw new ForbiddenException('Not a member');
    
    let imageUrl: string | undefined;

    // ✅ FIX: Upload chat image to Cloudinary
    if (file) {
      imageUrl = await this.filesService.uploadImage(file);
    }
    
    const message = this.messageRepo.create({ 
      groupId, 
      senderId, 
      content, 
      imageUrl, // Save Cloudinary URL
      replyToId: replyToId || null
    });
    
    const savedMessage = await this.messageRepo.save(message);
    
    const fullMessage = await this.messageRepo.findOne({ 
        where: { id: savedMessage.id }, 
        relations: ['sender', 'replyTo', 'replyTo.sender'] 
    });
    
    if (fullMessage) {
      (fullMessage as any).sender = this.sanitizeUser(fullMessage.sender);
      if (fullMessage.replyTo) {
        (fullMessage.replyTo as any).sender = this.sanitizeUser((fullMessage.replyTo as any).sender);
      }
    }

    this.eventEmitter.emit('group_message_created', fullMessage);
    return fullMessage;
  }

  async getMessages(groupId: string) {
    const messages = await this.messageRepo.find({ 
      where: { groupId }, 
      relations: ['sender', 'replyTo', 'replyTo.sender'], 
      order: { createdAt: 'ASC' } 
    });

    return messages.map(msg => {
      (msg as any).sender = this.sanitizeUser(msg.sender);
      if (msg.replyTo) {
         (msg.replyTo as any).sender = this.sanitizeUser((msg.replyTo as any).sender);
      }
      return msg;
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

    this.eventEmitter.emit('message_updated', { 
        groupId, 
        id: savedMsg.id, 
        isPinned: savedMsg.isPinned 
    });

    return savedMsg;
  }

  // =========================
  // ADMIN ACTIONS & DELETION
  // =========================

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

    this.eventEmitter.emit('user_promoted', { 
        groupId, 
        userId: targetUserId, 
        role: 'ADMIN' 
    });

    return savedMember;
  }

  async deleteMessage(groupId: string, messageId: string, userId: string) {
    const message = await this.messageRepo.findOne({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');

    const member = await this.memberRepo.findOne({ where: { groupId, userId } });
    const isAdmin = member && member.role === GroupMemberRole.ADMIN;
    const isSender = message.senderId === userId;

    if (!isAdmin && !isSender) {
      throw new ForbiddenException('You cannot delete this message');
    }

    await this.messageRepo.remove(message);
    this.eventEmitter.emit('message_deleted', { groupId, messageId });

    return { success: true };
  }

  async clearGroupChat(groupId: string, userId: string) {
    const member = await this.memberRepo.findOne({ where: { groupId, userId } });
    if (!member || member.role !== GroupMemberRole.ADMIN) {
      throw new ForbiddenException('Only admins can clear chat history');
    }

    await this.messageRepo.delete({ groupId });
    this.eventEmitter.emit('chat_cleared', { groupId });

    return { success: true };
  }
}