import { ConfigService } from '@nestjs/config';
import { WalletService } from '../wallet/wallet.service';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
export declare class PaymentsService {
    private config;
    private walletService;
    private userRepo;
    private readonly koraSecretKey;
    constructor(config: ConfigService, walletService: WalletService, userRepo: Repository<User>);
    initiatePayment(userId: string, amountInNaira: number): Promise<{
        success: boolean;
        checkoutUrl: any;
        reference: any;
    }>;
    verifyWebhook(payload: any, signature: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
