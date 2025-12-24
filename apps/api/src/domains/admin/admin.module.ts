import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { CacheModule } from '../../infrastructure/cache/cache.module';
import { EventBusModule } from '../../infrastructure/events/event-bus.module';
import { AdminController } from './admin.controller';
import { AdminRepository } from './admin.repository';
import { AdminService } from './admin.service';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminAuthorizationService } from './admin-authorization.service';
import { AdminGuard } from '../../common/guards/admin.guard';

/**
 * Admin module.
 * Provides admin domain services, repositories, and controllers.
 */
@Module({
  imports: [DatabaseModule, CacheModule, EventBusModule],
  controllers: [AdminController],
  providers: [
    AdminGuard,
    AdminRepository,
    {
      provide: 'IAdminRepository',
      useClass: AdminRepository,
    },
    AdminAuthorizationService,
    {
      provide: 'IAdminAuthorizationService',
      useClass: AdminAuthorizationService,
    },
    AdminService,
    {
      provide: 'IAdminService',
      useClass: AdminService,
    },
    AdminDashboardService,
    {
      provide: 'IAdminDashboardService',
      useClass: AdminDashboardService,
    },
  ],
  exports: [
    'IAdminRepository',
    'IAdminService',
    'IAdminDashboardService',
    'IAdminAuthorizationService',
  ],
})
export class AdminModule {}
