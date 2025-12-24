import { Controller, Post, Body, Headers, HttpCode } from '@nestjs/common';

@Controller('v1/webhooks/square')
export class SquareWebhookController {
  /**
   * Temporary webhook endpoint for Square verification.
   * TODO: Implement proper webhook handling with signature verification.
   */
  @Post()
  @HttpCode(200)
  async handleSquareWebhook(
    @Body() body: any,
    @Headers('x-square-hmacsha256-signature') signature?: string,
  ) {
    console.log('🔔 Square webhook received:', {
      type: body?.type,
      signature: signature?.substring(0, 20) + '...',
    });

    // For now, just accept the webhook
    // TODO: Implement signature verification and event handling
    return { received: true };
  }
}

