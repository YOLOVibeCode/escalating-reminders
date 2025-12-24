import { Controller, Post, Delete, HttpCode, HttpStatus, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { SeedingService } from './seeding.service';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from '../notifications/notification.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';

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
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
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

  @Post('trigger-notification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Trigger tier notifications (test-only)',
    description:
      'Immediately triggers NotificationService.sendTierNotifications for a reminder/tier. Only available in development/test environments.',
  })
  async triggerNotification(@Body() body: { reminderId: string; userId: string; tier: number }) {
    if (!this.isSeedingEnabled()) {
      return {
        success: false,
        error: {
          code: 'SEEDING_DISABLED',
          message: 'Seeding is only available in development/test environments',
        },
      };
    }

    // Allow convenience user identifiers for tests:
    // - "me" => derive from reminder.userId
    // - email => resolve to user.id
    let resolvedUserId = body.userId;
    if (resolvedUserId === 'me') {
      const reminder = await this.prisma.reminder.findUnique({
        where: { id: body.reminderId },
        select: { userId: true },
      });
      if (reminder?.userId) resolvedUserId = reminder.userId;
    } else if (resolvedUserId.includes('@')) {
      const user = await this.prisma.user.findUnique({
        where: { email: resolvedUserId },
        select: { id: true },
      });
      if (user?.id) resolvedUserId = user.id;
    }

    const logs = await this.notificationService.sendTierNotifications(
      body.reminderId,
      resolvedUserId,
      body.tier,
    );

    return {
      success: true,
      data: { logs },
      message: 'Notifications triggered',
    };
  }

  @Post('set-delivery-state')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set user delivery state (test-only)',
    description:
      'Sets Subscription.deliveryState for a user (ACTIVE, DELIVERY_DISABLED, USAGE_SUSPENDED). Only available in development/test environments.',
  })
  async setDeliveryState(
    @Body()
    body: {
      userId: string; // "me" | email | userId
      state: 'ACTIVE' | 'DELIVERY_DISABLED' | 'USAGE_SUSPENDED';
      reason?: string;
      days?: number; // for usage suspension duration
    },
  ) {
    if (!this.isSeedingEnabled()) {
      return {
        success: false,
        error: {
          code: 'SEEDING_DISABLED',
          message: 'Seeding is only available in development/test environments',
        },
      };
    }

    let resolvedUserId = body.userId;
    if (resolvedUserId === 'me') {
      return {
        success: false,
        error: {
          code: 'USER_ID_REQUIRED',
          message: 'Use an explicit userId or email for set-delivery-state (not "me")',
        },
      };
    }
    if (resolvedUserId.includes('@')) {
      const user = await this.prisma.user.findUnique({
        where: { email: resolvedUserId },
        select: { id: true },
      });
      if (user?.id) resolvedUserId = user.id;
    }

    const now = new Date();
    const reason = body.reason || 'test';

    if (body.state === 'ACTIVE') {
      await this.prisma.subscription.update({
        where: { userId: resolvedUserId },
        data: {
          deliveryState: 'ACTIVE',
          deliveryDisabledAt: null,
          deliveryDisabledBy: null,
          deliveryDisabledReason: null,
          usageSuspendedAt: null,
          usageSuspendedUntil: null,
          usageSuspensionReason: null,
        },
      });
    }

    if (body.state === 'DELIVERY_DISABLED') {
      await this.prisma.subscription.update({
        where: { userId: resolvedUserId },
        data: {
          deliveryState: 'DELIVERY_DISABLED',
          deliveryDisabledAt: now,
          deliveryDisabledBy: 'seeding',
          deliveryDisabledReason: reason,
          usageSuspendedAt: null,
          usageSuspendedUntil: null,
          usageSuspensionReason: null,
        },
      });
    }

    if (body.state === 'USAGE_SUSPENDED') {
      const days = typeof body.days === 'number' && body.days > 0 ? body.days : 3;
      const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      await this.prisma.subscription.update({
        where: { userId: resolvedUserId },
        data: {
          deliveryState: 'USAGE_SUSPENDED',
          usageSuspendedAt: now,
          usageSuspendedUntil: until,
          usageSuspensionReason: reason,
          deliveryDisabledAt: null,
          deliveryDisabledBy: null,
          deliveryDisabledReason: null,
        },
      });
      await this.prisma.deliveryWindowUsage.deleteMany({
        where: { userId: resolvedUserId },
      });
    }

    return {
      success: true,
      data: { userId: resolvedUserId, state: body.state },
    };
  }
}
