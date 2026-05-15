import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StreamsService } from './streams.service';
import { StreamsController } from './streams.controller';
import { LiveSession } from './streams.entity';
import { User } from '../users/entities/user.entity'; 

@Module({
  imports: [TypeOrmModule.forFeature([LiveSession])],
  controllers: [StreamsController],
  providers: [StreamsService],
})
export class StreamsModule {}