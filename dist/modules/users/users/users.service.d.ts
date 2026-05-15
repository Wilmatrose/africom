import { Repository } from 'typeorm';
import { User, UserRole, KYCStatus } from '../entities/user.entity';
export declare class UsersService {
    private readonly userRepo;
    constructor(userRepo: Repository<User>);
    createUser(username: string, email: string, passwordHash: string): Promise<User>;
    findByUsername(username: string): Promise<User>;
    findById(id: string): Promise<User>;
    getPublicProfile(targetId: string, requesterId?: string): Promise<{
        isOwner: boolean;
        isFollowing: boolean;
        followersCount: number;
        followingCount: number;
        id: string;
        username: string;
        email: string;
        passwordHash: string;
        role: UserRole;
        avatarUrl: string;
        bio: string;
        fullName: string;
        idCardUrl: string;
        verificationVideoUrl: string;
        kycStatus: KYCStatus;
        followers: User[];
        following: User[];
        coinBalance: number;
        lastLoginIp: string | null;
        createdAt: Date;
        updatedAt: Date;
    } | {
        id: string;
        username: string;
        avatarUrl: string;
        bio: string;
        role: UserRole;
        createdAt: Date;
        followersCount: number;
        followingCount: number;
        isFollowing: boolean;
        isOwner: boolean;
    }>;
    toggleFollow(currentUserId: string, targetUserId: string): Promise<{
        success: boolean;
        isFollowing: boolean;
        message: string;
    }>;
    getFollowers(userId: string): Promise<{
        id: string;
        username: string;
        role: UserRole;
        avatarUrl: string;
        bio: string;
        fullName: string;
        followersCount: number;
        followingCount: number;
        followers: User[];
        following: User[];
        lastLoginIp: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getFollowing(userId: string): Promise<{
        id: string;
        username: string;
        role: UserRole;
        avatarUrl: string;
        bio: string;
        fullName: string;
        followersCount: number;
        followingCount: number;
        followers: User[];
        following: User[];
        lastLoginIp: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    private sanitizeUser;
    getAllUsers(): Promise<{
        id: string;
        username: string;
        email: string;
        role: UserRole;
        coinBalance: number;
        kycStatus: KYCStatus;
        createdAt: Date;
        ipAddress: string;
        status: any;
    }[]>;
    getUsersByRole(role: UserRole): Promise<User[]>;
    banUser(id: string): Promise<{
        message: string;
    }>;
    unbanUser(id: string): Promise<{
        message: string;
    }>;
    increaseBalance(userId: string, amount: number): Promise<User>;
    decreaseBalance(userId: string, amount: number): Promise<User>;
    getPendingKyc(): Promise<User[]>;
    requestCreatorUpgrade(userId: string, fullName: string, idCardUrl: string, verificationVideoUrl: string): Promise<{
        message: string;
    }>;
    approveCreator(userId: string): Promise<User>;
    rejectCreator(userId: string): Promise<User>;
    updateProfile(userId: string, updates: Partial<User>): Promise<User>;
    updateAvatar(userId: string, avatarUrl: string): Promise<User>;
    changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    getUserStats(): Promise<{
        totalUsers: number;
        fans: number;
        creators: number;
        pendingKyc: number;
    }>;
    updateLastLoginIp(userId: string, ip: string): Promise<void>;
    getPendingKycCount(): Promise<number>;
}
