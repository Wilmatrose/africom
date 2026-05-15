import { Repository, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Group } from './entities/group.entity';
import { GroupMember, GroupMemberRole } from './entities/group-member.entity';
import { GroupMessage } from './entities/group-message.entity';
import { Notification } from '../notifications/notification.entity';
export declare class GroupsService {
    private readonly groupRepo;
    private readonly memberRepo;
    private readonly messageRepo;
    private readonly notifRepo;
    private dataSource;
    private readonly eventEmitter;
    constructor(groupRepo: Repository<Group>, memberRepo: Repository<GroupMember>, messageRepo: Repository<GroupMessage>, notifRepo: Repository<Notification>, dataSource: DataSource, eventEmitter: EventEmitter2);
    private sanitizeUser;
    create(name: string, description: string, creatorId: string, fileUrl?: string): Promise<{
        creator: {
            id: any;
            username: any;
            avatarUrl: any;
            role: any;
        };
        id: string;
        name: string;
        description: string;
        imageUrl: string;
        profilePicUrl: string;
        inviteLink: string;
        lockGroup: boolean;
        disappearingTimer: number;
        creatorId: string;
        createdAt: Date;
        members: GroupMember[];
        messages: GroupMessage[];
    }>;
    joinByName(userId: string, groupName: string): Promise<Group>;
    join(userId: string, inviteLink: string): Promise<Group>;
    findAll(): Promise<{
        creator: {
            id: any;
            username: any;
            avatarUrl: any;
            role: any;
        };
        id: string;
        name: string;
        description: string;
        imageUrl: string;
        profilePicUrl: string;
        inviteLink: string;
        lockGroup: boolean;
        disappearingTimer: number;
        creatorId: string;
        createdAt: Date;
        members: GroupMember[];
        messages: GroupMessage[];
    }[]>;
    findJoined(userId: string): Promise<{
        creator: {
            id: any;
            username: any;
            avatarUrl: any;
            role: any;
        };
        id: string;
        name: string;
        description: string;
        imageUrl: string;
        profilePicUrl: string;
        inviteLink: string;
        lockGroup: boolean;
        disappearingTimer: number;
        creatorId: string;
        createdAt: Date;
        members: GroupMember[];
        messages: GroupMessage[];
    }[]>;
    findById(id: string): Promise<Group>;
    getGroupDetails(groupId: string, userId: string): Promise<{
        id: string;
        name: string;
        description: string;
        imageUrl: string;
        inviteLink: string;
        lockGroup: any;
        disappearingTimer: any;
        members: {
            id: string;
            username: string;
            avatarUrl: string;
            role: GroupMemberRole;
        }[];
    }>;
    updateGroup(groupId: string, userId: string, updates: any): Promise<Group>;
    resetInviteLink(groupId: string, userId: string): Promise<Group>;
    sendMessage(groupId: string, senderId: string, content: string, imageUrl?: string, replyToId?: string): Promise<GroupMessage>;
    getMessages(groupId: string): Promise<GroupMessage[]>;
    private checkAdmin;
    pinMessage(groupId: string, messageId: string, userId: string): Promise<GroupMessage>;
    kickMember(groupId: string, targetUserId: string, adminId: string): Promise<{
        success: boolean;
    }>;
    promoteMember(groupId: string, targetUserId: string, adminId: string): Promise<GroupMember>;
    deleteMessage(groupId: string, messageId: string, userId: string): Promise<{
        success: boolean;
    }>;
    clearGroupChat(groupId: string, userId: string): Promise<{
        success: boolean;
    }>;
}
