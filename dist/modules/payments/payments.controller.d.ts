import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    initialize(body: {
        userId: string;
        amount: number;
    }): Promise<{
        success: boolean;
        checkoutUrl: any;
        reference: any;
    }>;
    handleKoraWebhook(payload: any, signature: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
