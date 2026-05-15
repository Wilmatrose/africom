import { Injectable, BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { WalletService } from '../wallet/wallet.service';
import { TransactionCategory } from '../wallet/transaction.enum';
// FIX: Corrected path to User entity
import { User } from '../users/entities/user.entity'; 
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  private readonly koraSecretKey: string;

  constructor(
    private config: ConfigService,
    @Inject(WalletService) private walletService: WalletService,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {
    this.koraSecretKey = this.config.get('KORA_PAY_SECRET_KEY') || '';
  }

  async initiatePayment(userId: string, amountInNaira: number) {
    // 1. Fetch User
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. Calculate Coins
    const coinsToReceive = amountInNaira * 100;
    const reference = `Africom_${uuidv4()}`;

    try {
      // 3. Call KoraPay API
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

      // 4. Return Checkout URL
      return {
        success: true,
        checkoutUrl: response.data.data.checkout_url,
        reference: response.data.data.reference,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('KoraPay Error Response:', error.response?.data || error.message);
        throw new BadRequestException(
          'Payment initiation failed: ' + (error.response?.data?.message || 'Unknown error')
        );
      } else if (error instanceof Error) {
        console.error('Generic Error:', error.message);
        throw new BadRequestException('Payment initiation failed: ' + error.message);
      } else {
        console.error('Unknown Error:', error);
        throw new BadRequestException('Payment initiation failed due to an unknown error');
      }
    }
  }

  async verifyWebhook(payload: any, signature: string) {
    if (payload.event === 'charge.success') {
      const { data } = payload;

      const userId = data.metadata?.userId;
      const coins = data.metadata?.coinsToReceive;
      const reference = data.reference;

      if (!userId || !coins) {
        console.error('Webhook Error: Missing metadata');
        throw new BadRequestException('Invalid payload metadata');
      }

      try {
        await this.walletService.creditUser(
          userId,
          coins,
          reference,
          TransactionCategory.COIN_PURCHASE,
        );
        return { success: true, message: 'Wallet credited' };
      } catch (e) {
        console.error('Wallet Crediting Error', e);
        throw new BadRequestException('Failed to credit wallet');
      }
    }

    return { success: false, message: 'Event not handled' };
  }
}