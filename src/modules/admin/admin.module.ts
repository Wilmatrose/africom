import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminController } from './admin.controller';
import { AdminGuard } from './admin.guard';
import { AdminStatsService } from './admin-stats.service';

import { WalletModule } from '../wallet/wallet.module';
import { UsersModule } from '../users/users.module';

import { Transaction } from '../wallet/wallet.entity';
import { User } from '../users/entities/user.entity';
import { Tournament } from '../tournaments/tournaments.entity';

@Module({
  imports: [
    WalletModule,
    UsersModule,

    TypeOrmModule.forFeature([
      Transaction,
      User,
      Tournament,
    ]),
  ],

  controllers: [AdminController],

  providers: [
    AdminGuard,
    AdminStatsService,
  ],

  exports: [AdminStatsService],
})
export class AdminModule {}