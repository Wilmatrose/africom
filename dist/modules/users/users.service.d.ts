import { Repository } from 'typeorm';
import { User, UserRole, KYCStatus } from './entities/user.entity';
export declare class UsersService {
    private readonly userRepo;
    constructor(userRepo: Repository<User>);
    createUser(username: string, email: string, passwordHash: string): Promise<User>;
    findByUsername(username: string): Promise<User>;
    findById(id: string): Promise<User>;
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
    requestCreatorUpgrade(userId: string, fullName: string, idCardUrl: string, verificationVideoUrl: string): Promise<{
        message: string;
    }>;
    approveCreator(userId: string): Promise<User>;
    updateProfile(userId: string, updates: Partial<User>): Promise<User>;
    updateAvatar(userId: string, avatarUrl: string): Promise<User>;
    getUserStats(): Promise<{
        totalUsers: number;
        fans: number;
        creators: number;
        pendingKyc: number;
    }>;
    updateLastLoginIp(userId: string, ip: string): Promise<void>;
    getPendingKycCount(): Promise<number>;
}
