import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TournamentsService } from './tournaments.service';
import { TournamentsController } from './tournaments.controller';
import { 
  Tournament, 
  GroupMessage, 
  TournamentParticipant, 
  TournamentReport 
} from './tournaments.entity';
import { User } from '../users/entities/user.entity';
import { Transaction } from '../wallet/wallet.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tournament, 
      GroupMessage, 
      TournamentParticipant, 
      TournamentReport, // Required for the Report Entity
      User,             // Required for relations (Host/Participant User data)
      Transaction       // Required for Wallet/Payout logic
    ]),
  ],
  controllers: [TournamentsController],
  providers: [TournamentsService],
})
export class TournamentsModule {}