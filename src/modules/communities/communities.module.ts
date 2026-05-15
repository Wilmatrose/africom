import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunitiesService } from './communities.service';
import { CommunitiesController } from './communities.controller';
import { Community, CommunityPost, CommunityParticipant } from './communities.entity';
import { User } from '../users/entities/user.entity';
import { Transaction } from '../wallet/wallet.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Community, 
      CommunityPost, 
      CommunityParticipant, 
      User,
      Transaction // Required for wallet access
    ])
  ],
  controllers: [CommunitiesController],
  providers: [CommunitiesService],
  
})
export class CommunitiesModule {}