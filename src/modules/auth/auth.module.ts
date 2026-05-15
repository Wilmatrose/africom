import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/entities/user.entity';
import { JwtStrategy } from './jwt.strategy';
import { WsJwtGuard } from './ws-jwt.guard'; // 1. Import the Guard
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    forwardRef(() => UsersModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'dev_secret',
        signOptions: { expiresIn: '7d' },
      }),
      global: true, 
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, WsJwtGuard], // 2. Add WsJwtGuard to providers
  exports: [AuthService, WsJwtGuard], // 3. Export WsJwtGuard so GroupsModule can use it
})
export class AuthModule {}