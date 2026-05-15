import { User } from '../../users/entities/user.entity';
import { Group } from './group.entity';
export declare enum GroupMemberRole {
    ADMIN = "ADMIN",
    MEMBER = "MEMBER"
}
export declare class GroupMember {
    id: string;
    groupId: string;
    userId: string;
    role: GroupMemberRole;
    group: Group;
    user: User;
}
