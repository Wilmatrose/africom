import { Module } from '@nestjs/common';
import { WebsocketsGateway } from './websockets.gateway';

@Module({
  providers: [WebsocketsGateway],
  exports: [WebsocketsGateway], // Export if other services need to emit events
})
export class WebsocketsModule {}