import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
  ) {}

  async getUserNotifications(userId: string) {
    return this.notifRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50, // Limit to recent 50
    });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notifRepo.findOne({ where: { id } });
    
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId) throw new ForbiddenException('Access denied');

    notification.isRead = true;
    return this.notifRepo.save(notification);
  }

  async markAllAsRead(userId: string) {
    await this.notifRepo.update(
      { userId, isRead: false },
      { isRead: true }
    );
    return { success: true };
  }

  async deleteNotification(id: string, userId: string) {
    const notification = await this.notifRepo.findOne({ where: { id } });
    
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId) throw new ForbiddenException('Access denied');

    await this.notifRepo.remove(notification);
    return { success: true };
  }
}