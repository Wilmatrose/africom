import { GroupsService } from './groups.service';
export declare class GroupsController {
    private readonly groupsService;
    constructor(groupsService: GroupsService);
    getAll(): Promise<{
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
        members: import("./entities/group-member.entity").GroupMember[];
        messages: import("./entities/group-message.entity").GroupMessage[];
    }[]>;
    getJoined(req: any): Promise<{
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
        members: import("./entities/group-member.entity").GroupMember[];
        messages: import("./entities/group-message.entity").GroupMessage[];
    }[]>;
    joinByName(req: any, body: {
        name: string;
    }): Promise<import("./entities/group.entity").Group>;
    getDetails(id: string, req: any): Promise<{
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
            role: import("./entities/group-member.entity").GroupMemberRole;
        }[];
    }>;
    getOne(id: string): Promise<import("./entities/group.entity").Group>;
    join(body: {
        inviteLink: string;
    }, req: any): Promise<import("./entities/group.entity").Group>;
    create(file: Express.Multer.File, body: {
        name: string;
        description?: string;
    }, req: any): Promise<{
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
        members: import("./entities/group-member.entity").GroupMember[];
        messages: import("./entities/group-message.entity").GroupMessage[];
    }>;
    update(id: string, body: any, file: Express.Multer.File, req: any): Promise<import("./entities/group.entity").Group>;
    resetLink(id: string, req: any): Promise<import("./entities/group.entity").Group>;
    getMessages(groupId: string): Promise<import("./entities/group-message.entity").GroupMessage[]>;
    sendMessage(groupId: string, file: Express.Multer.File, body: any, req: any): Promise<import("./entities/group-message.entity").GroupMessage>;
    pinMessage(groupId: string, messageId: string, req: any): Promise<import("./entities/group-message.entity").GroupMessage>;
    kickMember(groupId: string, targetUserId: string, req: any): Promise<{
        success: boolean;
    }>;
    promoteMember(groupId: string, targetUserId: string, req: any): Promise<import("./entities/group-member.entity").GroupMember>;
    deleteMessage(groupId: string, messageId: string, req: any): Promise<{
        success: boolean;
    }>;
    clearChat(groupId: string, req: any): Promise<{
        success: boolean;
    }>;
}
