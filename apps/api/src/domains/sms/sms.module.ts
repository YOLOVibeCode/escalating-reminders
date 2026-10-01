import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { SmsConsentRepository } from './sms-consent.repository';
import { SmsMessageLogRepository } from './sms-message-log.repository';
import { GuardedSmsSendService } from './guarded-sms-send.service';
import { SmsInboundService } from './sms-inbound.service';

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
export class SmsModule {}
