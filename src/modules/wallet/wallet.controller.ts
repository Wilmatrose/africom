import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { UsersService } from '../users/users/users.service';
// REMOVED: WebsocketsGateway import to fix circular dependency
import { EventEmitter2 } from '@nestjs/event-emitter'; // ADDED: Event Emitter
import { AuthGuard } from '@nestjs/passport';

@Controller('wallet')
@UseGuards(AuthGuard('jwt'))
export class WalletController {
  private readonly logger = new Logger(WalletController.name);

  constructor(
    private readonly walletService: WalletService,
    private readonly usersService: UsersService,
    // CHANGED: Injecting EventEmitter2 instead of WebsocketsGateway
    private readonly eventEmitter: EventEmitter2,
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
      currency: 'Coins',
    };
  }

  // =========================
  // TRANSACTION HISTORY
  // =========================
  @Get('history/:userId')
  async getHistory(@Req() req, @Param('userId') userId: string) {
    // Security: Users can only see their own history
    if (req.user.id !== userId && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('You can only view your own history');
    }
    return this.walletService.getHistory(userId);
  }

  // =========================
  // SEND GIFT
  // =========================
  @Post('gift')
  async sendGift(
    @Req() req,
    @Body() body: { recipientUsername: string; amount: number; sessionId?: string },
  ) {
    const senderId = req.user.id;
    const senderName = req.user.username || req.user.fullName; 

    // 1. Find Recipient by Username
    const recipient = await this.usersService.findByUsername(body.recipientUsername);
    if (!recipient) {
      throw new NotFoundException(`User "${body.recipientUsername}" not found`);
    }

    // 2. Prevent Self-Gifting
    if (senderId === recipient.id) {
      throw new ForbiddenException('You cannot send gifts to yourself');
    }

    const ref = `gift-${Date.now()}`;
    const giftName = `${body.amount} Coins`;

    // 3. Perform Transactions (Debit Sender, Credit Receiver)
    await this.walletService.debitFan(senderId, body.amount, ref, giftName);
    await this.walletService.creditCreator(recipient.id, body.amount, ref, giftName);

    // 4. Emit Event for Websockets Gateway to handle
    this.eventEmitter.emit('gift.sent', {
      recipientId: recipient.id,
      streamId: body.sessionId,
      senderName: senderName,
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

    // Emit Event for Websockets Gateway to handle
    this.eventEmitter.emit('wallet.withdrawal.created', {
      userId: userId,
      message: 'Withdrawal request submitted.',
    });

    return result;
  }
}