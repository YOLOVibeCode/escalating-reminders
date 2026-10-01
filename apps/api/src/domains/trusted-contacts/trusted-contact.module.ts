import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { SmsModule } from '../sms/sms.module';
import { TrustedContactRepository } from './trusted-contact.repository';
import { TrustedContactService } from './trusted-contact.service';
import { TrustedContactController } from './trusted-contact.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, SmsModule, AuthModule],
  controllers: [TrustedContactController],
  providers: [TrustedContactRepository, TrustedContactService],
  exports: [TrustedContactService, TrustedContactRepository],
})
export class TrustedContactModule {}
