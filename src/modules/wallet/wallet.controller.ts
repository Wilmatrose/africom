import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { UsersService } from '../users/users/users.service';
import { WebsocketsGateway } from '../websockets/websockets.gateway';
import { TransactionCategory } from './wallet.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('wallet')
@UseGuards(AuthGuard('jwt'))
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly usersService: UsersService,
    private readonly websocketsGateway: WebsocketsGateway,
  ) {}

  // =========================
  // WALLET BALANCE
  // =========================
  @Get('me')
  async getMyWallet(@Req() req) {
    const userId = req.user.id;
    const user = await this.usersService.findById(userId);

    return {
      balance: user.coinBalance,
      currency: 'NGN',
    };
  }

  // =========================
  // TRANSACTION HISTORY (NEW)
  // =========================
  @Get('history/:userId')
  async getHistory(@Req() req, @Param('userId') userId: string) {
    // Security: Ensure user can only see their own history
    if (req.user.id !== userId && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('You can only view your own history');
    }
    return this.walletService.getHistory(userId);
  }

  // =========================
  // BUY COINS
  // =========================
  @Post('buy')
  async buyCoins(
    @Req() req,
    @Body() body: { amount: number; reference: string },
  ) {
    const userId = req.user.id;

    const result = await this.walletService.creditUser(
      userId,
      body.amount,
      body.reference || 'COIN_PURCHASE',
      TransactionCategory.COIN_PURCHASE,
    );

    // Real-time update
    this.websocketsGateway.server
      .to(`user_${userId}`)
      .emit('balanceUpdated', { newBalance: result.newBalance });

    return result;
  }

  // =========================
  // SEND GIFT (Updated for UI & History Recording)
  // =========================
  @Post('gift')
  async sendGift(
    @Req() req,
    @Body() body: { recipientUsername: string; amount: number },
  ) {
    const senderId = req.user.id;
    const sender = await this.usersService.findById(senderId);

    // 1. Find Recipient by Username (Matches the Flutter UI)
    const recipient = await this.usersService.findByUsername(body.recipientUsername);
    if (!recipient) {
      throw new NotFoundException(`User "${body.recipientUsername}" not found`);
    }

    if (senderId === recipient.id) {
      throw new ForbiddenException('You cannot send gifts to yourself');
    }

    const ref = `gift-${Date.now()}`;
    const giftName = `${body.amount} Coins`;

    // 2. Perform Debit & Credit (This records history for BOTH users)
    await this.walletService.debitFan(senderId, body.amount, ref, giftName);
    await this.walletService.creditCreator(recipient.id, body.amount, ref, giftName);

    // 3. Notify Recipient in real-time
    this.websocketsGateway.server.to(`user_${recipient.id}`).emit('onCreatorAlert', {
      type: 'GIFT',
      sender: sender.username,
      gift: giftName,
      amount: body.amount,
    });

    return { success: true, message: `Gift sent to ${body.recipientUsername}` };
  }

  // =========================
  // WITHDRAW
  // =========================
  @Post('withdraw')
  async withdraw(
    @Req() req,
    @Body() body: { amount: number; bankDetails: any },
  ) {
    const userId = req.user.id;

    const result = await this.walletService.withdraw(
      userId,
      body.amount,
      body.bankDetails,
    );

    this.websocketsGateway.server.to(`user_${userId}`).emit('onNotification', {
      message: 'Withdrawal request submitted.',
    });

    return result;
  }
}