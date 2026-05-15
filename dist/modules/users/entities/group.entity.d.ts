import { User } from './user.entity';
export declare class Group {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    creator: User;
    creatorId: string;
    createdAt: Date;
}
