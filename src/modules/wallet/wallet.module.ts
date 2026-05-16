import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter'; // ADDED: Required for Event Emitter

// Static import at the top of the file
import { UsersModule } from '../users/users.module';

import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { Transaction } from './wallet.entity';
import { AdminWalletService } from './admin-wallet.service';
import { TransactionService } from './transaction.service';

// DO NOT import WebsocketsModule here to avoid Circular Dependency.

@Module({
  imports: [
    // 1. Register Transaction Entity
    TypeOrmModule.forFeature([Transaction]),
    
    // 2. Import UsersModule
    UsersModule,

    // 3. Import EventEmitterModule (Global access usually preferred, but local works too)
    EventEmitterModule, 
  ],
  controllers: [WalletController],
  providers: [
    WalletService,
    AdminWalletService,
    TransactionService, 
  ],
  exports: [
    WalletService,
    AdminWalletService,
    TransactionService, 
  ],
})
export class WalletModule {}