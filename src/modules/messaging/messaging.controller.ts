import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('messaging')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  // =========================
  // STATIC ROUTES FIRST (CRITICAL FOR ROUTING)
  // =========================

  @Get('inbox')
  async getInbox(@Req() req: any) {
    return this.messagingService.getInbox(req.user.id);
  }

  @Get('unread-count') // ✅ Correct Position
  async getUnreadCount(@Req() req: any) {
    return this.messagingService.getUnreadCount(req.user.id);
  }

  @Post('send')
  async sendMessage(
    @Body() body: { receiverId: string; content: string; imageUrl?: string },
    @Req() req: any,
  ) {
    return this.messagingService.sendMessage(
      req.user.id,
      body.receiverId,
      body.content,
      body.imageUrl,
    );
  }

  @Patch('accept/:id')
  async acceptRequest(@Param('id') id: string, @Req() req: any) {
    return this.messagingService.acceptRequest(id, req.user.id);
  }

  @Patch('read/:senderId')
  async markRead(@Param('senderId') senderId: string, @Req() req: any) {
    // Make sure you implemented the method in messaging.service.ts as shown above
    return this.messagingService.markAsRead(req.user.id, senderId);
  }

  // =========================
  // DYNAMIC ROUTE LAST
  // =========================

  @Get(':userId') // ✅ Must be at the bottom
  async getMessages(@Param('userId') userId: string, @Req() req: any) {
    return this.messagingService.getMessages(req.user.id, userId);
  }
}