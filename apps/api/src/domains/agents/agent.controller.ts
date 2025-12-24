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
import { AgentDefinitionService } from './agent-definition.service';
import { UserAgentSubscriptionService } from './user-agent-subscription.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type {
  AgentDefinition,
  UserAgentSubscription,
} from '@er/types';
import type { TestResult } from '@er/interfaces';

/**
 * Agent controller.
 * Handles HTTP requests for agent endpoints.
 */
@ApiTags('agents')
@ApiBearerAuth()
@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentController {
  constructor(
    private readonly agentDefinitionService: AgentDefinitionService,
    private readonly subscriptionService: UserAgentSubscriptionService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all available agents' })
  @ApiResponse({
    status: 200,
    description: 'List of available agents',
    type: Object,
  })
  async findAll(
    @Request() req: { user: { sub: string } },
  ): Promise<AgentDefinition[]> {
    return this.agentDefinitionService.findAll(req.user.sub);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'List user agent subscriptions' })
  @ApiResponse({
    status: 200,
    description: 'List of user subscriptions',
    type: Object,
  })
  async findSubscriptions(
    @Request() req: { user: { sub: string } },
  ): Promise<UserAgentSubscription[]> {
    return this.subscriptionService.findByUser(req.user.sub);
  }

  @Post(':id/subscribe')
  @ApiOperation({ summary: 'Subscribe to an agent' })
  @ApiParam({ name: 'id', description: 'Agent definition ID or type' })
  @ApiResponse({
    status: 201,
    description: 'Subscription created successfully',
    type: Object,
  })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @HttpCode(HttpStatus.CREATED)
  async subscribe(
    @Request() req: { user: { sub: string } },
    @Param('id') agentId: string,
    @Body() body: { configuration: Record<string, unknown> },
  ): Promise<UserAgentSubscription> {
    return this.subscriptionService.subscribe(
      req.user.sub,
      agentId,
      body.configuration,
    );
  }

  @Patch('subscriptions/:id')
  @ApiOperation({ summary: 'Update agent subscription' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription updated successfully',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async updateSubscription(
    @Request() req: { user: { sub: string } },
    @Param('id') subscriptionId: string,
    @Body() body: { configuration: Record<string, unknown> },
  ): Promise<UserAgentSubscription> {
    return this.subscriptionService.update(
      req.user.sub,
      subscriptionId,
      body.configuration,
    );
  }

  @Delete('subscriptions/:id')
  @ApiOperation({ summary: 'Unsubscribe from an agent' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({ status: 204, description: 'Unsubscribed successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsubscribe(
    @Request() req: { user: { sub: string } },
    @Param('id') subscriptionId: string,
  ): Promise<void> {
    return this.subscriptionService.unsubscribe(req.user.sub, subscriptionId);
  }

  @Post('subscriptions/:id/test')
  @ApiOperation({ summary: 'Test agent subscription' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({
    status: 200,
    description: 'Test result',
    type: Object,
  })
  async test(
    @Request() req: { user: { sub: string } },
    @Param('id') subscriptionId: string,
  ): Promise<TestResult> {
    return this.subscriptionService.test(req.user.sub, subscriptionId);
  }
}

