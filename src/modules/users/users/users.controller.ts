import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Put,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';

import {
  FileInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';

// Removed: diskStorage, uuid, extname imports

import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../admin/roles.decorator';
import { AdminGuard } from '../../admin/admin.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // =========================
  // USER PROFILE ROUTES
  // =========================

  @Get('me')
  async getMe(@Req() req: any) {
    return this.usersService.findById(req.user.id);
  }

  @Put('me')
  async updateMyProfile(
    @Req() req: any,
    @Body() updates: any,
  ) {
    return this.usersService.updateProfile(
      req.user.id,
      updates,
    );
  }

  // =========================
  // CHANGE PASSWORD
  // =========================
  @Post('me/password')
  async changePassword(
    @Req() req: any,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    return this.usersService.changePassword(
      req.user.id,
      body.oldPassword,
      body.newPassword,
    );
  }

  // =========================
  // AVATAR UPLOAD (CLOUDINARY)
  // =========================

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file')) // Uses Memory Storage from CommonModule
  async uploadAvatar(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Pass the FILE to the service. The service uploads to Cloudinary and returns the URL.
    return this.usersService.updateAvatar(req.user.id, file);
  }

  // =========================
  // KYC UPLOAD (CLOUDINARY)
  // =========================

  @Post('me/kyc')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'idCard', maxCount: 1 },
        { name: 'verificationVideo', maxCount: 1 },
      ],
      // Uses Memory Storage from CommonModule
    ),
  )
  async submitKyc(
    @Req() req: any,
    @Body() body: { fullName?: string },
    @UploadedFiles()
    files: {
      idCard?: Express.Multer.File[];
      verificationVideo?: Express.Multer.File[];
    },
  ) {
    const idCardFile = files.idCard?.[0];
    const videoFile = files.verificationVideo?.[0];

    if (!idCardFile || !videoFile) {
      throw new BadRequestException('Both ID Card and Video are required');
    }

    // Pass FILES to the service. 
    // The service will handle uploading Image vs Video to Cloudinary.
    return this.usersService.requestCreatorUpgrade(
      req.user.id,
      body.fullName,
      idCardFile,
      videoFile,
    );
  }

  // =========================
  // PUBLIC PROFILE & SOCIAL
  // =========================

  @Get(':id')
  async getUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    const requesterId = req.user?.id;
    return this.usersService.getPublicProfile(id, requesterId);
  }

  @Post(':id/follow')
  async followUser(
    @Param('id', ParseUUIDPipe) targetId: string,
    @Req() req: any,
  ) {
    return this.usersService.toggleFollow(req.user.id, targetId);
  }

  @Get(':id/followers')
  async getFollowers(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getFollowers(id);
  }

  @Get(':id/following')
  async getFollowing(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getFollowing(id);
  }

  // =========================
  // ADMIN / MODERATION
  // =========================

  @Patch(':id/ban')
  @Roles('ADMIN', 'COMMUNITY_LEAD')
  @UseGuards(AdminGuard)
  async banUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.banUser(id);
  }

  @Patch(':id/unban')
  @Roles('ADMIN', 'COMMUNITY_LEAD')
  @UseGuards(AdminGuard)
  async unbanUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.unbanUser(id);
  }

  @Patch(':id/approve-kyc')
  @Roles('ADMIN')
  @UseGuards(AdminGuard)
  async approveKyc(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.approveCreator(id);
  }

  @Patch(':id/reject-kyc')
  @Roles('ADMIN')
  @UseGuards(AdminGuard)
  async rejectKyc(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.rejectCreator(id);
  }
}