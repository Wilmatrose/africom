import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    
    let token = client.handshake.auth?.token || client.handshake.headers?.authorization;

    if (!token) {
      throw new WsException('Unauthorized: No token provided');
    }

    if (token.startsWith('Bearer ')) {
      token = token.split(' ')[1];
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET') || 'dev_secret';
      const payload = await this.jwtService.verifyAsync(token, { secret });
      client.data.user = payload;
      return true;
    } catch (err: unknown) {
      // FIX: Handle 'unknown' type safely
      let message = 'Invalid token';
      if (err instanceof Error) {
        message = err.message;
      }
      console.error("WS Auth Error:", message);
      throw new WsException('Unauthorized: ' + message);
    }
  }
}