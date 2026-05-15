import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users/users.service';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    signup(dto: SignupDto, ip: string): Promise<{
        access_token: string;
        user: {
            id: any;
            username: any;
            email: any;
            role: any;
            coinBalance: any;
        };
    }>;
    login(dto: LoginDto, ip: string): Promise<{
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
}
export declare class SignupDto {
    username: string;
    email: string;
    password: string;
}
export declare class LoginDto {
    username: string;
    password: string;
}
