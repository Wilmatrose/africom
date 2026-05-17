import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunitiesService } from './communities.service';
import { CommunitiesController } from './communities.controller';
import { Community, CommunityPost, CommunityParticipant } from './communities.entity';
import { User } from '../users/entities/user.entity';
import { Transaction } from '../wallet/wallet.entity';

// Import CommonModule explicitly
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Community, 
      CommunityPost, 
      CommunityParticipant, 
      User,
      Transaction 
    ]),
    CommonModule, // <--- Import CommonModule here
  ],
  controllers: [CommunitiesController],
  providers: [CommunitiesService],
})
export class CommunitiesModule {}