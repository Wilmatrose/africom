import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { UsersService } from './users/users.service';
import { UsersController } from './users/users.controller';

import { CommonModule } from '../../common/common.module'; // ✅ IMPORT CommonModule

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    CommonModule, // ✅ IMPORT IT HERE
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}