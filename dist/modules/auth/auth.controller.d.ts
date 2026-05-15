import { Request } from 'express';
import { AuthService, SignupDto, LoginDto } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    signup(body: SignupDto, req: Request): Promise<{
        access_token: string;
        user: {
            id: any;
            username: any;
            email: any;
            role: any;
            coinBalance: any;
        };
    }>;
    login(body: LoginDto, req: Request): Promise<{
        access_token: string;
        user: {
            id: any;
            username: any;
            email: any;
            role: any;
            coinBalance: any;
            ipAddress: string;
        };
    }>;
    fixPassword(): Promise<{
        message: string;
        hash_preview: string;
    }>;
}
