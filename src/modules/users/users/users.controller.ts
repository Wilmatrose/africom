import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Put,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
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
  // CHANGE PASSWORD (NEW)
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

        filename: (
          req: any,
          file,
          callback,
        ) => {
          const uniqueName = uuidv4();
          const extension = extname(file.originalname);

          callback(
            null,
            `${uniqueName}${extension}`,
          );
        },
      }),

      fileFilter: (
        req: any,
        file,
        callback,
      ) => {
        if (
          !file.mimetype.match(
            /\/(jpg|jpeg|png|gif)$/i,
          )
        ) {
          return callback(
            new BadRequestException(
              'Only image files are allowed!',
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  async uploadAvatar(
    @Req() req: any,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException(
        'File is required',
      );
    }

    const avatarUrl = `http://localhost:3000/uploads/avatars/${file.filename}`;

    await this.usersService.updateAvatar(
      req.user.id,
      avatarUrl,
    );

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
        {
          name: 'idCard',
          maxCount: 1,
        },
        {
          name: 'verificationVideo',
          maxCount: 1,
        },
      ],
      {
        storage: diskStorage({
          destination: './uploads/kyc',

          filename: (
            req: any,
            file,
            callback,
          ) => {
            const userId =
              req.user?.id || 'anonymous';

            const uniqueName = `${userId}_${uuidv4()}`;

            const extension = extname(
              file.originalname,
            );

            callback(
              null,
              `${uniqueName}${extension}`,
            );
          },
        }),
      },
    ),
  )
  async submitKyc(
    @Req() req: any,

    @Body()
    body: any,

    @UploadedFiles()
    files: {
      idCard?: Express.Multer.File[];
      verificationVideo?: Express.Multer.File[];
    },
  ) {
    const idCardFile =
      files.idCard?.[0];

    const videoFile =
      files.verificationVideo?.[0];

    if (!idCardFile || !videoFile) {
      throw new BadRequestException(
        'Both ID Card and Video are required',
      );
    }

    const baseUrl =
      'http://localhost:3000';

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
  // PUBLIC / DISCOVERY
  // =========================

  @Get(':id')
  async getUser(
    @Param('id') id: string,
  ) {
    return this.usersService.findById(id);
  }

  // =========================
  // ADMIN / MODERATION
  // =========================

  @Patch(':id/ban')
  @Roles('ADMIN', 'COMMUNITY_LEAD')
  @UseGuards(AdminGuard)
  async banUser(
    @Param('id') id: string,
  ) {
    return this.usersService.banUser(id);
  }

  @Patch(':id/unban')
  @Roles('ADMIN', 'COMMUNITY_LEAD')
  @UseGuards(AdminGuard)
  async unbanUser(
    @Param('id') id: string,
  ) {
    return this.usersService.unbanUser(id);
  }

  @Patch(':id/approve-kyc')
  @Roles('ADMIN')
  @UseGuards(AdminGuard)
  async approveKyc(
    @Param('id') id: string,
  ) {
    return this.usersService.approveCreator(id);
  }

  @Patch(':id/reject-kyc')
  @Roles('ADMIN')
  @UseGuards(AdminGuard)
  async rejectKyc(
    @Param('id') id: string,
  ) {
    return this.usersService.rejectCreator(id);
  }
}