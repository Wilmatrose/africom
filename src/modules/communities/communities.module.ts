import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunitiesService } from './communities.service';
import { CommunitiesController } from './communities.controller';
import { Community, CommunityPost, CommunityParticipant, CommunityPostReaction } from './communities.entity';
import { User } from '../users/entities/user.entity';
import { Transaction } from '../wallet/wallet.entity';

// Import CommonModule explicitly to access FilesService
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    // 1. Register Entities for Database Access
    TypeOrmModule.forFeature([
      Community, 
      CommunityPost, 
      CommunityParticipant, 
      CommunityPostReaction,
      User,
      Transaction 
    ]),
    
    // 2. Import CommonModule to get access to FilesService (for image uploads)
    CommonModule, 
  ],
  controllers: [CommunitiesController],
  providers: [CommunitiesService],
  // 3. Export Service if other modules need to use community logic
  exports: [CommunitiesService],
})
export class CommunitiesModule {}