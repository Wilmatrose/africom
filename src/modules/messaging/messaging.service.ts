import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';
import { User } from '../users/entities/user.entity';
import { Notification } from '../notifications/notification.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FilesService } from '../../common/services/files.service'; // IMPORT CLOUDINARY SERVICE

@Injectable()
export class MessagingService {
  constructor(
    @InjectRepository(Message) private msgRepo: Repository<Message>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
    private eventEmitter: EventEmitter2,
    private readonly filesService: FilesService, // INJECT CLOUDINARY SERVICE
  ) {}

  // =========================
  // INBOX & CONVERSATIONS
  // =========================

  async getInbox(userId: string) {
    const conversations = await this.msgRepo.find({
      where: [
        { senderId: userId, isAccepted: true },
        { receiverId: userId, isAccepted: true },
      ],
      order: { createdAt: 'DESC' },
      relations: ['sender', 'receiver'],
    });

    const requests = await this.msgRepo.find({
      where: { receiverId: userId, isRequest: true, isAccepted: false },
      order: { createdAt: 'DESC' },
      relations: ['sender', 'receiver'],
    });

    return {
      conversations: conversations.map(m => this.sanitizeMessage(m, userId)),
      requests: requests.map(m => this.sanitizeMessage(m, userId)),
    };
  }

  async getMessages(userId: string, otherUserId: string) {
    const messages = await this.msgRepo.find({
      where: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
      order: { createdAt: 'ASC' },
      relations: ['sender', 'receiver'],
    });
    
    return messages.map(m => this.sanitizeMessage(m, userId));
  }

  // =========================
  // SENDING & ACCEPTING (UPDATED)
  // =========================

  async sendMessage(
    senderId: string, 
    receiverId: string, 
    content: string, 
    file?: Express.Multer.File // CHANGED: Accept File instead of URL string
  ) {
    const sender = await this.userRepo.findOne({ 
        where: { id: senderId }, 
        relations: ['following', 'followers'] 
    });
    const receiver = await this.userRepo.findOne({ where: { id: receiverId } });

    if (!receiver) throw new NotFoundException('User not found');

    const isFollowing = sender.following.some(u => u.id === receiverId);
    if (!isFollowing) {
      throw new ForbiddenException('You must follow this user to send a message');
    }

    const isMutual = sender.followers.some(u => u.id === receiverId);

    // ✅ FIX: Upload Image to Cloudinary if file exists
    let imageUrl: string | undefined;
    if (file) {
      imageUrl = await this.filesService.uploadImage(file);
    }

    const message = this.msgRepo.create({
      sender,
      receiver,
      senderId,
      receiverId,
      content,
      imageUrl, // Save Cloudinary URL
      isRequest: !isMutual,
      isAccepted: isMutual,
    });

    const saved = await this.msgRepo.save(message);
    const payload = this.sanitizeMessage(saved, senderId);
    
    this.eventEmitter.emit('private_message', { ...payload, receiverId });

    if (!isMutual) {
      await this.createNotif(receiverId, 'MESSAGE_REQUEST', `${sender.username} sent a message request.`, saved.id);
    } else {
      await this.createNotif(receiverId, 'NEW_MESSAGE', `New message from ${sender.username}`, saved.id);
    }

    return payload;
  }

  async acceptRequest(userId: string, requestId: string) {
    const request = await this.msgRepo.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');
    if (request.receiverId !== userId) throw new ForbiddenException('Not authorized');

    request.isAccepted = true;
    request.isRequest = false;
    
    return this.msgRepo.save(request);
  }

  // =========================
  // UNREAD BADGE SYSTEM
  // =========================

  async getUnreadCount(userId: string) {
    const count = await this.msgRepo.count({
      where: {
        receiverId: userId,
        isRead: false,
        isAccepted: true
      }
    });

    return { count };
  }

  async markAsRead(currentUserId: string, senderId: string) {
    await this.msgRepo.update(
      { 
        receiverId: currentUserId, 
        senderId: senderId, 
        isRead: false 
      },
      { 
        isRead: true 
      }
    );

    return { success: true };
  }

  // =========================
  // HELPERS
  // =========================

  private async createNotif(userId: string, type: string, msg: string, relatedId: string) {
    const notif = this.notifRepo.create({ userId, type, message: msg, relatedId });
    await this.notifRepo.save(notif);
    this.eventEmitter.emit('notification', { userId, type, message: msg });
  }

  private sanitizeMessage(msg: Message, currentUserId: string) {
    return {
      id: msg.id,
      content: msg.content,
      imageUrl: msg.imageUrl,
      createdAt: msg.createdAt,
      isRequest: msg.isRequest,
      isAccepted: msg.isAccepted,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      isMine: msg.senderId === currentUserId,
      sender: this.sanitizeUser(msg.sender),
    };
  }

  private sanitizeUser(user: User) {
    if (!user) return null;
    return { id: user.id, username: user.username, avatarUrl: user.avatarUrl };
  }
}