import { Injectable, BadRequestException, Inject, NotFoundException, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { createHmac } from 'crypto'; // Built-in Node module for hashing
import { WalletService } from '../wallet/wallet.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly koraSecretKey: string;

  constructor(
    private config: ConfigService,
    @Inject(WalletService) private walletService: WalletService,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {
    this.koraSecretKey = this.config.get<string>('KORAPAY_SECRET_KEY') || '';
  }

  async initiatePayment(userId: string, amountInNaira: number) {
    if (!amountInNaira || amountInNaira < 100) {
      throw new BadRequestException('Minimum top-up is ₦100');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Rate: 10 Naira = 1 Coin
    const coinsToReceive = amountInNaira / 10; 
    const reference = `AFC-${uuidv4()}`;

    try {
      const response = await axios.post(
        'https://api.korapay.com/merchant/api/v1/charges/initialize',
        {
          amount: amountInNaira,
          currency: 'NGN',
          reference: reference,
          customer: {
            email: user.email,
            name: user.fullName || user.username,
          },
          metadata: {
            userId: userId,
            coinsToReceive: coinsToReceive,
            platform: 'Africom Socials',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.koraSecretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        success: true,
        checkoutUrl: response.data.data.checkout_url,
        reference: response.data.data.reference,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error('KoraPay Error Response:', error.response?.data || error.message);
        throw new BadRequestException(
          'Payment initiation failed: ' + (error.response?.data?.message || 'Unknown error')
        );
      } else {
        this.logger.error('Unknown Error:', error);
        throw new BadRequestException('Payment initiation failed due to an unknown error');
      }
    }
  }

  /**
   * Verifies the KoraPay Webhook Signature
   * NOTE: This requires the RAW body string, not the parsed JSON object.
   */
  async verifyWebhook(payload: any, signature: string, rawBody: string) {
    // 1. VERIFY SIGNATURE
    if (this.koraSecretKey) {
      const expectedSignature = createHmac('sha512', this.koraSecretKey)
        .update(rawBody) // Hash the raw string exactly as received
        .digest('hex');

      // Compare securely (timing attack safe comparison usually preferred, but simple check works for MVP)
      if (expectedSignature !== signature) {
        this.logger.warn('Invalid Webhook Signature detected. Possible hacking attempt.');
        // Return 200 OK so they don't retry, but do NOT process payment
        return { success: false, message: 'Invalid signature' };
      }
    } else {
      this.logger.warn('KORAPAY_SECRET_KEY is missing in .env! Webhook verification skipped.');
    }

    // 2. PROCESS EVENT
    if (payload.event === 'charge.success') {
      const { data } = payload;
      const reference = data.reference;
      const userId = data.metadata?.userId;

      if (!userId) {
        this.logger.error('Webhook Error: Missing userId in metadata');
        return { success: false, message: 'Invalid metadata' }; 
      }

      try {
        // Prevent double processing: Check if reference exists in DB? 
        // For now, we rely on walletService idempotency or simple DB check.
        // (Ideally, add a check here to see if transaction with this reference already exists)

        await this.walletService.purchaseCoins(
          userId, 
          data.amount, 
          reference 
        );

        this.logger.log(`✅ Successfully credited user ${userId} for reference ${reference}`);
        
        // TODO: Emit Socket Event 'wallet_updated' to user_${userId} here if possible
        // this.websocketsGateway.server.to(`user_${userId}`).emit('notification', { ... });

        return { success: true, message: 'Wallet credited' };
        
      } catch (e) {
        this.logger.error('Wallet Crediting Error', e);
        return { success: false, message: 'Failed to credit wallet' };
      }
    }

    return { success: false, message: 'Event not handled' };
  }
}