import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TournamentsService } from './tournaments.service';
import { TournamentsController } from './tournaments.controller';
import { 
  Tournament, 
  GroupMessage, 
  TournamentParticipant, 
  TournamentReport // <--- 1. Ensure this is imported
} from './tournaments.entity';
import { User } from '../users/entities/user.entity';
import { Transaction } from '../wallet/wallet.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tournament, 
      GroupMessage, 
      TournamentParticipant, 
      TournamentReport, // <--- 2. Add it here
      User,
      Transaction 
    ]),
  ],
  controllers: [TournamentsController],
  providers: [TournamentsService],
})
export class TournamentsModule {}