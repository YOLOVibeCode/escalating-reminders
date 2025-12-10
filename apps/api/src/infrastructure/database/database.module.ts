import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Database module.
 * Provides Prisma client as a singleton service.
 * Global module - available to all modules without importing.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}

