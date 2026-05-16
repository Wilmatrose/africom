import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Feature Modules
import { UsersModule } from './modules/users/users.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { StreamsModule } from './modules/streams/streams.module';
import { WebsocketsModule } from './modules/websockets/websockets.module';
import { TournamentsModule } from './modules/tournaments/tournaments.module';
import { CommunitiesModule } from './modules/communities/communities.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { GroupsModule } from './modules/groups/groups.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MessagingModule } from './modules/messaging/messaging.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        
        // Connects using the URL from Render Environment Variables
        url: config.get<string>('DATABASE_URL'), 
        
        // Required for Render PostgreSQL
        ssl: {
          rejectUnauthorized: false,
        },

        autoLoadEntities: true,
        
        // ✅ ENABLED: This creates the database tables automatically
        synchronize: true, 
        
        logging: process.env.NODE_ENV !== 'production',
      }),
    }),

    UsersModule,
    WalletModule,
    PaymentsModule,
    StreamsModule,
    WebsocketsModule,
    AuthModule,
    AdminModule,
    TournamentsModule,
    CommunitiesModule,
    GroupsModule,
    NotificationsModule,
    MessagingModule,
  ],
})
export class AppModule {}