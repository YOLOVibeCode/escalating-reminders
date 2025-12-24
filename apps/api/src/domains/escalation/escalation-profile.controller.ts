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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { EscalationProfileService } from './escalation-profile.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type {
  EscalationProfile,
  CreateEscalationProfileDto,
  UpdateEscalationProfileDto,
} from '@er/types';

/**
 * Escalation profile controller.
 * Handles HTTP requests for escalation profile endpoints.
 */
@ApiTags('escalation-profiles')
@ApiBearerAuth()
@Controller('escalation-profiles')
@UseGuards(JwtAuthGuard)
export class EscalationProfileController {
  constructor(
    private readonly escalationProfileService: EscalationProfileService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all available escalation profiles' })
  @ApiResponse({
    status: 200,
    description: 'List of profiles (user custom + presets)',
    type: Object,
  })
  async findAll(
    @Request() req: { user: { sub: string } },
  ): Promise<EscalationProfile[]> {
    return this.escalationProfileService.findAll(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get escalation profile by ID' })
  @ApiParam({ name: 'id', description: 'Profile ID' })
  @ApiResponse({
    status: 200,
    description: 'Profile found',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async findOne(@Param('id') id: string): Promise<EscalationProfile> {
    return this.escalationProfileService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a custom escalation profile' })
  @ApiResponse({
    status: 201,
    description: 'Profile created successfully',
    type: Object,
  })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req: { user: { sub: string } },
    @Body() createDto: CreateEscalationProfileDto,
  ): Promise<EscalationProfile> {
    return this.escalationProfileService.create(req.user.sub, createDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a custom escalation profile' })
  @ApiParam({ name: 'id', description: 'Profile ID' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() updateDto: UpdateEscalationProfileDto,
  ): Promise<EscalationProfile> {
    return this.escalationProfileService.update(req.user.sub, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a custom escalation profile' })
  @ApiParam({ name: 'id', description: 'Profile ID' })
  @ApiResponse({ status: 204, description: 'Profile deleted successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ): Promise<void> {
    return this.escalationProfileService.delete(req.user.sub, id);
  }
}

