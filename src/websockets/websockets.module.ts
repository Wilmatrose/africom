import { Module } from '@nestjs/common';
// REMOVED: Import of ClientsModule to fix missing module error

// Import the Gateway
import { WebsocketsGateway } from './websockets.gateway';

@Module({
  imports: [
    // REMOVED: ClientsModule
    // Note: @WebSocketServer() decorator in the Gateway might complain if you are on an old Nest version.
    // If you see "is not a provider" error later, we might need to install the package properly.
    // For now, this allows the app to start.
  ],
  providers: [
    WebsocketsGateway, // Register the Gateway
  ],
  exports: [
    WebsocketsGateway,
  ],
})
export class WebsocketsModule {}