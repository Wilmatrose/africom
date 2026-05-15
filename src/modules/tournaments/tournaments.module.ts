import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TournamentsService } from './tournaments.service';
import { TournamentsController } from './tournaments.controller';
import { Tournament, GroupMessage, TournamentParticipant } from './tournaments.entity';
import { User } from '../users/entities/user.entity';
// Import the Transaction Entity
import { Transaction } from '../wallet/wallet.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tournament, 
      GroupMessage, 
      TournamentParticipant, 
      User,
      Transaction // Registered here
    ]),
    // NO WalletModule or TransactionService import
  ],
  controllers: [TournamentsController],
  providers: [TournamentsService],
})
export class TournamentsModule {}