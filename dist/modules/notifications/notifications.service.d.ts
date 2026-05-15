import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
export declare class NotificationsService {
    private readonly notifRepo;
    constructor(notifRepo: Repository<Notification>);
    getUserNotifications(userId: string): Promise<Notification[]>;
    markAsRead(id: string, userId: string): Promise<Notification>;
    markAllAsRead(userId: string): Promise<{
        success: boolean;
    }>;
    deleteNotification(id: string, userId: string): Promise<{
        success: boolean;
    }>;
}
