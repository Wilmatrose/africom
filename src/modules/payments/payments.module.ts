import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { WalletModule } from '../wallet/wallet.module';
import { TypeOrmModule } from '@nestjs/typeorm'; // Import TypeOrmModule
import { User } from '../users/entities/user.entity'; // Import User Entity

@Module({
  imports: [WalletModule, TypeOrmModule.forFeature([User])], // Add User to imports
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}