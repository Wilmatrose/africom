import { Controller, Get, Post, Body, Param, UseGuards, Req, Patch } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('messaging')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  // The service is named 'msgService' here
  constructor(private readonly msgService: MessagingService) {}

  @Get('inbox')
  async getInbox(@Req() req: any) {
    return this.msgService.getInbox(req.user.id);
  }

  @Get(':userId')
  async getMessages(@Param('userId') otherUserId: string, @Req() req: any) {
    return this.msgService.getMessages(req.user.id, otherUserId);
  }

  @Post('send')
  async send(
    @Body() body: { receiverId: string; content: string; imageUrl?: string },
    @Req() req: any
  ) {
    return this.msgService.sendMessage(req.user.id, body.receiverId, body.content, body.imageUrl);
  }

  @Patch('accept/:id')
  async accept(@Param('id') id: string, @Req() req: any) {
    return this.msgService.acceptRequest(req.user.id, id);
  }

  // FIXED: Used 'msgService' instead of 'messagingService'
  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    return this.msgService.getUnreadCount(req.user.id);
  }

  // NEW: Mark messages as read when opening a chat
  @Patch('read/:senderId')
  async markAsRead(@Req() req: any, @Param('senderId') senderId: string) {
    return this.msgService.markMessagesAsRead(req.user.id, senderId);
  }
}