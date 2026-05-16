import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('messaging')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  // =========================
  // STATIC ROUTES FIRST
  // =========================

  @Get('inbox')
  async getInbox(@Req() req: any) {
    return this.messagingService.getInbox(req.user.id);
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    return this.messagingService.getUnreadCount(req.user.id);
  }

  // =========================
  // SEND MESSAGE (With Image Upload)
  // =========================

  @Post('send')
  @UseInterceptors(FileInterceptor('file')) // Uses Memory Storage from CommonModule
  async sendMessage(
    @Req() req: any,
    @Body() body: { receiverId: string; content: string }, // Removed imageUrl from Body
    @UploadedFile() file: Express.Multer.File, // Added File parameter
  ) {
    return this.messagingService.sendMessage(
      req.user.id,
      body.receiverId,
      body.content,
      file // Pass the file to the service
    );
  }

  @Patch('accept/:id')
  async acceptRequest(@Param('id') id: string, @Req() req: any) {
    return this.messagingService.acceptRequest(id, req.user.id);
  }

  @Patch('read/:senderId')
  async markRead(@Param('senderId') senderId: string, @Req() req: any) {
    return this.messagingService.markAsRead(req.user.id, senderId);
  }

  // =========================
  // DYNAMIC ROUTE LAST
  // =========================

  @Get(':userId')
  async getMessages(@Param('userId') userId: string, @Req() req: any) {
    return this.messagingService.getMessages(req.user.id, userId);
  }
}