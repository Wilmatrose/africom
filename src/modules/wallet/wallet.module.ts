import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { Transaction } from './wallet.entity';
import { AdminWalletService } from './admin-wallet.service';
import { TransactionService } from './transaction.service';
import { WebsocketsModule } from '../websockets/websockets.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    // Register Transaction Entity
    TypeOrmModule.forFeature([Transaction]),
    
    WebsocketsModule,
    UsersModule, 
  ],
  controllers: [WalletController],
  providers: [
    WalletService,
    AdminWalletService,
   
    TransactionService, // Register the helper service
  ],
  exports: [
    WalletService,
    AdminWalletService,
    
    TransactionService, // Export so Tournaments/Communities can use it
  ],
})
export class WalletModule {}