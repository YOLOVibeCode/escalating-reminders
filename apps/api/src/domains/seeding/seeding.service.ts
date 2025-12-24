import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import * as bcrypt from 'bcrypt';
import type { ReminderImportance, ReminderStatus, ScheduleType, SubscriptionTier } from '@er/types';

/**
 * Seeding service for E2E tests and development.
 * Creates test users, reminders, escalation profiles, and agent subscriptions.
 */
@Injectable()
export class SeedingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Seed all test data for E2E tests
   */
  async seedAll(): Promise<{
    users: { user: any; admin: any };
    reminders: any[];
    escalationProfiles: any[];
    agentSubscriptions: any[];
  }> {
    const results: {
      users: { user: any; admin: any };
      reminders: any[];
      escalationProfiles: any[];
      agentSubscriptions: any[];
    } = {
      users: { user: null as any, admin: null as any },
      reminders: [] as any[],
      escalationProfiles: [] as any[],
      agentSubscriptions: [] as any[],
    };

    // Seed users
    results.users = await this.seedUsers();

    // Seed escalation profiles
    results.escalationProfiles = await this.seedEscalationProfiles(results.users.user.id);

    // Seed reminders
    results.reminders = await this.seedReminders(
      results.users.user.id,
      results.escalationProfiles[0]?.id,
    );

    // Seed agent subscriptions
    results.agentSubscriptions = await this.seedAgentSubscriptions(results.users.user.id);

    return results;
  }

  /**
   * Seed test users (regular user and admin)
   */
  async seedUsers(): Promise<{ user: any; admin: any }> {
    const userPassword = 'TestUser123!';
    const adminPassword = 'AdminPass123!';

    // Create or update test user
    let testUser = await this.prisma.user.findUnique({
      where: { email: 'testuser@example.com' },
      include: { profile: true, subscription: true },
    });

    if (!testUser) {
      const hashedPassword = await bcrypt.hash(userPassword, 10);
      testUser = await this.prisma.user.create({
        data: {
          email: 'testuser@example.com',
          passwordHash: hashedPassword,
          emailVerified: true,
          profile: {
            create: {
              displayName: 'Test User',
              timezone: 'America/New_York',
              preferences: {
                quietHoursStart: '22:00',
                quietHoursEnd: '07:00',
              },
            },
          },
          subscription: {
            create: {
              tier: 'PERSONAL' as SubscriptionTier,
              status: 'ACTIVE' as any,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            },
          },
        },
        include: { profile: true, subscription: true },
      });
    }

    // Create or update admin user
    let adminUser = await this.prisma.user.findUnique({
      where: { email: 'admin@example.com' },
      include: { profile: true, subscription: true, adminUser: true },
    });

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      adminUser = await this.prisma.user.create({
        data: {
          email: 'admin@example.com',
          passwordHash: hashedPassword,
          emailVerified: true,
          profile: {
            create: {
              displayName: 'Admin User',
              timezone: 'UTC',
            },
          },
          subscription: {
            create: {
              tier: 'PRO' as SubscriptionTier,
              status: 'ACTIVE' as any,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            },
          },
          adminUser: {
            create: {
              role: 'SUPER_ADMIN',
              permissions: {
                all: true,
              },
            },
          },
        },
        include: { profile: true, subscription: true, adminUser: true },
      });
    } else if (!adminUser.adminUser) {
      // User exists but not admin - promote to admin
      await this.prisma.adminUser.create({
        data: {
          userId: adminUser.id,
          role: 'SUPER_ADMIN',
          permissions: {
            all: true,
          },
        },
      });
    }

    return { user: testUser, admin: adminUser };
  }

  /**
   * Seed escalation profiles for test user
   */
  async seedEscalationProfiles(userId: string): Promise<any[]> {
    const profiles = [
      {
        name: 'Gentle',
        description: 'Gradual escalation over hours',
        tiers: [
          {
            tierNumber: 1,
            delayMinutes: 0,
            agentIds: ['push'],
          },
          {
            tierNumber: 2,
            delayMinutes: 60,
            agentIds: ['push', 'email'],
          },
        ],
      },
      {
        name: 'Critical',
        description: 'Rapid escalation for critical reminders',
        tiers: [
          {
            tierNumber: 1,
            delayMinutes: 0,
            agentIds: ['push', 'email', 'sms'],
          },
          {
            tierNumber: 2,
            delayMinutes: 15,
            agentIds: ['push', 'email', 'sms'],
          },
          {
            tierNumber: 3,
            delayMinutes: 30,
            agentIds: ['push', 'email', 'sms', 'webhook'],
          },
        ],
      },
    ];

    const createdProfiles = [];

    for (const profileData of profiles) {
      const existing = await this.prisma.escalationProfile.findFirst({
        where: {
          userId,
          name: profileData.name,
        },
      });

      if (!existing) {
        const profile = await this.prisma.escalationProfile.create({
          data: {
            userId,
            name: profileData.name,
            description: profileData.description,
            tiers: profileData.tiers,
          },
        });
        createdProfiles.push(profile);
      } else {
        createdProfiles.push(existing);
      }
    }

    return createdProfiles;
  }

  /**
   * Seed test reminders
   */
  async seedReminders(userId: string, escalationProfileId?: string): Promise<any[]> {
    if (!escalationProfileId) {
      throw new Error('seedReminders requires an escalationProfileId');
    }
    const reminders = [
      {
        title: 'Daily Standup',
        description: 'Team standup meeting',
        importance: 'MEDIUM',
        status: 'ACTIVE',
        schedule: {
          type: 'RECURRING',
          cronExpression: '0 9 * * 1-5', // 9 AM weekdays
          timezone: 'America/New_York',
        },
      },
      {
        title: 'Soberlink Check',
        description: 'Complete daily sobriety test',
        importance: 'CRITICAL',
        status: 'ACTIVE',
        schedule: {
          type: 'RECURRING',
          cronExpression: '0 9 * * *', // 9 AM daily
          timezone: 'America/New_York',
        },
      },
      {
        title: 'Weekly Review',
        description: 'Review weekly goals and progress',
        importance: 'LOW',
        status: 'ACTIVE',
        schedule: {
          type: 'RECURRING',
          cronExpression: '0 18 * * 5', // 6 PM Fridays
          timezone: 'America/New_York',
        },
      },
    ];

    const createdReminders = [];

    for (const reminderData of reminders) {
      const existing = await this.prisma.reminder.findFirst({
        where: {
          userId,
          title: reminderData.title,
        },
      });

      if (!existing) {
        const nextTrigger = this.calculateNextTrigger(reminderData.schedule);
        
        const reminder = await this.prisma.reminder.create({
          data: {
            userId,
            title: reminderData.title,
            description: reminderData.description,
            importance: reminderData.importance as ReminderImportance,
            status: reminderData.status as ReminderStatus,
            escalationProfileId,
            nextTriggerAt: nextTrigger,
            schedule: {
              create: {
                type: reminderData.schedule.type as ScheduleType,
                cronExpression: reminderData.schedule.cronExpression,
                timezone: reminderData.schedule.timezone,
              },
            },
          },
          include: {
            schedule: true,
          },
        });
        createdReminders.push(reminder);
      } else {
        createdReminders.push(existing);
      }
    }

    return createdReminders;
  }

  /**
   * Seed agent subscriptions
   */
  async seedAgentSubscriptions(userId: string): Promise<any[]> {
    // First, ensure agent definitions exist
    const agentDefinitions = [
      {
        type: 'email',
        name: 'Email',
        description: 'Send notifications via email',
        version: '1.0.0',
        author: 'Escalating Reminders',
        isOfficial: true,
        isVerified: true,
        minimumTier: 'FREE',
        capabilities: {
          canPush: true,
          canPull: false,
          canReceiveCommands: true,
          supportedActions: ['snooze', 'dismiss', 'complete'],
        },
        configurationSchema: {
          fields: [],
        },
      },
      {
        type: 'webhook',
        name: 'Webhook',
        description: 'Send notifications via webhook',
        version: '1.0.0',
        author: 'Escalating Reminders',
        isOfficial: true,
        isVerified: true,
        minimumTier: 'FREE',
        capabilities: {
          canPush: true,
          canPull: false,
          canReceiveCommands: false,
          supportedActions: [],
        },
        configurationSchema: {
          fields: [
            {
              key: 'url',
              type: 'url',
              label: 'Webhook URL',
              required: true,
            },
          ],
        },
      },
    ];

    // Create agent definitions if they don't exist (using type as unique identifier)
    for (const agentDef of agentDefinitions) {
      await this.prisma.agentDefinition.upsert({
        where: { type: agentDef.type },
        update: {
          // Keep definitions in sync across runs.
          name: agentDef.name,
          description: agentDef.description,
          version: agentDef.version,
          author: agentDef.author,
          isOfficial: agentDef.isOfficial,
          isVerified: agentDef.isVerified,
          minimumTier: agentDef.minimumTier as any,
          capabilities: agentDef.capabilities as any,
          configurationSchema: agentDef.configurationSchema as any,
        },
        create: {
          ...agentDef,
          minimumTier: agentDef.minimumTier as any,
          capabilities: agentDef.capabilities as any,
          configurationSchema: agentDef.configurationSchema as any,
        },
      });
    }

    // Get agent definitions to get their IDs
    const emailAgent = await this.prisma.agentDefinition.findUnique({
      where: { type: 'email' },
    });
    const webhookAgent = await this.prisma.agentDefinition.findUnique({
      where: { type: 'webhook' },
    });

    if (!emailAgent || !webhookAgent) {
      throw new Error('Failed to create agent definitions');
    }

    // Create agent subscriptions
    const subscriptions = [
      {
        userId,
        agentDefinitionId: emailAgent.id,
        configuration: {},
        isEnabled: true,
      },
      {
        userId,
        agentDefinitionId: webhookAgent.id,
        configuration: {
          url: 'https://example.com/webhook',
        },
        isEnabled: true,
      },
    ];

    const createdSubscriptions = [];

    for (const subData of subscriptions) {
      const existing = await this.prisma.userAgentSubscription.findFirst({
        where: {
          userId: subData.userId,
          agentDefinitionId: subData.agentDefinitionId,
        },
      });

      if (!existing) {
        const subscription = await this.prisma.userAgentSubscription.create({
          data: subData,
        });
        createdSubscriptions.push(subscription);
      } else {
        // Keep existing subscriptions compatible with current schema keys.
        const existingConfig = (existing.configuration || {}) as any;
        const desiredConfig = subData.configuration as any;
        const mergedConfig =
          existingConfig.url || existingConfig.webhookUrl
            ? {
                ...existingConfig,
                ...(existingConfig.url ? {} : existingConfig.webhookUrl ? { url: existingConfig.webhookUrl } : {}),
              }
            : { ...existingConfig, ...desiredConfig };

        const updated = await this.prisma.userAgentSubscription.update({
          where: { id: existing.id },
          data: {
            configuration: mergedConfig as any,
            isEnabled: true,
          },
        });
        createdSubscriptions.push(updated);
      }
    }

    return createdSubscriptions;
  }

  /**
   * Clear all test data
   */
  async clearTestData(): Promise<void> {
    // Find test user IDs first
    const testUsers = await this.prisma.user.findMany({
      where: {
        email: {
          in: ['testuser@example.com', 'admin@example.com'],
        },
      },
      select: { id: true },
    });

    const userIds = testUsers.map((u) => u.id);

    if (userIds.length === 0) {
      return; // No test users to delete
    }

    // Delete in order to respect foreign key constraints
    // Delete user agent subscriptions
    await this.prisma.userAgentSubscription.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    });

    // Delete reminders (cascades will handle schedules, snoozes, etc.)
    await this.prisma.reminder.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    });

    // Delete escalation profiles
    await this.prisma.escalationProfile.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    });

    // Delete admin users
    await this.prisma.adminUser.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    });

    // Finally delete users (cascades will handle profiles, subscriptions, etc.)
    await this.prisma.user.deleteMany({
      where: {
        id: {
          in: userIds,
        },
      },
    });
  }

  /**
   * Calculate next trigger time from schedule
   */
  private calculateNextTrigger(schedule: {
    type: string;
    cronExpression?: string;
    timezone: string;
  }): Date {
    // Simple implementation - in production, use a cron parser
    // For now, return 1 hour from now
    return new Date(Date.now() + 60 * 60 * 1000);
  }
}
