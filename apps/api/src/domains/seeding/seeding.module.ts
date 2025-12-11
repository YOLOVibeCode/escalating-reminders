import { Module } from '@nestjs/common';
import { SeedingController } from './seeding.controller';
import { SeedingService } from './seeding.service';
import { DatabaseModule } from '../../infrastructure/database/database.module';

/**
 * Seeding module for E2E tests and development.
 * Provides endpoints to seed and clear test data.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [SeedingController],
  providers: [SeedingService],
  exports: [SeedingService],
})
export class SeedingModule {}
