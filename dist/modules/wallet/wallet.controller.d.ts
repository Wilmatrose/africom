import { WalletService } from './wallet.service';
import { UsersService } from '../users/users/users.service';
import { WebsocketsGateway } from '../websockets/websockets.gateway';
export declare class WalletController {
    private readonly walletService;
    private readonly usersService;
    private readonly websocketsGateway;
    constructor(walletService: WalletService, usersService: UsersService, websocketsGateway: WebsocketsGateway);
    getMyWallet(req: any): Promise<{
        balance: number;
        currency: string;
    }>;
    getHistory(req: any, userId: string): Promise<import("./wallet.entity").Transaction[]>;
    buyCoins(req: any, body: {
        amount: number;
        reference: string;
    }): Promise<{
        success: boolean;
        newBalance: number;
        transaction: import("./wallet.entity").Transaction;
    }>;
    sendGift(req: any, body: {
        recipientUsername: string;
        amount: number;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    withdraw(req: any, body: {
        amount: number;
        bankDetails: any;
    }): Promise<{
        success: boolean;
        message: string;
        newBalance: number;
        transaction: import("./wallet.entity").Transaction;
    }>;
}
