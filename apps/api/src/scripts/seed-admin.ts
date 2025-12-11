/**
 * Database Seed Script for Admin Users
 * 
 * This script creates an initial admin user with SUPER_ADMIN role.
 * 
 * Usage:
 *   npm run db:seed -- --email=admin@example.com
 *   npm run db:seed -- --email=admin@example.com --role=SUPPORT_ADMIN
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const emailArg = args.find((arg) => arg.startsWith('--email='));
  const roleArg = args.find((arg) => arg.startsWith('--role='));

  if (!emailArg) {
    console.error('❌ Error: --email argument is required');
    console.log('Usage: npm run db:seed -- --email=admin@example.com [--role=SUPER_ADMIN]');
    process.exit(1);
  }

  const email = emailArg.split('=')[1];
  const role = roleArg ? roleArg.split('=')[1] : 'SUPER_ADMIN';

  // Validate role
  const validRoles = ['SUPER_ADMIN', 'SUPPORT_ADMIN', 'BILLING_ADMIN', 'READONLY_ADMIN'];
  if (!validRoles.includes(role)) {
    console.error(`❌ Error: Invalid role. Must be one of: ${validRoles.join(', ')}`);
    process.exit(1);
  }

  console.log('🌱 Starting admin user seed...\n');
  console.log(`Email: ${email}`);
  console.log(`Role: ${role}\n`);

  try {
    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
      include: { adminUser: true },
    });

    if (!user) {
      // Create new user
      console.log('👤 Creating new user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);

      user = await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          tier: 'ENTERPRISE',
          status: 'ACTIVE',
          emailVerified: true,
          profile: {
            create: {
              displayName: 'Admin User',
              timezone: 'UTC',
            },
          },
        },
        include: { adminUser: true },
      });

      console.log('✅ User created successfully');
    } else {
      console.log('ℹ️  User already exists');
    }

    // Check if admin user already exists
    if (user.adminUser) {
      console.log('ℹ️  Admin user already exists with role:', user.adminUser.role);
      
      // Update role if different
      if (user.adminUser.role !== role) {
        console.log(`🔄 Updating admin role from ${user.adminUser.role} to ${role}...`);
        await prisma.adminUser.update({
          where: { id: user.adminUser.id },
          data: { role },
        });
        console.log('✅ Admin role updated');
      }
    } else {
      // Create admin user
      console.log('🔐 Creating admin user...');
      await prisma.adminUser.create({
        data: {
          userId: user.id,
          role,
          permissions: getDefaultPermissions(role),
        },
      });
      console.log('✅ Admin user created successfully');
    }

    // Create initial subscription if needed
    const existingSubscription = await prisma.subscription.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
    });

    if (!existingSubscription) {
      console.log('💳 Creating subscription...');
      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'ENTERPRISE',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
      });
      console.log('✅ Subscription created');
    }

    console.log('\n🎉 Admin user setup complete!');
    console.log('\n📝 Login credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: admin123`);
    console.log(`Role: ${role}`);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!\n');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function getDefaultPermissions(role: string): object {
  const permissions: Record<string, any> = {
    SUPER_ADMIN: {
      all: true,
    },
    SUPPORT_ADMIN: {
      viewUsers: true,
      viewBilling: true,
      viewSystem: true,
      manageSupportNotes: true,
    },
    BILLING_ADMIN: {
      viewUsers: true,
      viewBilling: true,
      manageBilling: true,
      processRefunds: true,
    },
    READONLY_ADMIN: {
      viewUsers: true,
      viewBilling: true,
      viewSystem: true,
      viewReminders: true,
    },
  };

  return permissions[role] || {};
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
