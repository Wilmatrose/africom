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

import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

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
  // AVATAR UPLOAD
  // =========================

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req: any, file, callback) => {
          const uniqueName = uuidv4();
          const extension = extname(file.originalname);
          callback(null, `${uniqueName}${extension}`);
        },
      }),
      fileFilter: (req: any, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/i)) {
          return callback(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadAvatar(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${file.filename}`;

    await this.usersService.updateAvatar(req.user.id, avatarUrl);

    return {
      success: true,
      message: 'Avatar uploaded successfully',
      avatarUrl,
    };
  }

  // =========================
  // KYC UPLOAD
  // =========================

  @Post('me/kyc')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'idCard', maxCount: 1 },
        { name: 'verificationVideo', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/kyc',
          filename: (req: any, file, callback) => {
            const userId = req.user?.id || 'anonymous';
            const uniqueName = `${userId}_${uuidv4()}`;
            const extension = extname(file.originalname);
            callback(null, `${uniqueName}${extension}`);
          },
        }),
      },
    ),
  )
  async submitKyc(
    @Req() req: any,
    @Body() body: any,
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

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const idCardUrl = `${baseUrl}/uploads/kyc/${idCardFile.filename}`;
    const videoUrl = `${baseUrl}/uploads/kyc/${videoFile.filename}`;

    return this.usersService.requestCreatorUpgrade(
      req.user.id,
      body.fullName,
      idCardUrl,
      videoUrl,
    );
  }

  // =========================
  // PUBLIC PROFILE & SOCIAL
  // =========================

  /**
   * Get a user's public profile.
   * If requester is the owner, show private data (coins, email).
   * If requester is a stranger, hide private data.
   */
  @Get(':id')
  async getUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    const requesterId = req.user?.id;
    return this.usersService.getPublicProfile(id, requesterId);
  }

  /**
   * Follow a user.
   * Toggles follow state: if already following, unfollows.
   */
  @Post(':id/follow')
  async followUser(
    @Param('id', ParseUUIDPipe) targetId: string,
    @Req() req: any,
  ) {
    return this.usersService.toggleFollow(req.user.id, targetId);
  }

  /**
   * Get list of followers
   */
  @Get(':id/followers')
  async getFollowers(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getFollowers(id);
  }

  /**
   * Get list of following
   */
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