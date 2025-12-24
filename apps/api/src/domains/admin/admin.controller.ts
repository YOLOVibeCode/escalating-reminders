import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminGuard } from '../../common/guards/admin.guard';
import type { IAdminDashboardService, IAdminService } from '@er/interfaces';
import type {
  AdminUser,
  AdminRole,
  PaginatedResult,
  User,
  Subscription,
  PaymentHistory,
  SystemHealthSnapshot,
  SupportNote,
} from '@er/types';
import type {
  DashboardOverview,
  UserStats,
  UserListFilters,
  UserDetails,
  BillingStats,
  SubscriptionListFilters,
  PaymentHistoryFilters,
  RevenueMetrics,
  SystemHealth,
  ReminderStats,
  NotificationStats,
  EscalationStats,
  AgentStats,
  AuditLogFilters,
} from '@er/interfaces';

/**
 * Admin controller.
 * Handles HTTP requests for admin endpoints.
 * All routes require admin access via AdminGuard.
 */
@ApiTags('admin')
@Controller('admin')
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    @Inject('IAdminDashboardService')
    private readonly dashboardService: IAdminDashboardService,
    @Inject('IAdminService')
    private readonly adminService: IAdminService,
  ) {}

  // ============================================
  // Dashboard Overview
  // ============================================

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard overview statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard overview retrieved' })
  async getDashboard(@Request() req: any): Promise<{ success: true; data: DashboardOverview }> {
    const result = await this.dashboardService.getDashboardOverview();
    return {
      success: true,
      data: result,
    };
  }

  // ============================================
  // User Management
  // ============================================

  @Get('users/stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved' })
  async getUserStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ success: true; data: UserStats }> {
    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    const result = await this.dashboardService.getUserStats(filters);
    return {
      success: true,
      data: result,
    };
  }

  @Get('users')
  @ApiOperation({ summary: 'Get paginated list of users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'tier', required: false, type: String })
  @ApiResponse({ status: 200, description: 'User list retrieved' })
  async getUserList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('tier') tier?: string,
  ): Promise<{ success: true; data: PaginatedResult<User> }> {
    const filters: any = {};
    if (page) filters.page = parseInt(page, 10);
    if (pageSize) filters.pageSize = parseInt(pageSize, 10);
    if (search) filters.search = search;
    if (tier) filters.tier = tier;
    const result = await this.dashboardService.getUserList(filters);
    return {
      success: true,
      data: result,
    };
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get detailed user information' })
  @ApiResponse({ status: 200, description: 'User details retrieved' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserDetails(@Param('id') userId: string): Promise<{ success: true; data: UserDetails }> {
    const result = await this.dashboardService.getUserDetails(userId);
    return {
      success: true,
      data: result,
    };
  }

  @Post('users/:id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend a user account' })
  @ApiResponse({ status: 200, description: 'User suspended successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async suspendUser(
    @Param('id') userId: string,
    @Body() body: { reason: string },
    @Request() req: any,
  ): Promise<{ success: true }> {
    await this.adminService.suspendUser(userId, body.reason, req.user.sub);
    return { success: true };
  }

  @Post('users/:id/unsuspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsuspend a user account' })
  @ApiResponse({ status: 200, description: 'User unsuspended successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async unsuspendUser(@Param('id') userId: string, @Request() req: any): Promise<{ success: true }> {
    await this.adminService.unsuspendUser(userId, req.user.sub);
    return { success: true };
  }

  @Post('users/:id/disable-delivery')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable outbound delivery for a user (no messages sent)' })
  @ApiResponse({ status: 200, description: 'User delivery disabled successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async disableUserDelivery(
    @Param('id') userId: string,
    @Body() body: { reason: string },
    @Request() req: any,
  ): Promise<{ success: true }> {
    await this.adminService.disableUserDelivery(userId, body.reason, req.user.sub);
    return { success: true };
  }

  @Post('users/:id/enable-delivery')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable outbound delivery for a user' })
  @ApiResponse({ status: 200, description: 'User delivery enabled successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async enableUserDelivery(
    @Param('id') userId: string,
    @Request() req: any,
  ): Promise<{ success: true }> {
    await this.adminService.enableUserDelivery(userId, req.user.sub);
    return { success: true };
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a user account' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async deleteUser(
    @Param('id') userId: string,
    @Body() body: { reason: string },
    @Request() req: any,
  ): Promise<{ success: true }> {
    await this.adminService.deleteUser(userId, body.reason, req.user.sub);
    return { success: true };
  }

  // ============================================
  // Support Notes
  // ============================================

  @Post('support-notes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a support note for a user' })
  @ApiResponse({ status: 200, description: 'Support note created' })
  async createSupportNote(
    @Body() body: { userId: string; content: string },
    @Request() req: any,
  ): Promise<{ success: true; data: SupportNote }> {
    const note = await this.adminService.addSupportNote(body.userId, body.content, req.user.sub);
    return { success: true, data: note };
  }

  @Patch('support-notes/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a support note' })
  @ApiResponse({ status: 200, description: 'Support note updated' })
  async updateSupportNote(
    @Param('id') noteId: string,
    @Body() body: { content: string },
    @Request() req: any,
  ): Promise<{ success: true; data: SupportNote }> {
    const note = await this.adminService.updateSupportNote(noteId, body.content, req.user.sub);
    return { success: true, data: note };
  }

  @Delete('support-notes/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a support note' })
  @ApiResponse({ status: 200, description: 'Support note deleted' })
  async deleteSupportNote(
    @Param('id') noteId: string,
    @Request() req: any,
  ): Promise<{ success: true }> {
    await this.adminService.deleteSupportNote(noteId, req.user.sub);
    return { success: true };
  }

  // ============================================
  // Billing Management
  // ============================================

  @Get('billing/stats')
  @ApiOperation({ summary: 'Get billing statistics' })
  @ApiResponse({ status: 200, description: 'Billing statistics retrieved' })
  async getBillingStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ success: true; data: BillingStats }> {
    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    const result = await this.dashboardService.getBillingStats(filters);
    return {
      success: true,
      data: result,
    };
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'Get paginated list of subscriptions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'tier', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Subscription list retrieved' })
  async getSubscriptionList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('tier') tier?: string,
  ): Promise<{ success: true; data: PaginatedResult<Subscription> }> {
    const filters: any = {};
    if (page) filters.page = parseInt(page, 10);
    if (pageSize) filters.pageSize = parseInt(pageSize, 10);
    if (status) filters.status = status;
    if (tier) filters.tier = tier;
    const result = await this.dashboardService.getSubscriptionList(filters);
    return {
      success: true,
      data: result,
    };
  }

  @Get('payments')
  @ApiOperation({ summary: 'Get payment history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'subscriptionId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Payment history retrieved' })
  async getPaymentHistory(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('subscriptionId') subscriptionId?: string,
    @Query('status') status?: string,
  ): Promise<{ success: true; data: PaginatedResult<PaymentHistory> }> {
    const filters: any = {};
    if (page) filters.page = parseInt(page, 10);
    if (pageSize) filters.pageSize = parseInt(pageSize, 10);
    if (subscriptionId) filters.subscriptionId = subscriptionId;
    if (status) filters.status = status;
    const result = await this.dashboardService.getPaymentHistory(filters);
    return {
      success: true,
      data: result,
    };
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue metrics' })
  @ApiResponse({ status: 200, description: 'Revenue metrics retrieved' })
  async getRevenueMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ success: true; data: RevenueMetrics }> {
    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    const result = await this.dashboardService.getRevenueMetrics(filters);
    return {
      success: true,
      data: result,
    };
  }

  // ============================================
  // System Health
  // ============================================

  @Get('system/health')
  @ApiOperation({ summary: 'Get current system health status' })
  @ApiResponse({ status: 200, description: 'System health retrieved' })
  async getSystemHealth(): Promise<{ success: true; data: SystemHealth }> {
    const result = await this.dashboardService.getSystemHealth();
    return {
      success: true,
      data: result,
    };
  }

  @Get('system/health/history')
  @ApiOperation({ summary: 'Get system health history' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Health history retrieved' })
  async getSystemHealthHistory(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ): Promise<{ success: true; data: SystemHealthSnapshot[] }> {
    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (limit) filters.limit = parseInt(limit, 10);
    const result = await this.dashboardService.getSystemHealthHistory(filters);
    return {
      success: true,
      data: result,
    };
  }

  @Get('system/queues')
  @ApiOperation({ summary: 'Get queue statistics' })
  @ApiResponse({ status: 200, description: 'Queue statistics retrieved' })
  async getQueueStats(): Promise<{ success: true; data: any }> {
    const result = await this.dashboardService.getQueueStats();
    return {
      success: true,
      data: result,
    };
  }

  @Get('system/workers')
  @ApiOperation({ summary: 'Get worker statistics' })
  @ApiResponse({ status: 200, description: 'Worker statistics retrieved' })
  async getWorkerStats(): Promise<{ success: true; data: any }> {
    const result = await this.dashboardService.getWorkerStats();
    return {
      success: true,
      data: result,
    };
  }

  // ============================================
  // Reminders & Notifications
  // ============================================

  @Get('reminders/stats')
  @ApiOperation({ summary: 'Get reminder statistics' })
  @ApiResponse({ status: 200, description: 'Reminder statistics retrieved' })
  async getReminderStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ success: true; data: ReminderStats }> {
    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    const result = await this.dashboardService.getReminderStats(filters);
    return {
      success: true,
      data: result,
    };
  }

  @Get('notifications/stats')
  @ApiOperation({ summary: 'Get notification statistics' })
  @ApiResponse({ status: 200, description: 'Notification statistics retrieved' })
  async getNotificationStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('agentType') agentType?: string,
  ): Promise<{ success: true; data: NotificationStats }> {
    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (agentType) filters.agentType = agentType;
    const result = await this.dashboardService.getNotificationStats(filters);
    return {
      success: true,
      data: result,
    };
  }

  @Get('escalations/stats')
  @ApiOperation({ summary: 'Get escalation statistics' })
  @ApiResponse({ status: 200, description: 'Escalation statistics retrieved' })
  async getEscalationStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ success: true; data: EscalationStats }> {
    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    const result = await this.dashboardService.getEscalationStats(filters);
    return {
      success: true,
      data: result,
    };
  }

  // ============================================
  // Agents
  // ============================================

  @Get('agents/stats')
  @ApiOperation({ summary: 'Get agent statistics' })
  @ApiResponse({ status: 200, description: 'Agent statistics retrieved' })
  async getAgentStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ success: true; data: AgentStats }> {
    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    const result = await this.dashboardService.getAgentStats(filters);
    return {
      success: true,
      data: result,
    };
  }

  @Get('agents/subscriptions')
  @ApiOperation({ summary: 'Get agent subscriptions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'agentType', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Agent subscriptions retrieved' })
  async getAgentSubscriptions(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('agentType') agentType?: string,
  ): Promise<{ success: true; data: PaginatedResult<any> }> {
    const filters: any = {};
    if (page) filters.page = parseInt(page, 10);
    if (pageSize) filters.pageSize = parseInt(pageSize, 10);
    if (agentType) filters.agentType = agentType;
    const result = await this.dashboardService.getAgentSubscriptions(filters);
    return {
      success: true,
      data: result,
    };
  }

  // ============================================
  // Audit
  // ============================================

  @Get('audit')
  @ApiOperation({ summary: 'Get audit log' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'adminUserId', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'targetType', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Audit log retrieved' })
  async getAuditLog(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('adminUserId') adminUserId?: string,
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
    @Query('targetId') targetId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ success: true; data: PaginatedResult<any> }> {
    const filters: any = {};
    if (page) filters.page = parseInt(page, 10);
    if (pageSize) filters.pageSize = parseInt(pageSize, 10);
    if (adminUserId) filters.adminUserId = adminUserId;
    if (action) filters.action = action;
    if (targetType) filters.targetType = targetType;
    if (targetId) filters.targetId = targetId;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    const result = await this.dashboardService.getAuditLog(filters);
    return {
      success: true,
      data: result,
    };
  }
}
