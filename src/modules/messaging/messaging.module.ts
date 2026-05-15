import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import { Message } from '../entities/message.entity';
import { User } from '../users/entities/user.entity';
import { Notification } from '../notifications/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Message, User, Notification])],
  controllers: [MessagingController],
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}