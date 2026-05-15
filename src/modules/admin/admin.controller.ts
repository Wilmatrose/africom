import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Req,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';

import { UsersService } from '../users/users/users.service';
import { AdminWalletService } from '../wallet/admin-wallet.service';
import { AdminStatsService } from './admin-stats.service';
import { AdminGuard } from './admin.guard';
import { Roles } from './roles.decorator';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly adminWallet: AdminWalletService,
    private readonly adminStats: AdminStatsService,
  ) {}

  // ==================================================
  // ANALYTICS & STATS
  // ==================================================

  @Get('overview')
  @Roles('ADMIN', 'COMMUNITY_LEAD')
  async getOverview() {
    return this.adminStats.getOverview();
  }

  @Get('stats/daily')
  @Roles('ADMIN', 'COMMUNITY_LEAD')
  async getDailyStats() {
    return this.adminStats.getDailyStats(7);
  }

  @Get('health')
  @Roles('ADMIN', 'COMMUNITY_LEAD')
  async getSystemHealth() {
    return this.adminStats.getSystemHealth();
  }

  @Get('kyc-stats')
  @Roles('ADMIN', 'COMMUNITY_LEAD')
  async getKycStats() {
    const pending = await this.usersService.getPendingKycCount();
    return { pending };
  }

  // ==================================================
  // KYC MANAGEMENT (NEW)
  // ==================================================

  // 1. Get the list of users pending verification
  @Get('kyc/pending')
  @Roles('ADMIN')
  async getPendingKycQueue() {
    return this.usersService.getPendingKyc();
  }

  // 2. Securely serve the document (ID or Video) for preview
  @Get('kyc/:id/documents')
  @Roles('ADMIN')
  async getKycDocument(
    @Param('id') userId: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const user = await this.usersService.findById(userId);

    // Determine file type from query ?type=id or ?type=video
    const type = req.query.type;
    let fileUrl: string | undefined;

    if (type === 'id') fileUrl = user.idCardUrl;
    if (type === 'video') fileUrl = user.verificationVideoUrl;

    if (!fileUrl) {
      throw new NotFoundException('Document not found for this user.');
    }

    // Extract filename from the URL (e.g., "uuid.jpg" from "http://.../kyc/uuid.jpg")
    const filename = fileUrl.split('/').pop();
    
    // Construct absolute path to the file on the server
    const filePath = join(process.cwd(), 'uploads', 'kyc', filename);

    if (!existsSync(filePath)) {
      throw new NotFoundException('File missing on server.');
    }

    // Send file directly to browser for preview
    return res.sendFile(filePath);
  }

  // 3. Approve KYC
  @Patch('kyc/:id/approve')
  @Roles('ADMIN')
  async approveKyc(@Param('id') id: string) {
    return this.usersService.approveCreator(id);
  }

  // 4. Reject KYC
  @Patch('kyc/:id/reject')
  @Roles('ADMIN')
  async rejectKyc(@Param('id') id: string) {
    return this.usersService.rejectCreator(id);
  }

  // ==================================================
  // USER MANAGEMENT
  // ==================================================

  @Get('users')
  @Roles('ADMIN', 'COMMUNITY_LEAD')
  async getUsers() {
    const users = await this.usersService.getAllUsers();
    return {
      total: users.length,
      users,
    };
  }
  
  @Get('users/:id/download')
  @Roles('ADMIN')
  async downloadUserData(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const data = await this.adminWallet.getUserData(id);

    if (!data) {
      return res.status(404).json({
        message: 'User data not found',
      });
    }

    const exportData = {
      user: data.user,
      transactions: data.transactions,
      exportedAt: new Date().toISOString(),
    };

    const fileName = `user_data_${id}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`,
    );

    return res.send(JSON.stringify(exportData, null, 2));
  }

  // ==================================================
  // FINANCE & FRAUD
  // ==================================================

  @Get('transactions')
  @Roles('ADMIN')
  async getTransactions() {
    const transactions =
      await this.adminWallet.getAllTransactions();

    return {
      total: transactions.length,
      transactions,
    };
  }

  @Get('withdrawals')
  @Roles('ADMIN')
  async getWithdrawals() {
    const withdrawals =
      await this.adminWallet.getPendingWithdrawals();

    return {
      total: withdrawals.length,
      withdrawals,
    };
  }

  @Patch('withdrawals/:id/approve')
  @Roles('ADMIN')
  async approve(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const adminId = req.user?.userId;

    const result =
      await this.adminWallet.approveWithdrawal(
        id,
        adminId,
      );

    return {
      message: 'Withdrawal approved',
      adminId,
      result,
    };
  }

  @Patch('withdrawals/:id/reject')
  @Roles('ADMIN')
  async reject(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const adminId = req.user?.userId;

    const result =
      await this.adminWallet.rejectWithdrawal(
        id,
        adminId,
      );

    return {
      message: 'Withdrawal rejected',
      adminId,
      result,
    };
  }

  @Get('fraud')
  @Roles('ADMIN')
  async getFraudSignals() {
    return this.adminStats.getFraudSignals();
  }
}