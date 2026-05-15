import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Modules
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
import { NotificationsModule } from './modules/notifications/notifications.module'; // NEW
import { MessagingModule } from './modules/messaging/messaging.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ONLY ONE DATABASE CONNECTION
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST') ?? 'localhost',
        port: Number(config.get('DB_PORT')) ?? 5432,
        username: config.get('DB_USER') ?? 'postgres',
        password: config.get('DB_PASSWORD') ?? 'root',
        database: config.get('DB_NAME') ?? 'africom_db',

        autoLoadEntities: true, // IMPORTANT (Automatically loads Notification entity)
        synchronize: false,
        logging: true,
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
    MessagingModule, // NEW
  ],
})
export class AppModule {}