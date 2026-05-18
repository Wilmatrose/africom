import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StreamsService } from './streams.service';
import { StreamsController } from './streams.controller';
import { StreamsGateway } from './streams.gateway';
import { LiveSession } from './streams.entity';
import { User } from '../users/entities/user.entity'; 

@Module({
  imports: [
    // Register repositories for LiveSession and User
    // User is needed here because LiveSession has a @ManyToOne relation to it
    TypeOrmModule.forFeature([LiveSession, User])
  ],
  controllers: [StreamsController],
  providers: [
    StreamsService, 
    StreamsGateway // The Gateway handles real-time websocket connections
  ],
})
export class StreamsModule {}