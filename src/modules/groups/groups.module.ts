import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { EventEmitterModule } from '@nestjs/event-emitter'; // Import EventEmitterModule

import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { GroupsGateway } from './groups.gateway'; // Import Gateway
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { GroupMessage } from './entities/group-message.entity';
import { Notification } from '../notifications/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Group, 
      GroupMember,
      GroupMessage,
      Notification,
    ]),
    forwardRef(() => AuthModule),
    EventEmitterModule.forRoot(), // Enable Event Emitter
  ],
  controllers: [GroupsController],
  providers: [GroupsService, GroupsGateway], // Add Gateway to providers
  exports: [GroupsService],
})
export class GroupsModule {}