"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginDto = exports.SignupDto = exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const users_service_1 = require("../users/users/users.service");
let AuthService = class AuthService {
    constructor(usersService, jwtService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
    }
    async signup(dto, ip) {
        const hash = await bcrypt.hash(dto.password, 10);
        const createdUsers = await this.usersService.createUser(dto.username, dto.email, hash);
        const user = Array.isArray(createdUsers)
            ? createdUsers[0]
            : createdUsers;
        const token = this.jwtService.sign({
            sub: user.id,
            username: user.username,
            role: user.role,
        });
        return {
            access_token: token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                coinBalance: user.coinBalance,
            },
        };
    }
    async login(dto, ip) {
        const foundUsers = await this.usersService.findByUsername(dto.username);
        const user = Array.isArray(foundUsers)
            ? foundUsers[0]
            : foundUsers;
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        this.usersService.updateLastLoginIp(user.id, ip).catch((err) => {
            console.error('Failed to update login IP:', err);
        });
        const token = this.jwtService.sign({
            sub: user.id,
            username: user.username,
            role: user.role,
        });
        return {
            access_token: token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                coinBalance: user.coinBalance,
                ipAddress: ip,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService])
], AuthService);
class SignupDto {
}
exports.SignupDto = SignupDto;
class LoginDto {
}
exports.LoginDto = LoginDto;
//# sourceMappingURL=auth.service.js.map