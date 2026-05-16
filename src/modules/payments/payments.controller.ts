import { Controller, Post, Body, Req, Headers, Logger, HttpCode, HttpStatus, UseGuards, RawBodyRequest } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
// NOTE: Webhook endpoint usually DOES NOT use JwtAuthGuard because KoraPay calls it, not the user.
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  // Initialize Payment
  @Post('initialize')
  @UseGuards(JwtAuthGuard) 
  async initialize(@Req() req, @Body() body: { amount: number }) {
    const userId = req.user.id;
    const amount = body.amount;
    return this.paymentsService.initiatePayment(userId, amount);
  }

  // KoraPay Webhook
  @Post('webhook/kora')
  @HttpCode(HttpStatus.OK)
  async handleKoraWebhook(
    @Req() req: RawBodyRequest<Request>, // Use RawBodyRequest type
    @Headers('x-kora-signature') signature: string, // Capture the header
  ) {
    // Get the raw body string from the request (added by middleware)
    const rawBody = req.rawBody.toString(); 
    
    // Pass parsed body, signature, AND raw body to service
    return this.paymentsService.verifyWebhook(req.body, signature, rawBody);
  }
}