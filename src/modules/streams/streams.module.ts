import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StreamsService } from './streams.service';
import { StreamsController } from './streams.controller';
import { StreamsGateway } from './streams.gateway'; // IMPORT THE GATEWAY
import { LiveSession } from './streams.entity';
import { User } from '../users/entities/user.entity'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([LiveSession, User]) // Added User to imports
  ],
  controllers: [StreamsController],
  providers: [StreamsService, StreamsGateway], // ADDED StreamsGateway
})
export class StreamsModule {}