import { Module } from '@nestjs/common';
import { EscalationProfileService } from './escalation-profile.service';
import { EscalationProfileController } from './escalation-profile.controller';
import { EscalationProfileRepository } from './escalation-profile.repository';
import { EscalationStateService } from './escalation-state.service';
import { EscalationStateRepository } from './escalation-state.repository';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';

/**
 * Escalation module.
 * Provides escalation profile and state management functionality.
 */
@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [EscalationProfileController],
  providers: [
    EscalationProfileService,
    EscalationProfileRepository,
    EscalationStateService,
    EscalationStateRepository,
  ],
  exports: [
    EscalationProfileService,
    EscalationProfileRepository,
    EscalationStateService,
    EscalationStateRepository,
  ],
})
export class EscalationModule {}

