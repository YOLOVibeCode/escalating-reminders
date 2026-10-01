import { Module } from '@nestjs/common';

import { GuardedSmsSendService } from './guarded-sms-send.service';
import { SmsConsentRepository } from './sms-consent.repository';
import { SmsInboundService } from './sms-inbound.service';
import { SmsMessageLogRepository } from './sms-message-log.repository';
import { DatabaseModule } from '../../infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [
    SmsConsentRepository,
    SmsMessageLogRepository,
    GuardedSmsSendService,
    SmsInboundService,
  ],
  exports: [
    SmsConsentRepository,
    SmsMessageLogRepository,
    GuardedSmsSendService,
    SmsInboundService,
  ],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- NestJS @Module container
export class SmsModule {}
