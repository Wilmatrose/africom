import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { GroupsGateway } from './groups.gateway';

// Entity Imports
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { GroupMessage } from './entities/group-message.entity';
import { GroupMessageReaction } from './entities/group-message-reaction.entity'; // <--- ADDED IMPORT
import { Notification } from '../notifications/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Group, 
      GroupMember,
      GroupMessage,
      GroupMessageReaction, // <--- ADDED ENTITY
      Notification,
    ]),
    forwardRef(() => AuthModule),
    EventEmitterModule.forRoot(),
  ],
  controllers: [GroupsController],
  providers: [GroupsService, GroupsGateway],
  exports: [GroupsService],
})
export class GroupsModule {}