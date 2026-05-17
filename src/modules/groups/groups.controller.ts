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
  BadRequestException,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
// Removed: diskStorage, uuid, extname imports (no longer needed for Cloudinary)

import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  // =========================
  // GROUP MANAGEMENT
  // =========================

  @Get()
  async getAll() {
    return this.groupsService.findAll();
  }

  @Get('joined')
  async getJoined(@Req() req: any) {
    return this.groupsService.findJoined(req.user.id);
  }

  @Post('join-by-name')
  async joinByName(@Req() req: any, @Body() body: { name: string }) {
    return this.groupsService.joinByName(req.user.id, body.name);
  }

  @Post('join')
  async join(
    @Body() body: { inviteLink: string },
    @Req() req: any,
  ) {
    return this.groupsService.join(req.user.id, body.inviteLink);
  }

  @Get(':id/details')
  async getDetails(@Param('id') id: string, @Req() req: any) {
    return this.groupsService.getGroupDetails(id, req.user.id);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.groupsService.findById(id);
  }

  // =========================
  // CREATE GROUP
  // =========================
  @Post()
  @UseInterceptors(FileInterceptor('file')) // Uses Memory Storage from CommonModule
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { name: string; description?: string },
    @Req() req: any,
  ) {
    if (!body.name) throw new BadRequestException('Group name is required');

    // Pass the FILE object to the service. The service will upload to Cloudinary.
    return this.groupsService.create(body.name, body.description || '', req.user.id, file);
  }

  // =========================
  // UPDATE GROUP
  // =========================
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: string,
    @Body() body: any, 
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const lockGroup = body.lockGroup === 'true' || body.lockGroup === true;
    const disappearingTimer = body.disappearingTimer ? parseInt(body.disappearingTimer) : undefined;

    // Pass the file inside the updates object. The service will handle the Cloudinary upload.
    return this.groupsService.updateGroup(id, req.user.id, {
      name: body.name,
      description: body.description,
      file, // Passing the file here
      lockGroup,
      disappearingTimer
    });
  }

  @Post(':id/reset-link')
  async resetLink(@Param('id') id: string, @Req() req: any) {
    return this.groupsService.resetInviteLink(id, req.user.id);
  }

  // =========================
  // DELETE GROUP (CREATOR ONLY)
  // =========================
  @Delete(':id')
  async deleteGroup(@Param('id') id: string, @Req() req: any) {
    return this.groupsService.deleteGroup(id, req.user.id);
  }

  // =========================
  // CHAT SYSTEM
  // =========================

  @Get(':id/messages')
  async getMessages(@Param('id') groupId: string) {
    return this.groupsService.getMessages(groupId);
  }

  @Post(':id/messages')
  @UseInterceptors(FileInterceptor('file'))
  async sendMessage(
    @Param('id') groupId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Req() req: any,
  ) {
    const content = body.content || '';
    const replyToId = body.replyToId; 

    // Pass the file to the service. It will handle the Cloudinary upload.
    return this.groupsService.sendMessage(groupId, req.user.id, content, file, replyToId);
  }

  @Patch(':id/messages/:messageId/pin')
  async pinMessage(
    @Param('id') groupId: string,
    @Param('messageId') messageId: string,
    @Req() req: any,
  ) {
    return this.groupsService.pinMessage(groupId, messageId, req.user.id);
  }

  // =========================
  // ADMIN POWERS
  // =========================

  @Post(':id/kick/:userId')
  async kickMember(
    @Param('id') groupId: string,
    @Param('userId') targetUserId: string,
    @Req() req: any,
  ) {
    return this.groupsService.kickMember(groupId, targetUserId, req.user.id);
  }

  @Post(':id/promote/:userId')
  async promoteMember(
    @Param('id') groupId: string,
    @Param('userId') targetUserId: string,
    @Req() req: any,
  ) {
    return this.groupsService.promoteMember(groupId, targetUserId, req.user.id);
  }

  @Delete(':id/messages/:messageId')
  async deleteMessage(
    @Param('id') groupId: string,
    @Param('messageId') messageId: string,
    @Req() req: any,
  ) {
    return this.groupsService.deleteMessage(groupId, messageId, req.user.id);
  }

  @Delete(':id/messages')
  async clearChat(
    @Param('id') groupId: string,
    @Req() req: any,
  ) {
    return this.groupsService.clearGroupChat(groupId, req.user.id);
  }


    // =========================
  // REACTIONS
  // =========================

  @Post(':id/messages/:messageId/reactions')
  async toggleReaction(
    @Param('id') groupId: string,
    @Param('messageId') messageId: string,
    @Body() body: { emoji: string },
    @Req() req: any,
  ) {
    return this.groupsService.toggleReaction(groupId, messageId, req.user.id, body.emoji);
  }
}