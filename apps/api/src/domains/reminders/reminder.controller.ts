import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ReminderService } from './reminder.service';
import { ReminderSnoozeService } from './reminder-snooze.service';
import { ReminderCompletionService } from './reminder-completion.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type {
  Reminder,
  CreateReminderDto,
  UpdateReminderDto,
  ReminderFilters,
  PaginatedResult,
} from '@er/types';

/**
 * Reminder controller.
 * Handles HTTP requests for reminder endpoints.
 */
@ApiTags('reminders')
@ApiBearerAuth()
@Controller('reminders')
@UseGuards(JwtAuthGuard)
export class ReminderController {
  constructor(
    private readonly reminderService: ReminderService,
    private readonly reminderSnoozeService: ReminderSnoozeService,
    private readonly reminderCompletionService: ReminderCompletionService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new reminder' })
  @ApiResponse({
    status: 201,
    description: 'Reminder created successfully',
    type: Object,
  })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @ApiResponse({ status: 403, description: 'Quota exceeded' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req: { user: { sub: string } },
    @Body() createReminderDto: CreateReminderDto,
  ): Promise<Reminder> {
    return this.reminderService.create(req.user.sub, createReminderDto);
  }

  @Get()
  @ApiOperation({ summary: 'List user reminders' })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'SNOOZED', 'COMPLETED', 'ARCHIVED'] })
  @ApiQuery({ name: 'importance', required: false, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of reminders',
    type: Object,
  })
  async findAll(
    @Request() req: { user: { sub: string } },
    @Query() filters: ReminderFilters,
  ): Promise<PaginatedResult<Reminder>> {
    return this.reminderService.findAll(req.user.sub, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get reminder by ID' })
  @ApiParam({ name: 'id', description: 'Reminder ID' })
  @ApiResponse({
    status: 200,
    description: 'Reminder found',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findOne(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ): Promise<Reminder> {
    return this.reminderService.findById(req.user.sub, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a reminder' })
  @ApiParam({ name: 'id', description: 'Reminder ID' })
  @ApiResponse({
    status: 200,
    description: 'Reminder updated successfully',
    type: Object,
  })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() updateReminderDto: UpdateReminderDto,
  ): Promise<Reminder> {
    return this.reminderService.update(req.user.sub, id, updateReminderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a reminder' })
  @ApiParam({ name: 'id', description: 'Reminder ID' })
  @ApiResponse({ status: 204, description: 'Reminder deleted successfully' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ): Promise<void> {
    return this.reminderService.delete(req.user.sub, id);
  }

  @Post(':id/snooze')
  @ApiOperation({ summary: 'Snooze a reminder' })
  @ApiParam({ name: 'id', description: 'Reminder ID' })
  @ApiResponse({ status: 200, description: 'Reminder snoozed successfully' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 400, description: 'Invalid duration' })
  async snooze(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() body: { duration: string },
  ): Promise<{ success: true; data: { id: string; snoozeUntil: Date } }> {
    const result = await this.reminderSnoozeService.snooze(req.user.sub, id, body.duration);
    return {
      success: true,
      data: {
        id: result.id,
        snoozeUntil: result.snoozeUntil,
      },
    };
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark reminder as completed' })
  @ApiParam({ name: 'id', description: 'Reminder ID' })
  @ApiResponse({ status: 200, description: 'Reminder completed successfully' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async complete(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() body: { source?: string },
  ): Promise<{ success: true }> {
    await this.reminderCompletionService.complete(req.user.sub, id, (body.source || 'manual') as any);
    return { success: true };
  }

  @Post(':id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge reminder (stop escalation)' })
  @ApiParam({ name: 'id', description: 'Reminder ID' })
  @ApiResponse({ status: 200, description: 'Reminder acknowledged successfully' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async acknowledge(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ): Promise<{ success: true }> {
    await this.reminderCompletionService.acknowledge(req.user.sub, id);
    return { success: true };
  }
}

