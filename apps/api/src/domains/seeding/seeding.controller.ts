import { Controller, Post, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { SeedingService } from './seeding.service';
import { ConfigService } from '@nestjs/config';

/**
 * Seeding controller for E2E tests and development.
 * Only available in development/test environments.
 */
@ApiTags('seeding')
@Controller('seeding')
export class SeedingController {
  constructor(
    private readonly seedingService: SeedingService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Check if seeding is enabled (only in dev/test)
   */
  private isSeedingEnabled(): boolean {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    return nodeEnv === 'development' || nodeEnv === 'test' || process.env.ENABLE_SEEDING === 'true';
  }

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed test data',
    description: 'Creates test users, reminders, escalation profiles, and agent subscriptions for E2E tests. Only available in development/test environments.',
  })
  @ApiResponse({
    status: 200,
    description: 'Test data seeded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            users: {
              type: 'object',
              properties: {
                user: { type: 'object' },
                admin: { type: 'object' },
              },
            },
            reminders: { type: 'array' },
            escalationProfiles: { type: 'array' },
            agentSubscriptions: { type: 'array' },
          },
        },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Seeding not available in production',
  })
  async seed() {
    if (!this.isSeedingEnabled()) {
      return {
        success: false,
        error: {
          code: 'SEEDING_DISABLED',
          message: 'Seeding is only available in development/test environments',
        },
      };
    }

    const data = await this.seedingService.seedAll();

    return {
      success: true,
      data,
      message: 'Test data seeded successfully',
    };
  }

  @Delete('clear')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clear test data',
    description: 'Removes all test users and their associated data. Only available in development/test environments.',
  })
  @ApiResponse({
    status: 200,
    description: 'Test data cleared successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Seeding not available in production',
  })
  async clear() {
    if (!this.isSeedingEnabled()) {
      return {
        success: false,
        error: {
          code: 'SEEDING_DISABLED',
          message: 'Seeding is only available in development/test environments',
        },
      };
    }

    await this.seedingService.clearTestData();

    return {
      success: true,
      message: 'Test data cleared successfully',
    };
  }
}
