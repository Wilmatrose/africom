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
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

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

  // FIX: Static routes MUST come before dynamic routes (like ':id')
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

  // FIX: Dynamic route ':id' comes AFTER static routes
  @Get(':id/details')
  async getDetails(@Param('id') id: string, @Req() req: any) {
    return this.groupsService.getGroupDetails(id, req.user.id);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.groupsService.findById(id);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/groups',
        filename: (req, file, callback) => {
          const uniqueName = uuidv4();
          const extension = extname(file.originalname);
          callback(null, `${uniqueName}${extension}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(new BadRequestException('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
    }),
  )
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { name: string; description?: string },
    @Req() req: any,
  ) {
    if (!body.name) throw new BadRequestException('Group name is required');

    // FIX: Dynamic URL
    const fileUrl = file 
      ? `${req.protocol}://${req.get('host')}/uploads/groups/${file.filename}` 
      : undefined;

    return this.groupsService.create(body.name, body.description || '', req.user.id, fileUrl);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file', {
      storage: diskStorage({ destination: './uploads/groups', filename: (req, file, cb) => {
          const uniqueName = uuidv4();
          cb(null, `${uniqueName}${extname(file.originalname)}`);
      }})
  }))
  async update(
    @Param('id') id: string,
    @Body() body: any, 
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    // FIX: Dynamic URL
    const imageUrl = file 
      ? `${req.protocol}://${req.get('host')}/uploads/groups/${file.filename}` 
      : undefined;
    
    const lockGroup = body.lockGroup === 'true';
    const disappearingTimer = body.disappearingTimer ? parseInt(body.disappearingTimer) : undefined;

    return this.groupsService.updateGroup(id, req.user.id, {
      name: body.name,
      description: body.description,
      imageUrl,
      lockGroup,
      disappearingTimer
    });
  }

  @Post(':id/reset-link')
  async resetLink(@Param('id') id: string, @Req() req: any) {
    return this.groupsService.resetInviteLink(id, req.user.id);
  }

  // =========================
  // CHAT SYSTEM
  // =========================

  @Get(':id/messages')
  async getMessages(@Param('id') groupId: string) {
    return this.groupsService.getMessages(groupId);
  }

  @Post(':id/messages')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/chat',
        filename: (req, file, callback) => {
          const uniqueName = uuidv4();
          callback(null, `${uniqueName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async sendMessage(
    @Param('id') groupId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Req() req: any,
  ) {
    const content = body.content || '';
    
    // FIX: Dynamic URL
    const imageUrl = file 
      ? `${req.protocol}://${req.get('host')}/uploads/chat/${file.filename}` 
      : undefined;
      
    const replyToId = body.replyToId; 

    return this.groupsService.sendMessage(groupId, req.user.id, content, imageUrl, replyToId);
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
}