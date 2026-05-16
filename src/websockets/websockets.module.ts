import { Module } from '@nestjs/common';
import { WebsocketsGateway } from './websockets.gateway';

// --- FIXED IMPORTS BELOW ---

// 1. Import WalletModule from the modules folder
import { WalletModule } from '../modules/wallet/wallet.module';

// 2. Import UsersModule (assuming flat structure)
import { UsersModule } from '../modules/users/users.module';

@Module({
  imports: [
    WalletModule,
    UsersModule,
  ],
  providers: [
    WebsocketsGateway,
  ],
  exports: [
    WebsocketsGateway,
  ],
})
export class WebsocketsModule {}