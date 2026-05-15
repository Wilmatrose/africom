import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMe(req: any): Promise<import("../entities/user.entity").User>;
    updateMyProfile(req: any, updates: any): Promise<import("../entities/user.entity").User>;
    changePassword(req: any, body: {
        oldPassword: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
    uploadAvatar(req: any, file: Express.Multer.File): Promise<{
        success: boolean;
        message: string;
        avatarUrl: string;
    }>;
    submitKyc(req: any, body: any, files: {
        idCard?: Express.Multer.File[];
        verificationVideo?: Express.Multer.File[];
    }): Promise<{
        message: string;
    }>;
    getUser(id: string): Promise<import("../entities/user.entity").User>;
    banUser(id: string): Promise<{
        message: string;
    }>;
    unbanUser(id: string): Promise<{
        message: string;
    }>;
    approveKyc(id: string): Promise<import("../entities/user.entity").User>;
    rejectKyc(id: string): Promise<import("../entities/user.entity").User>;
}
