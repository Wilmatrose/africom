import { User } from '../../../modules/users/entities/user.entity';
export declare class Notification {
    id: string;
    userId: string;
    message: string;
    type: string;
    relatedId: string;
    isRead: boolean;
    user: User;
    createdAt: Date;
}
