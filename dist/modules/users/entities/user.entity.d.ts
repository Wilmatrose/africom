export declare enum UserRole {
    FAN = "FAN",
    CREATOR = "CREATOR",
    ADMIN = "ADMIN",
    COMMUNITY_LEAD = "COMMUNITY_LEAD"
}
export declare enum KYCStatus {
    NONE = "NONE",
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export declare class User {
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
    followersCount: number;
    followingCount: number;
    followers: User[];
    following: User[];
    coinBalance: number;
    lastLoginIp: string | null;
    createdAt: Date;
    updatedAt: Date;
}
