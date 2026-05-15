import { Controller, Post, Body, Headers, UseGuards, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Ensure this path is correct

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Secure the endpoint so we can trust the userId if needed, 
  // though we accept it in the body as per your current flow.
  @UseGuards(JwtAuthGuard)
  @Post('initialize')
  async initialize(@Body() body: { userId: string; amount: number }) {
    return this.paymentsService.initiatePayment(body.userId, body.amount);
  }

  @Post('webhook/kora')
  async handleKoraWebhook(
    @Body() payload: any,
    @Headers('x-kora-signature') signature: string,
  ) {
    return this.paymentsService.verifyWebhook(payload, signature);
  }
}