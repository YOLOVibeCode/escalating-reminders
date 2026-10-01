import { Module } from '@nestjs/common';

import { TrustedContactController } from './trusted-contact.controller';
import { TrustedContactRepository } from './trusted-contact.repository';
import { TrustedContactService } from './trusted-contact.service';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [DatabaseModule, SmsModule, AuthModule],
  controllers: [TrustedContactController],
  providers: [TrustedContactRepository, TrustedContactService],
  exports: [TrustedContactService, TrustedContactRepository],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- NestJS @Module container
export class TrustedContactModule {}
