import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getMyNotifications(req: any): Promise<import("./notification.entity").Notification[]>;
    markAsRead(id: string, req: any): Promise<import("./notification.entity").Notification>;
    markAllAsRead(req: any): Promise<{
        success: boolean;
    }>;
    deleteNotification(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
