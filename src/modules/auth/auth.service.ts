import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { UsersService } from '../users/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // =========================
  // SIGNUP
  // =========================
  async signup(dto: SignupDto, ip: string) {
    const hash = await bcrypt.hash(dto.password, 10);

    const createdUsers = await this.usersService.createUser(
      dto.username,
      dto.email,
      hash,
    );

    const user = Array.isArray(createdUsers)
      ? createdUsers[0]
      : createdUsers;

    // Optional: Save IP on signup as well
    // await this.usersService.updateLastLoginIp(user.id, ip);

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

  // =========================
  // LOGIN
  // =========================
  async login(dto: LoginDto, ip: string) {
    const foundUsers =
      await this.usersService.findByUsername(
        dto.username,
      );

    const user = Array.isArray(foundUsers)
      ? foundUsers[0]
      : foundUsers;

    if (!user) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    const isValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isValid) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    // =========================
    // UPDATE IP ADDRESS
    // =========================
    // We use updateLastLoginIp (which you will add to UsersService)
    // We don't await this to avoid slowing down the login response
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
        ipAddress: ip, // Return the IP so the frontend updates immediately
      },
    };
  }
}

// =========================
// DTOs
// =========================
export class SignupDto {
  username!: string;
  email!: string;
  password!: string;
}

export class LoginDto {
  username!: string;
  password!: string;
}