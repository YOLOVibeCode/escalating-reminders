/**
 * Seed an initial admin user.
 *
 * Usage:
 *   npm run db:seed-admin -- --email=admin@example.com
 *   npm run db:seed-admin -- --email=admin@example.com --role=SUPPORT_ADMIN
 *   npm run db:seed-admin -- --email=admin@example.com --password=AdminPass123!
 */

import { PrismaClient, AdminRole, SubscriptionTier, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function getArg(name: string): string | undefined {
  const arg = process.argv.slice(2).find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : undefined;
}

function requireArg(name: string): string {
  const value = getArg(name);
  if (!value) {
    // eslint-disable-next-line no-console
    console.error(`❌ Error: --${name} argument is required`);
    process.exit(1);
  }
  return value;
}

function getDefaultPermissions(role: AdminRole): Record<string, unknown> {
  switch (role) {
    case AdminRole.SUPER_ADMIN:
      return { all: true };
    case AdminRole.SUPPORT_ADMIN:
      return {
        viewUsers: true,
        viewBilling: true,
        viewSystem: true,
        manageSupportNotes: true,
      };
    case AdminRole.BILLING_ADMIN:
      return {
        viewUsers: true,
        viewBilling: true,
        manageBilling: true,
        processRefunds: true,
      };
    case AdminRole.READONLY_ADMIN:
      return {
        viewUsers: true,
        viewBilling: true,
        viewSystem: true,
        viewReminders: true,
      };
  }
}

async function main() {
  const email = requireArg('email');

  const roleStr = getArg('role') || AdminRole.SUPER_ADMIN;
  const password = getArg('password') || 'AdminPass123!';
  const tierStr = getArg('tier') || SubscriptionTier.PRO;

  if (!Object.values(AdminRole).includes(roleStr as AdminRole)) {
    throw new Error(`Invalid --role. Must be one of: ${Object.values(AdminRole).join(', ')}`);
  }

  if (!Object.values(SubscriptionTier).includes(tierStr as SubscriptionTier)) {
    throw new Error(`Invalid --tier. Must be one of: ${Object.values(SubscriptionTier).join(', ')}`);
  }

  const role = roleStr as AdminRole;
  const tier = tierStr as SubscriptionTier;

  // eslint-disable-next-line no-console
  console.log('🌱 Seeding admin user');
  // eslint-disable-next-line no-console
  console.log(`   Email: ${email}`);
  // eslint-disable-next-line no-console
  console.log(`   Role:  ${role}`);
  // eslint-disable-next-line no-console
  console.log(`   Tier:  ${tier}`);

  // Create or update user
  const existing = await prisma.user.findUnique({
    where: { email },
    include: { adminUser: true, profile: true, subscription: true },
  });

  const passwordHash = await bcrypt.hash(password, 10);

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          emailVerified: true,
          profile: existing.profile
            ? { update: { displayName: existing.profile.displayName || 'Admin User', timezone: existing.profile.timezone || 'UTC' } }
            : { create: { displayName: 'Admin User', timezone: 'UTC' } },
        },
        include: { adminUser: true, profile: true, subscription: true },
      })
    : await prisma.user.create({
        data: {
          email,
          passwordHash,
          emailVerified: true,
          profile: {
            create: {
              displayName: 'Admin User',
              timezone: 'UTC',
            },
          },
          subscription: {
            create: {
              tier,
              status: SubscriptionStatus.ACTIVE,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            },
          },
        },
        include: { adminUser: true, profile: true, subscription: true },
      });

  // Ensure subscription exists
  if (!user.subscription) {
    await prisma.subscription.create({
      data: {
        userId: user.id,
        tier,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Ensure admin user exists
  if (user.adminUser) {
    await prisma.adminUser.update({
      where: { id: user.adminUser.id },
      data: { role, permissions: getDefaultPermissions(role) as any },
    });
  } else {
    await prisma.adminUser.create({
      data: {
        userId: user.id,
        role,
        permissions: getDefaultPermissions(role) as any,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log('\n✅ Admin user ready');
  // eslint-disable-next-line no-console
  console.log(`   Login: ${email}`);
  // eslint-disable-next-line no-console
  console.log(`   Password: ${password}`);
  // eslint-disable-next-line no-console
  console.log('   ⚠️  Change this password after first login.\n');
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
