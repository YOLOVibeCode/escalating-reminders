# Super Admin Dashboard - TDD + ISP Implementation Checklist

> **Version**: 1.0.0  
> **Created**: December 2024  
> **Status**: Ready for Implementation

---

## 📋 Design Decisions Summary

Based on architectural review, the following decisions were made:

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Admin User Model** | Option B: Separate `AdminUser` table linked to `User` | Better separation of concerns, audit trail |
| **Real-time Updates** | Option A: Polling | Simpler, works everywhere, sufficient for admin use |
| **System Health Collection** | Option B: Scheduled snapshots every 5 minutes | Enables historical analysis, better than on-demand |
| **Sensitive Data Display** | Option A: Full data visible to all admins | Admins need full context for support |
| **Admin Access Path** | Option A: `/admin/*` routes in same web app | Simpler deployment, shared auth infrastructure |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SUPER ADMIN DASHBOARD ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   FRONTEND (Next.js /admin/* routes)                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  /admin/dashboard     Overview stats & widgets                      │   │
│   │  /admin/users         User management                               │   │
│   │  /admin/billing       Subscription & payment management              │   │
│   │  /admin/system        System health & monitoring                    │   │
│   │  /admin/reminders     Reminder & notification analytics             │   │
│   │  /admin/agents        Agent management & stats                      │   │
│   │  /admin/audit         Audit log viewer                              │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                           │                                                  │
│                           │ REST API (polling)                               │
│                           ▼                                                  │
│   BACKEND (NestJS Admin Module)                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  admin/                                                             │   │
│   │    ├── IAdminService.ts          (Interface)                       │   │
│   │    ├── IAdminRepository.ts       (Interface)                       │   │
│   │    ├── IAdminDashboardService.ts (Interface)                       │   │
│   │    ├── admin.service.ts          (Implementation)                   │   │
│   │    ├── admin.repository.ts      (Implementation)                   │   │
│   │    ├── admin-dashboard.service.ts (Implementation)                  │   │
│   │    ├── admin.controller.ts       (REST endpoints)                   │   │
│   │    └── admin.module.ts           (NestJS module)                    │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                           │                                                  │
│                           │ Prisma                                          │
│                           ▼                                                  │
│   DATABASE (PostgreSQL)                                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  admin_users                                                        │   │
│   │  admin_actions                                                      │   │
│   │  support_notes                                                      │   │
│   │  system_health_snapshots                                            │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   BACKGROUND JOBS                                                            │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  System Health Snapshot Job (every 5 minutes)                       │   │
│   │  Admin Dashboard Stats Aggregation Job (every 1 minute)             │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ✅ Implementation Checklist

### Phase 1: Database Schema & Types (Foundation)

#### 1.1 Prisma Schema Extensions
- [ ] **Add Admin Domain Models to `schema.prisma`**
  - [ ] `AdminUser` model with `AdminRole` enum
  - [ ] `AdminAction` model for audit trail
  - [ ] `SupportNote` model for customer notes
  - [ ] `SystemHealthSnapshot` model for health history
  - [ ] Add `adminUser` relation to existing `User` model
  - [ ] Add indexes for performance (see schema below)

**Schema Additions:**
```prisma
enum AdminRole {
  SUPER_ADMIN
  SUPPORT_ADMIN
  BILLING_ADMIN
  READONLY_ADMIN
}

model AdminUser {
  id           String    @id @default(uuid())
  userId       String    @unique @map("user_id")
  role         AdminRole @default(READONLY_ADMIN)
  permissions  Json      @default("{}")
  lastLoginAt  DateTime? @map("last_login_at")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  adminActions AdminAction[]

  @@map("admin_users")
}

model AdminAction {
  id           String   @id @default(uuid())
  adminUserId  String   @map("admin_user_id")
  action       String
  targetType   String   @map("target_type")
  targetId     String   @map("target_id")
  reason       String?
  changes      Json     @default("{}")
  ipAddress    String?  @map("ip_address")
  createdAt    DateTime @default(now()) @map("created_at")

  adminUser AdminUser @relation(fields: [adminUserId], references: [id])

  @@index([adminUserId])
  @@index([targetType, targetId])
  @@index([createdAt])
  @@map("admin_actions")
}

model SupportNote {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  adminUserId  String   @map("admin_user_id")
  content      String
  isPinned     Boolean  @default(false) @map("is_pinned")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@index([userId])
  @@map("support_notes")
}

model SystemHealthSnapshot {
  id                String   @id @default(uuid())
  timestamp         DateTime @default(now())
  queueStats        Json     @map("queue_stats")
  workerStats       Json     @map("worker_stats")
  databaseStats     Json     @map("database_stats")
  redisStats        Json     @map("redis_stats")
  notificationStats Json     @map("notification_stats")
  errorCount        Int      @default(0) @map("error_count")
  createdAt         DateTime @default(now()) @map("created_at")

  @@index([timestamp])
  @@map("system_health_snapshots")
}
```

- [ ] **Run Prisma Migration**
  ```bash
  cd apps/api
  npx prisma migrate dev --name add_admin_domain
  npx prisma generate
  ```

- [ ] **Verify Types Generated**
  - [ ] Check `@er/types` package exports new types
  - [ ] Verify `AdminUser`, `AdminAction`, `SupportNote`, `SystemHealthSnapshot` types exist

---

### Phase 2: Interface Definitions (ISP First)

#### 2.1 Create Admin Domain Interfaces
- [ ] **Create `packages/@er/interfaces/src/domains/admin/` directory**

- [ ] **Create `IAdminRepository.ts`**
  ```typescript
  // Focus: Data access operations only
  export interface IAdminRepository {
    findAdminByUserId(userId: string): Promise<AdminUser | null>;
    findAdminById(id: string): Promise<AdminUser | null>;
    createAdmin(data: CreateAdminDto): Promise<AdminUser>;
    updateAdmin(id: string, data: UpdateAdminDto): Promise<AdminUser>;
    deleteAdmin(id: string): Promise<void>;
    listAdmins(filters?: AdminFilters): Promise<AdminUser[]>;
    
    // Admin Actions
    createAdminAction(action: CreateAdminActionDto): Promise<AdminAction>;
    getAdminActions(filters: AdminActionFilters): Promise<AdminAction[]>;
    
    // Support Notes
    createSupportNote(note: CreateSupportNoteDto): Promise<SupportNote>;
    getSupportNotes(userId: string): Promise<SupportNote[]>;
    updateSupportNote(id: string, data: UpdateSupportNoteDto): Promise<SupportNote>;
    deleteSupportNote(id: string): Promise<void>;
    
    // System Health
    createHealthSnapshot(snapshot: CreateHealthSnapshotDto): Promise<SystemHealthSnapshot>;
    getHealthSnapshots(filters: HealthSnapshotFilters): Promise<SystemHealthSnapshot[]>;
    getLatestHealthSnapshot(): Promise<SystemHealthSnapshot | null>;
  }
  ```

- [ ] **Create `IAdminService.ts`**
  ```typescript
  // Focus: Business logic for admin operations
  export interface IAdminService {
    // Admin Management
    promoteToAdmin(userId: string, role: AdminRole, adminUserId: string): Promise<AdminUser>;
    demoteFromAdmin(adminUserId: string, requestingAdminId: string): Promise<void>;
    updateAdminRole(adminUserId: string, role: AdminRole, requestingAdminId: string): Promise<AdminUser>;
    
    // User Management (Admin Actions)
    suspendUser(userId: string, reason: string, adminUserId: string): Promise<void>;
    unsuspendUser(userId: string, adminUserId: string): Promise<void>;
    deleteUser(userId: string, reason: string, adminUserId: string): Promise<void>;
    
    // Support Notes
    addSupportNote(userId: string, content: string, adminUserId: string): Promise<SupportNote>;
    updateSupportNote(noteId: string, content: string, adminUserId: string): Promise<SupportNote>;
    deleteSupportNote(noteId: string, adminUserId: string): Promise<void>;
    
    // Permission Checks
    hasPermission(adminUserId: string, permission: AdminPermission): Promise<boolean>;
    canAccessResource(adminUserId: string, resource: string, resourceId: string): Promise<boolean>;
  }
  ```

- [ ] **Create `IAdminDashboardService.ts`**
  ```typescript
  // Focus: Dashboard data aggregation
  export interface IAdminDashboardService {
    // Overview Stats
    getDashboardOverview(): Promise<DashboardOverview>;
    
    // User Analytics
    getUserStats(filters?: UserStatsFilters): Promise<UserStats>;
    getUserList(filters: UserListFilters): Promise<PaginatedUsers>;
    getUserDetails(userId: string): Promise<UserDetails>;
    
    // Billing Analytics
    getBillingStats(filters?: BillingStatsFilters): Promise<BillingStats>;
    getSubscriptionList(filters: SubscriptionListFilters): Promise<PaginatedSubscriptions>;
    getPaymentHistory(filters: PaymentHistoryFilters): Promise<PaginatedPayments>;
    getRevenueMetrics(filters: RevenueMetricsFilters): Promise<RevenueMetrics>;
    
    // System Health
    getSystemHealth(): Promise<SystemHealth>;
    getSystemHealthHistory(filters: HealthHistoryFilters): Promise<SystemHealthSnapshot[]>;
    getQueueStats(): Promise<QueueStats>;
    getWorkerStats(): Promise<WorkerStats>;
    
    // Reminder & Notification Analytics
    getReminderStats(filters?: ReminderStatsFilters): Promise<ReminderStats>;
    getNotificationStats(filters?: NotificationStatsFilters): Promise<NotificationStats>;
    getEscalationStats(filters?: EscalationStatsFilters): Promise<EscalationStats>;
    
    // Agent Analytics
    getAgentStats(filters?: AgentStatsFilters): Promise<AgentStats>;
    getAgentSubscriptions(filters: AgentSubscriptionFilters): Promise<PaginatedAgentSubscriptions>;
    
    // Audit
    getAuditLog(filters: AuditLogFilters): Promise<PaginatedAuditLog>;
  }
  ```

- [ ] **Create `IAdminAuthorizationService.ts`**
  ```typescript
  // Focus: Authorization logic only
  export interface IAdminAuthorizationService {
    verifyAdminAccess(userId: string): Promise<AdminUser>;
    checkPermission(adminUser: AdminUser, permission: AdminPermission): boolean;
    checkResourceAccess(adminUser: AdminUser, resource: string, resourceId: string): Promise<boolean>;
    requirePermission(adminUser: AdminUser, permission: AdminPermission): void;
  }
  ```

- [ ] **Create `index.ts`** to export all interfaces
  ```typescript
  export * from './IAdminRepository';
  export * from './IAdminService';
  export * from './IAdminDashboardService';
  export * from './IAdminAuthorizationService';
  ```

- [ ] **Create Type Definitions** (if not auto-generated from Prisma)
  - [ ] Add to `packages/@er/types/src/admin.ts`:
    - `AdminRole` enum
    - `AdminUser` type
    - `AdminAction` type
    - `SupportNote` type
    - `SystemHealthSnapshot` type
    - All DTO types for admin operations

---

### Phase 3: CLI Test Harnesses (TDD)

#### 3.1 Admin Repository Tests
- [ ] **Create `apps/api/src/domains/admin/__tests__/admin.repository.spec.ts`**
  - [ ] Test `findAdminByUserId` with existing user
  - [ ] Test `findAdminByUserId` with non-admin user (returns null)
  - [ ] Test `createAdmin` creates admin user
  - [ ] Test `updateAdmin` updates role
  - [ ] Test `createAdminAction` logs action
  - [ ] Test `getAdminActions` filters correctly
  - [ ] Test `createSupportNote` creates note
  - [ ] Test `getSupportNotes` returns user's notes
  - [ ] Test `createHealthSnapshot` creates snapshot

**Test Structure:**
```typescript
describe('AdminRepository (CLI Test Harness)', () => {
  let repository: IAdminRepository;
  let mockPrisma: MockPrismaClient;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    repository = new AdminRepository(mockPrisma);
  });

  describe('findAdminByUserId', () => {
    it('should return admin user when exists', async () => {
      // Arrange
      const userId = 'user_123';
      mockPrisma.adminUser.findUnique.mockResolvedValue(mockAdminUser);

      // Act
      const result = await repository.findAdminByUserId(userId);

      // Assert
      expect(result).toEqual(mockAdminUser);
      expect(mockPrisma.adminUser.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    // More tests...
  });
});
```

#### 3.2 Admin Service Tests
- [ ] **Create `apps/api/src/domains/admin/__tests__/admin.service.spec.ts`**
  - [ ] Test `promoteToAdmin` creates admin user
  - [ ] Test `promoteToAdmin` logs admin action
  - [ ] Test `suspendUser` updates user status
  - [ ] Test `suspendUser` logs admin action
  - [ ] Test `hasPermission` checks role correctly
  - [ ] Test `canAccessResource` validates access

#### 3.3 Admin Dashboard Service Tests
- [ ] **Create `apps/api/src/domains/admin/__tests__/admin-dashboard.service.spec.ts`**
  - [ ] Test `getDashboardOverview` aggregates stats
  - [ ] Test `getUserStats` calculates metrics
  - [ ] Test `getBillingStats` aggregates revenue
  - [ ] Test `getSystemHealth` returns current health
  - [ ] Test `getReminderStats` calculates reminder metrics

#### 3.4 Admin Authorization Service Tests
- [ ] **Create `apps/api/src/domains/admin/__tests__/admin-authorization.service.spec.ts`**
  - [ ] Test `verifyAdminAccess` throws if not admin
  - [ ] Test `checkPermission` validates SUPER_ADMIN permissions
  - [ ] Test `checkPermission` validates SUPPORT_ADMIN permissions
  - [ ] Test `requirePermission` throws if insufficient

---

### Phase 4: Mock Implementations (TDD Validation)

#### 4.1 Mock Admin Repository
- [ ] **Create `apps/api/src/domains/admin/__tests__/mocks/mock-admin.repository.ts`**
  ```typescript
  export class MockAdminRepository implements IAdminRepository {
    private admins: Map<string, AdminUser> = new Map();
    private actions: AdminAction[] = [];
    private notes: SupportNote[] = [];
    private snapshots: SystemHealthSnapshot[] = [];

    async findAdminByUserId(userId: string): Promise<AdminUser | null> {
      return Array.from(this.admins.values()).find(a => a.userId === userId) || null;
    }

    // Implement all interface methods with in-memory storage
  }
  ```

#### 4.2 Mock Admin Service
- [ ] **Create `apps/api/src/domains/admin/__tests__/mocks/mock-admin.service.ts`**
  - [ ] Implement all `IAdminService` methods with mock logic
  - [ ] Use `MockAdminRepository` for data access

#### 4.3 Mock Admin Dashboard Service
- [ ] **Create `apps/api/src/domains/admin/__tests__/mocks/mock-admin-dashboard.service.ts`**
  - [ ] Implement all `IAdminDashboardService` methods
  - [ ] Return mock aggregated data

#### 4.4 Run CLI Tests with Mocks
- [ ] **Create CLI test runner script**
  ```bash
  # _Resources/scripts/test-admin-domain.sh
  npm run test:admin -- --testPathPattern=admin
  ```
- [ ] **Verify all tests pass with mock implementations**

---

### Phase 5: Concrete Implementations

#### 5.1 Admin Repository Implementation
- [ ] **Create `apps/api/src/domains/admin/admin.repository.ts`**
  - [ ] Implement `IAdminRepository` using Prisma
  - [ ] Use dependency injection for PrismaService
  - [ ] Add proper error handling
  - [ ] Add transaction support where needed

**Implementation Pattern:**
```typescript
@Injectable()
export class AdminRepository implements IAdminRepository {
  constructor(private prisma: PrismaService) {}

  async findAdminByUserId(userId: string): Promise<AdminUser | null> {
    return this.prisma.adminUser.findUnique({
      where: { userId },
      include: { user: true },
    });
  }

  // Implement all interface methods...
}
```

#### 5.2 Admin Service Implementation
- [ ] **Create `apps/api/src/domains/admin/admin.service.ts`**
  - [ ] Implement `IAdminService` using `IAdminRepository`
  - [ ] Inject `IAdminRepository` (not concrete class)
  - [ ] Inject `IAdminAuthorizationService` for permission checks
  - [ ] Emit domain events for admin actions
  - [ ] Add audit logging for all admin operations

**Event Emission Pattern:**
```typescript
@Injectable()
export class AdminService implements IAdminService {
  constructor(
    private repository: IAdminRepository,
    private authorization: IAdminAuthorizationService,
    private eventBus: IEventBus,
  ) {}

  async suspendUser(userId: string, reason: string, adminUserId: string): Promise<void> {
    // 1. Verify admin has permission
    const admin = await this.authorization.verifyAdminAccess(adminUserId);
    this.authorization.requirePermission(admin, AdminPermission.SUSPEND_USER);

    // 2. Perform action
    await this.repository.createAdminAction({
      adminUserId,
      action: 'user.suspended',
      targetType: 'User',
      targetId: userId,
      reason,
      changes: { status: 'SUSPENDED' },
    });

    // 3. Emit event
    await this.eventBus.publish('user.suspended', {
      userId,
      adminUserId,
      reason,
      timestamp: new Date(),
    });

    // 4. Update user status (via User domain)
    // ... (delegate to User domain service)
  }
}
```

#### 5.3 Admin Dashboard Service Implementation
- [ ] **Create `apps/api/src/domains/admin/admin-dashboard.service.ts`**
  - [ ] Implement `IAdminDashboardService`
  - [ ] Inject multiple repositories (User, Subscription, Reminder, etc.)
  - [ ] Aggregate data from multiple sources
  - [ ] Cache expensive queries (use `ICache`)
  - [ ] Handle pagination correctly

**Aggregation Pattern:**
```typescript
@Injectable()
export class AdminDashboardService implements IAdminDashboardService {
  constructor(
    private userRepo: IUserRepository,
    private subscriptionRepo: ISubscriptionRepository,
    private reminderRepo: IReminderRepository,
    private notificationRepo: INotificationRepository,
    private healthRepo: IAdminRepository,
    private cache: ICache,
  ) {}

  async getDashboardOverview(): Promise<DashboardOverview> {
    const cacheKey = 'admin:dashboard:overview';
    const cached = await this.cache.get<DashboardOverview>(cacheKey);
    if (cached) return cached;

    const [mrr, activeUsers, activeReminders, deliveryRate, queueDepth, errors] = await Promise.all([
      this.calculateMRR(),
      this.countActiveUsers24h(),
      this.countActiveReminders(),
      this.calculateDeliveryRate(),
      this.getQueueDepth(),
      this.countRecentErrors(),
    ]);

    const overview: DashboardOverview = {
      mrr,
      activeUsers,
      activeReminders,
      deliveryRate,
      queueDepth,
      recentErrors: errors,
      timestamp: new Date(),
    };

    await this.cache.set(cacheKey, overview, 60); // Cache 1 minute
    return overview;
  }
}
```

#### 5.4 Admin Authorization Service Implementation
- [ ] **Create `apps/api/src/domains/admin/admin-authorization.service.ts`**
  - [ ] Implement `IAdminAuthorizationService`
  - [ ] Define permission matrix (role → permissions)
  - [ ] Add resource-level access checks

**Permission Matrix:**
```typescript
const PERMISSION_MATRIX: Record<AdminRole, AdminPermission[]> = {
  SUPER_ADMIN: [
    AdminPermission.ALL, // Wildcard
  ],
  SUPPORT_ADMIN: [
    AdminPermission.VIEW_USERS,
    AdminPermission.VIEW_BILLING,
    AdminPermission.VIEW_SYSTEM_STATUS,
    AdminPermission.CREATE_SUPPORT_NOTES,
  ],
  BILLING_ADMIN: [
    AdminPermission.VIEW_USERS,
    AdminPermission.MANAGE_BILLING,
    AdminPermission.OVERRIDE_SUBSCRIPTIONS,
    AdminPermission.PROCESS_REFUNDS,
  ],
  READONLY_ADMIN: [
    AdminPermission.VIEW_ALL,
  ],
};
```

#### 5.5 Run Tests Against Concrete Implementations
- [ ] **Update test files to use concrete implementations**
- [ ] **Run full test suite**
- [ ] **Verify all tests pass**

---

### Phase 6: API Layer (Controllers)

#### 6.1 Admin Controller
- [ ] **Create `apps/api/src/domains/admin/admin.controller.ts`**
  - [ ] Add `@UseGuards(AdminGuard)` to all endpoints
  - [ ] Implement REST endpoints:
    - [ ] `GET /admin/dashboard` → `getDashboardOverview()`
    - [ ] `GET /admin/users` → `getUserList()`
    - [ ] `GET /admin/users/:id` → `getUserDetails()`
    - [ ] `POST /admin/users/:id/suspend` → `suspendUser()`
    - [ ] `POST /admin/users/:id/unsuspend` → `unsuspendUser()`
    - [ ] `DELETE /admin/users/:id` → `deleteUser()`
    - [ ] `GET /admin/subscriptions` → `getSubscriptionList()`
    - [ ] `POST /admin/subscriptions/:id/override` → `overrideSubscription()`
    - [ ] `GET /admin/payments` → `getPaymentHistory()`
    - [ ] `POST /admin/payments/:id/refund` → `initiateRefund()`
    - [ ] `GET /admin/system/health` → `getSystemHealth()`
    - [ ] `GET /admin/system/health/history` → `getSystemHealthHistory()`
    - [ ] `GET /admin/system/queues` → `getQueueStats()`
    - [ ] `POST /admin/system/queues/:name/pause` → `pauseQueue()`
    - [ ] `GET /admin/reminders/stats` → `getReminderStats()`
    - [ ] `GET /admin/notifications/stats` → `getNotificationStats()`
    - [ ] `POST /admin/notifications/:id/retry` → `retryNotification()`
    - [ ] `GET /admin/agents/stats` → `getAgentStats()`
    - [ ] `GET /admin/audit` → `getAuditLog()`

**Controller Pattern:**
```typescript
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private dashboardService: IAdminDashboardService,
    private adminService: IAdminService,
  ) {}

  @Get('dashboard')
  async getDashboard(@Request() req) {
    const admin = req.user; // Set by AdminGuard
    return this.dashboardService.getDashboardOverview();
  }

  @Post('users/:id/suspend')
  async suspendUser(
    @Param('id') userId: string,
    @Body() dto: SuspendUserDto,
    @Request() req,
  ) {
    return this.adminService.suspendUser(userId, dto.reason, req.user.id);
  }
}
```

#### 6.2 Admin Guard
- [ ] **Create `apps/api/src/common/guards/admin.guard.ts`**
  - [ ] Verify JWT token (extends JwtAuthGuard)
  - [ ] Check if user is admin via `IAdminAuthorizationService`
  - [ ] Attach `AdminUser` to request object

**Guard Pattern:**
```typescript
@Injectable()
export class AdminGuard extends JwtAuthGuard {
  constructor(
    private authorization: IAdminAuthorizationService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First verify JWT
    const jwtValid = await super.canActivate(context);
    if (!jwtValid) return false;

    const request = context.switchToHttp().getRequest();
    const userId = request.user.sub; // From JWT

    // Verify admin access
    const admin = await this.authorization.verifyAdminAccess(userId);
    request.user = admin; // Replace with AdminUser

    return true;
  }
}
```

#### 6.3 Admin Module
- [ ] **Create `apps/api/src/domains/admin/admin.module.ts`**
  - [ ] Import all dependencies (DatabaseModule, CacheModule, etc.)
  - [ ] Provide all interfaces with concrete implementations
  - [ ] Export services for use in other modules

**Module Pattern:**
```typescript
@Module({
  imports: [
    DatabaseModule,
    CacheModule,
    EventBusModule,
    // Import other domain modules for aggregation
  ],
  controllers: [AdminController],
  providers: [
    {
      provide: 'IAdminRepository',
      useClass: AdminRepository,
    },
    {
      provide: 'IAdminService',
      useClass: AdminService,
    },
    {
      provide: 'IAdminDashboardService',
      useClass: AdminDashboardService,
    },
    {
      provide: 'IAdminAuthorizationService',
      useClass: AdminAuthorizationService,
    },
  ],
  exports: ['IAdminService', 'IAdminDashboardService'],
})
export class AdminModule {}
```

#### 6.4 Controller Tests
- [ ] **Create `apps/api/src/domains/admin/__tests__/admin.controller.spec.ts`**
  - [ ] Test all endpoints with mocked services
  - [ ] Test AdminGuard integration
  - [ ] Test error handling

---

### Phase 7: Background Jobs

#### 7.1 System Health Snapshot Job
- [ ] **Create `apps/api/src/workers/jobs/system-health-snapshot-job.ts`**
  - [ ] Collect queue stats from BullMQ
  - [ ] Collect worker stats from BullMQ
  - [ ] Collect database stats from Prisma
  - [ ] Collect Redis stats from Redis client
  - [ ] Collect notification stats from NotificationLog
  - [ ] Save snapshot to database via `IAdminRepository`
  - [ ] Run every 5 minutes via BullMQ cron

**Job Pattern:**
```typescript
@Injectable()
export class SystemHealthSnapshotJob {
  constructor(
    private queueService: IQueue,
    private cache: ICache,
    private prisma: PrismaService,
    private adminRepo: IAdminRepository,
  ) {}

  @Cron('*/5 * * * *') // Every 5 minutes
  async execute() {
    const [queueStats, workerStats, dbStats, redisStats, notificationStats] = await Promise.all([
      this.collectQueueStats(),
      this.collectWorkerStats(),
      this.collectDatabaseStats(),
      this.collectRedisStats(),
      this.collectNotificationStats(),
    ]);

    await this.adminRepo.createHealthSnapshot({
      timestamp: new Date(),
      queueStats,
      workerStats,
      databaseStats: dbStats,
      redisStats,
      notificationStats,
      errorCount: await this.countRecentErrors(),
    });
  }
}
```

#### 7.2 Dashboard Stats Aggregation Job (Optional)
- [ ] **Create `apps/api/src/workers/jobs/dashboard-stats-job.ts`**
  - [ ] Pre-calculate expensive dashboard queries
  - [ ] Cache results in Redis
  - [ ] Run every 1 minute

---

### Phase 8: Frontend Implementation

#### 8.1 Admin Route Protection
- [ ] **Create `apps/web/src/middleware.ts`** (Next.js middleware)
  - [ ] Check if route starts with `/admin`
  - [ ] Verify JWT token
  - [ ] Verify admin role via API call
  - [ ] Redirect to login if not admin

#### 8.2 Admin Layout Component
- [ ] **Create `apps/web/src/app/admin/layout.tsx`**
  - [ ] Admin navigation sidebar
  - [ ] Admin header with user info
  - [ ] Loading states

#### 8.3 Dashboard Overview Page
- [ ] **Create `apps/web/src/app/admin/dashboard/page.tsx`**
  - [ ] Fetch overview stats (poll every 30 seconds)
  - [ ] Display widgets:
    - [ ] MRR card
    - [ ] Active users card
    - [ ] Active reminders card
    - [ ] Delivery rate card
    - [ ] Queue depth card
    - [ ] Recent errors card
  - [ ] Use shadcn/ui components (Card, Badge, etc.)

#### 8.4 Users Management Page
- [ ] **Create `apps/web/src/app/admin/users/page.tsx`**
  - [ ] User list table with pagination
  - [ ] Search and filter functionality
  - [ ] Actions: View, Suspend, Delete
  - [ ] Use TanStack Table for data grid

#### 8.5 User Details Page
- [ ] **Create `apps/web/src/app/admin/users/[id]/page.tsx`**
  - [ ] User profile display
  - [ ] Subscription info
  - [ ] Reminders list
  - [ ] Agent subscriptions
  - [ ] Support notes section
  - [ ] Activity timeline

#### 8.6 Billing Management Page
- [ ] **Create `apps/web/src/app/admin/billing/page.tsx`**
  - [ ] Subscription list
  - [ ] Payment history table
  - [ ] Revenue metrics charts
  - [ ] Tier distribution chart

#### 8.7 System Status Page
- [ ] **Create `apps/web/src/app/admin/system/page.tsx`**
  - [ ] Current health status
  - [ ] Queue stats table
  - [ ] Worker status
  - [ ] Health history graph (24h)
  - [ ] Database/Redis stats

#### 8.8 Reminders & Notifications Page
- [ ] **Create `apps/web/src/app/admin/reminders/page.tsx`**
  - [ ] Reminder stats
  - [ ] Notification logs table
  - [ ] Escalation states
  - [ ] Delivery stats by agent

#### 8.9 Agents Management Page
- [ ] **Create `apps/web/src/app/admin/agents/page.tsx`**
  - [ ] Agent definitions list
  - [ ] Subscription stats
  - [ ] Error rates
  - [ ] Usage charts

#### 8.10 Audit Log Page
- [ ] **Create `apps/web/src/app/admin/audit/page.tsx`**
  - [ ] Audit log table with filters
  - [ ] Search by admin, action, resource
  - [ ] Export functionality

#### 8.11 API Client Integration
- [ ] **Update `packages/@er/api-client/src/admin.ts`**
  - [ ] Add admin API client methods
  - [ ] Type-safe request/response types
  - [ ] Error handling

---

### Phase 9: Testing & Validation

#### 9.1 Integration Tests
- [ ] **Create `apps/api/src/domains/admin/__tests__/admin.integration.spec.ts`**
  - [ ] Test full admin workflow (promote → suspend → demote)
  - [ ] Test dashboard aggregation with real data
  - [ ] Test authorization guards

#### 9.2 E2E Tests (Optional)
- [ ] **Create E2E tests for admin dashboard**
  - [ ] Test login as admin
  - [ ] Test viewing dashboard
  - [ ] Test suspending user
  - [ ] Test viewing system health

#### 9.3 Manual Testing Checklist
- [ ] **Admin User Creation**
  - [ ] Create first admin user via database seed
  - [ ] Login as admin
  - [ ] Verify admin routes accessible

- [ ] **Dashboard Functionality**
  - [ ] Verify all widgets load
  - [ ] Verify polling works (30s refresh)
  - [ ] Verify data accuracy

- [ ] **User Management**
  - [ ] Suspend user
  - [ ] Verify user cannot login
  - [ ] Unsuspend user
  - [ ] Verify user can login again

- [ ] **Billing Management**
  - [ ] View subscriptions
  - [ ] Override subscription tier
  - [ ] View payment history

- [ ] **System Health**
  - [ ] Verify health snapshots created (check DB)
  - [ ] Verify queue stats display
  - [ ] Verify health history graph

---

### Phase 10: Documentation & Deployment

#### 10.1 API Documentation
- [ ] **Add Swagger/OpenAPI annotations to admin controller**
- [ ] **Verify admin endpoints appear in `/api/docs`**

#### 10.2 Admin User Seed Script
- [ ] **Create `_Resources/scripts/seed-admin-user.ts`**
  ```typescript
  // Script to create first admin user
  // Usage: npx ts-node _Resources/scripts/seed-admin-user.ts <user-email>
  ```

#### 10.3 README Updates
- [ ] **Update main README with admin dashboard info**
- [ ] **Add admin setup instructions**

#### 10.4 Security Review
- [ ] **Verify all admin endpoints protected**
- [ ] **Verify audit logging works**
- [ ] **Verify sensitive operations require SUPER_ADMIN**

---

## 🎯 Success Criteria

The Super Admin Dashboard is complete when:

✅ **Database**
- [ ] All admin tables created and migrated
- [ ] Indexes optimized for queries

✅ **Backend**
- [ ] All interfaces defined and implemented
- [ ] All tests passing (unit + integration)
- [ ] All REST endpoints functional
- [ ] Authorization guards working
- [ ] Health snapshot job running

✅ **Frontend**
- [ ] All admin pages implemented
- [ ] Polling working for real-time updates
- [ ] All widgets displaying correct data
- [ ] Responsive design

✅ **Operations**
- [ ] First admin user can be created
- [ ] Admin actions logged to audit trail
- [ ] System health snapshots being collected
- [ ] Dashboard loads in < 2 seconds

---

## 📝 Notes

### Performance Considerations
- **Dashboard Overview**: Cache for 1 minute, refresh on demand
- **User List**: Paginate (50 per page), add indexes
- **Health History**: Limit to last 24h by default, paginate older data
- **Audit Log**: Paginate (100 per page), add date range filters

### Security Considerations
- **Admin Routes**: Protected by AdminGuard (requires admin role)
- **Sensitive Actions**: Require SUPER_ADMIN role (suspend, delete, override billing)
- **Audit Trail**: All admin actions logged (non-repudiation)
- **IP Logging**: Log IP address for all admin actions

### Future Enhancements (Post-MVP)
- [ ] Real-time updates via WebSocket (upgrade from polling)
- [ ] Advanced filtering and search
- [ ] Export to CSV/PDF
- [ ] Email alerts for critical system issues
- [ ] Custom admin dashboards (widget configuration)

---

**Ready for Implementation**: This checklist follows TDD + ISP principles and aligns with your project's architecture patterns.
