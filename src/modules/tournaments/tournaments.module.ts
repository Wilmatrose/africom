import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TournamentsService } from './tournaments.service';
import { TournamentsController } from './tournaments.controller';
import { 
  Tournament, 
  GroupMessage, 
  TournamentParticipant, 
  TournamentReport,
  TournamentMatch // <--- 1. Import the new Entity
} from './tournaments.entity';
import { User } from '../users/entities/user.entity';
import { Transaction } from '../wallet/wallet.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tournament, 
      GroupMessage, 
      TournamentParticipant, 
      TournamentReport,
      TournamentMatch, // <--- 2. Add it to the features list
      User,
      Transaction 
    ]),
  ],
  controllers: [TournamentsController],
  providers: [TournamentsService],
})
export class TournamentsModule {}