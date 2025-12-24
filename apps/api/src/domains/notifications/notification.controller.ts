/**
 * Notification controller.
 * Handles HTTP requests for notification query endpoints.
 */

import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationQueryService } from './notification-query.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { NotificationLog, PaginatedResult } from '@er/types';

/**
 * Notification controller.
 * Handles HTTP requests for notification endpoints.
 */
@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationQueryService: NotificationQueryService) {}

  @Get()
  @ApiOperation({ summary: 'List notification logs' })
  @ApiQuery({ name: 'reminderId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'SENT', 'DELIVERED', 'FAILED'] })
  @ApiQuery({ name: 'agentType', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of notification logs',
    type: Object,
  })
  async findAll(
    @Request() req: { user: { sub: string } },
    @Query() filters: {
      reminderId?: string;
      status?: string;
      agentType?: string;
      page?: number;
      pageSize?: number;
    },
  ): Promise<PaginatedResult<NotificationLog>> {
    return this.notificationQueryService.findAll(req.user.sub, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification log by ID' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification log found',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findOne(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ): Promise<NotificationLog> {
    return this.notificationQueryService.findById(req.user.sub, id);
  }
}



