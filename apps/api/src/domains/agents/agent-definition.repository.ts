import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AgentDefinition } from '@er/types';

/**
 * Agent definition repository.
 * Handles database operations for agent definitions.
 * Implements ISP - only definition-related data access operations.
 */
@Injectable()
export class AgentDefinitionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all agent definitions.
   */
  async findAll(): Promise<AgentDefinition[]> {
    return this.prisma.agentDefinition.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Find agent definition by type.
   */
  async findByType(type: string): Promise<AgentDefinition | null> {
    return this.prisma.agentDefinition.findUnique({
      where: { type },
    });
  }
}

