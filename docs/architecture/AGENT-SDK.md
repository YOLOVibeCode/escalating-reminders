# Agent SDK Specification

> **Version**: 1.0.0  
> **Last Updated**: December 2024

---

## Overview

The Agent SDK enables developers to build custom notification agents for Escalating Reminders. Agents can be official (built by us), verified (community-reviewed), or community (open submission).

---

## Agent Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AGENT ECOSYSTEM                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    NOTIFICATION ORCHESTRATOR                     │   │
│   │                                                                  │   │
│   │   Receives: EscalationAdvanced event                            │   │
│   │   Looks up: User's subscribed agents                            │   │
│   │   Calls: Each agent's send() method                             │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│               ┌──────────────┼──────────────┐                          │
│               ▼              ▼              ▼                          │
│   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────┐ │
│   │  Email Agent    │ │   SMS Agent     │ │  Webhook Agent          │ │
│   │  (Official)     │ │   (Official)    │ │  (Official)             │ │
│   └─────────────────┘ └─────────────────┘ └─────────────────────────┘ │
│                                                                          │
│   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────┐ │
│   │  Discord Agent  │ │  Slack Agent    │ │  Telegram Agent         │ │
│   │  (Community)    │ │  (Verified)     │ │  (Community)            │ │
│   └─────────────────┘ └─────────────────┘ └─────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Agent Interface

### Core Interface

```typescript
// packages/agent-sdk/src/interfaces/agent.interface.ts

/**
 * Core interface that all notification agents must implement.
 */
export interface INotificationAgent {
  /**
   * Unique identifier for this agent type.
   * Convention: "namespace.agent-name" (e.g., "official.email", "community.discord")
   */
  readonly agentType: string;

  /**
   * Human-readable name for display in UI.
   */
  readonly displayName: string;

  /**
   * Description of what this agent does.
   */
  readonly description: string;

  /**
   * Agent capabilities.
   */
  readonly capabilities: AgentCapabilities;

  /**
   * PUSH MODE: Send a notification through this agent.
   * Called by the notification orchestrator.
   */
  sendNotification(payload: NotificationPayload): Promise<SendResult>;

  /**
   * PULL MODE: Get pending notifications for polling.
   * Optional - only for agents that support pull mode.
   */
  getPendingNotifications?(userId: string): Promise<PendingNotification[]>;

  /**
   * COMMAND MODE: Handle inbound commands from this agent.
   * Called when user interacts via this channel (e.g., SMS reply).
   */
  handleCommand?(command: AgentCommand): Promise<CommandResult>;

  /**
   * Configuration schema for user setup.
   * Powers the setup wizard in the web UI.
   */
  getConfigurationSchema(): ConfigurationSchema;

  /**
   * Validate user's configuration before saving.
   */
  validateConfiguration(config: unknown): Promise<ValidationResult>;

  /**
   * Test the agent with user's configuration.
   * Sends a test notification.
   */
  testConfiguration?(config: unknown): Promise<TestResult>;
}
```

### Supporting Types

```typescript
// packages/agent-sdk/src/types/index.ts

export interface AgentCapabilities {
  /** Can send outbound notifications (most agents) */
  canPush: boolean;
  
  /** Supports polling mode (external systems poll us) */
  canPull: boolean;
  
  /** Can receive commands back from user */
  canReceiveCommands: boolean;
  
  /** Supports images, buttons, rich content */
  supportsRichContent: boolean;
  
  /** Which actions this agent supports */
  supportedActions: AgentAction[];
}

export type AgentAction = 'snooze' | 'dismiss' | 'complete' | 'escalate';

export interface NotificationPayload {
  /** Unique notification ID */
  notificationId: string;
  
  /** User ID (for lookups) */
  userId: string;
  
  /** Reminder ID (for actions) */
  reminderId: string;
  
  /** Notification title */
  title: string;
  
  /** Notification message body */
  message: string;
  
  /** Current escalation tier (1-5) */
  escalationTier: number;
  
  /** Reminder importance level */
  importance: 'low' | 'medium' | 'high' | 'critical';
  
  /** Available actions for user */
  actions: AgentAction[];
  
  /** URL for web-based actions */
  actionsUrl?: string;
  
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  deliveredAt?: Date;
  error?: string;
}

export interface AgentCommand {
  /** User ID */
  userId: string;
  
  /** Reminder ID (if identifiable) */
  reminderId?: string;
  
  /** Command type */
  action: AgentAction;
  
  /** Command data (e.g., snooze duration) */
  data?: Record<string, unknown>;
  
  /** Raw input (e.g., SMS text) */
  rawInput?: string;
}

export interface CommandResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ConfigurationSchema {
  fields: ConfigurationField[];
}

export interface ConfigurationField {
  /** Unique field key */
  key: string;
  
  /** Field type */
  type: 'string' | 'number' | 'boolean' | 'phone' | 'email' | 'url' | 'select';
  
  /** Display label */
  label: string;
  
  /** Is this field required? */
  required: boolean;
  
  /** Should this be stored encrypted? */
  secret: boolean;
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Help text for users */
  helpText?: string;
  
  /** For 'select' type - available options */
  options?: { value: string; label: string }[];
  
  /** Validation pattern (regex) */
  pattern?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors?: { field: string; message: string }[];
}

export interface TestResult {
  success: boolean;
  message: string;
  deliveryTime?: number; // ms
}
```

---

## Agent Manifest

Every agent includes a manifest file describing it:

```yaml
# agent.manifest.yaml

# Unique agent identifier
id: "official.sms-twilio"

# Display information
name: "SMS (Twilio)"
version: "1.0.0"
author: "Escalating Reminders"
description: "Send SMS notifications via Twilio. Supports reply commands."
icon: "sms-icon.svg"
category: "messaging"

# Links
homepage: "https://escalating-reminders.com/agents/sms"
documentation: "https://docs.escalating-reminders.com/agents/sms"
repository: "https://github.com/escalating-reminders/agents/sms"

# Capabilities
capabilities:
  canPush: true
  canPull: false
  canReceiveCommands: true
  supportsRichContent: false
  supportedActions:
    - snooze
    - dismiss
    - complete

# User configuration schema
configuration:
  fields:
    - key: "phoneNumber"
      type: "phone"
      label: "Your Phone Number"
      required: true
      secret: false
      helpText: "We'll send SMS notifications to this number"
      placeholder: "+1 555 123 4567"

# For receiving webhooks (command mode)
webhooks:
  - path: "/webhooks/twilio/inbound"
    method: "POST"
    description: "Receives SMS replies from Twilio"

# Subscription requirements
pricing:
  minimumTier: "personal"

# External service dependencies
dependencies:
  - name: "Twilio"
    url: "https://twilio.com"
    accountRequired: false  # We use our Twilio account
```

---

## Implementing an Agent

### Example: Discord Agent

```typescript
// agents/discord-agent/src/index.ts

import {
  INotificationAgent,
  AgentCapabilities,
  NotificationPayload,
  SendResult,
  AgentCommand,
  CommandResult,
  ConfigurationSchema,
  ValidationResult,
  TestResult,
} from '@escalating-reminders/agent-sdk';
import { Client, GatewayIntentBits, TextChannel } from 'discord.js';

export class DiscordAgent implements INotificationAgent {
  readonly agentType = 'community.discord';
  readonly displayName = 'Discord';
  readonly description = 'Send notifications to a Discord channel';

  readonly capabilities: AgentCapabilities = {
    canPush: true,
    canPull: false,
    canReceiveCommands: true,
    supportsRichContent: true,
    supportedActions: ['snooze', 'dismiss', 'complete'],
  };

  private client: Client | null = null;

  async sendNotification(payload: NotificationPayload): Promise<SendResult> {
    try {
      const config = await this.getUserConfig(payload.userId);
      
      if (!this.client) {
        this.client = new Client({
          intents: [GatewayIntentBits.Guilds],
        });
        await this.client.login(config.botToken);
      }

      const channel = await this.client.channels.fetch(config.channelId) as TextChannel;
      
      const embed = {
        title: `🔔 ${payload.title}`,
        description: payload.message,
        color: this.getColorForTier(payload.escalationTier),
        fields: [
          {
            name: 'Importance',
            value: payload.importance.toUpperCase(),
            inline: true,
          },
          {
            name: 'Escalation Tier',
            value: `${payload.escalationTier}`,
            inline: true,
          },
        ],
        footer: {
          text: `Reply with: snooze [duration], dismiss, or complete`,
        },
      };

      const message = await channel.send({ embeds: [embed] });

      return {
        success: true,
        messageId: message.id,
        deliveredAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async handleCommand(command: AgentCommand): Promise<CommandResult> {
    // Parse Discord message and map to command
    const action = this.parseDiscordMessage(command.rawInput);
    
    if (!action) {
      return {
        success: false,
        error: 'Could not understand command. Try: snooze 1h, dismiss, or complete',
      };
    }

    return {
      success: true,
      message: `Command ${action} received`,
    };
  }

  getConfigurationSchema(): ConfigurationSchema {
    return {
      fields: [
        {
          key: 'botToken',
          type: 'string',
          label: 'Discord Bot Token',
          required: true,
          secret: true,
          helpText: 'Create a bot at discord.com/developers',
        },
        {
          key: 'channelId',
          type: 'string',
          label: 'Channel ID',
          required: true,
          secret: false,
          helpText: 'Right-click channel > Copy ID',
        },
      ],
    };
  }

  async validateConfiguration(config: unknown): Promise<ValidationResult> {
    const { botToken, channelId } = config as any;
    const errors: { field: string; message: string }[] = [];

    if (!botToken || botToken.length < 50) {
      errors.push({ field: 'botToken', message: 'Invalid bot token format' });
    }

    if (!channelId || !/^\d+$/.test(channelId)) {
      errors.push({ field: 'channelId', message: 'Channel ID must be numeric' });
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async testConfiguration(config: unknown): Promise<TestResult> {
    const start = Date.now();
    
    try {
      const { botToken, channelId } = config as any;
      
      const client = new Client({
        intents: [GatewayIntentBits.Guilds],
      });
      
      await client.login(botToken);
      const channel = await client.channels.fetch(channelId) as TextChannel;
      
      await channel.send('🧪 Test notification from Escalating Reminders');
      
      await client.destroy();
      
      return {
        success: true,
        message: 'Test message sent successfully!',
        deliveryTime: Date.now() - start,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to send test: ${error.message}`,
      };
    }
  }

  private getColorForTier(tier: number): number {
    const colors = {
      1: 0x3498db, // Blue
      2: 0xf39c12, // Orange
      3: 0xe74c3c, // Red
      4: 0x9b59b6, // Purple
      5: 0x000000, // Black
    };
    return colors[tier] || 0x3498db;
  }

  private parseDiscordMessage(message: string): string | null {
    const lower = message.toLowerCase().trim();
    
    if (lower.startsWith('snooze')) return 'snooze';
    if (lower === 'dismiss') return 'dismiss';
    if (lower === 'complete' || lower === 'done') return 'complete';
    
    return null;
  }

  private async getUserConfig(userId: string): Promise<any> {
    // Fetch from database
    // Implementation depends on how SDK integrates with main app
    return {};
  }
}

// Export for registration
export default DiscordAgent;
```

---

## Agent CLI

The SDK includes a CLI for scaffolding and testing agents:

```bash
# Install CLI globally
npm install -g @escalating-reminders/agent-sdk

# Create new agent project
er-agent create my-custom-agent

# Project structure created:
# my-custom-agent/
# ├── src/
# │   ├── index.ts           # Agent implementation
# │   └── types.ts           # Custom types
# ├── agent.manifest.yaml    # Agent manifest
# ├── package.json
# ├── tsconfig.json
# └── README.md

# Development
cd my-custom-agent
npm install
npm run dev          # Watch mode with hot reload

# Testing
npm run test         # Run unit tests
er-agent test        # Interactive test mode

# Validation
er-agent validate    # Validate manifest and implementation

# Build
npm run build        # Compile TypeScript

# Publish to marketplace
er-agent publish     # Submits for review
```

### CLI Commands

```bash
# Create new agent
er-agent create <name> [--template=<template>]
  Templates: basic, webhook, polling

# Validate agent
er-agent validate [--fix]
  Checks: manifest, interface implementation, types

# Test agent locally
er-agent test [--config=<path>]
  Interactive testing with mock payloads

# Publish to marketplace
er-agent publish [--draft]
  Submits for review (or saves as draft)

# Version management
er-agent version <major|minor|patch>
  Bumps version in manifest and package.json
```

---

## Agent Registration

### Official Agents

Built into the main application:

```typescript
// apps/api/src/domains/agents/official-agents.ts

import { EmailAgent } from './email.agent';
import { SmsAgent } from './sms.agent';
import { WebhookAgent } from './webhook.agent';
import { WebPushAgent } from './web-push.agent';

export const OFFICIAL_AGENTS = [
  new EmailAgent(),
  new SmsAgent(),
  new WebhookAgent(),
  new WebPushAgent(),
];
```

### Community Agents

Loaded dynamically from marketplace:

```typescript
// apps/api/src/domains/agents/agent-registry.service.ts

@Injectable()
export class AgentRegistryService {
  private agents: Map<string, INotificationAgent> = new Map();

  constructor(
    private prisma: PrismaService,
    private agentLoader: AgentLoaderService,
  ) {}

  async onModuleInit() {
    // Load official agents
    for (const agent of OFFICIAL_AGENTS) {
      this.agents.set(agent.agentType, agent);
    }

    // Load verified community agents
    const communityAgents = await this.prisma.agentDefinition.findMany({
      where: { isVerified: true, isOfficial: false },
    });

    for (const agentDef of communityAgents) {
      const agent = await this.agentLoader.loadAgent(agentDef);
      this.agents.set(agent.agentType, agent);
    }
  }

  getAgent(agentType: string): INotificationAgent | undefined {
    return this.agents.get(agentType);
  }

  getAllAgents(): INotificationAgent[] {
    return Array.from(this.agents.values());
  }
}
```

---

## Agent Marketplace

### Marketplace Features

| Feature | Description |
|---------|-------------|
| **Browse** | Search and filter available agents |
| **Install** | One-click subscription with config wizard |
| **Reviews** | User ratings and reviews |
| **Versions** | Version history, update notifications |
| **Categories** | Messaging, Smart Home, Productivity, etc. |

### Marketplace API

```typescript
// GET /api/v1/marketplace/agents
interface MarketplaceAgent {
  id: string;
  type: string;
  name: string;
  description: string;
  author: string;
  version: string;
  isOfficial: boolean;
  isVerified: boolean;
  category: string;
  minimumTier: SubscriptionTier;
  rating: number;
  reviewCount: number;
  installCount: number;
  iconUrl: string;
  screenshots: string[];
  capabilities: AgentCapabilities;
}

// GET /api/v1/marketplace/agents/:id
interface MarketplaceAgentDetails extends MarketplaceAgent {
  readme: string;
  changelog: string;
  configurationSchema: ConfigurationSchema;
  reviews: AgentReview[];
}
```

---

## Security Model

### Agent Sandboxing

Community agents run in isolated environments:

```typescript
// Agent execution environment
interface AgentSandbox {
  // Limited network access
  allowedHosts: string[];  // Only their declared dependencies
  
  // No filesystem access
  // No environment variables from host
  // Limited memory (256MB)
  // Execution timeout (30 seconds)
}
```

### Secret Management

User credentials are encrypted and passed securely:

```typescript
// Configuration is decrypted just before passing to agent
async function executeAgent(agent: INotificationAgent, payload: NotificationPayload) {
  const encryptedConfig = await getUserAgentConfig(payload.userId, agent.agentType);
  const decryptedConfig = decrypt(encryptedConfig);
  
  // Pass decrypted config to agent (never stored decrypted)
  return agent.sendNotification(payload, decryptedConfig);
}
```

### Webhook Verification

All outbound webhooks are signed:

```typescript
// Signature generation
function signWebhook(payload: object, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signaturePayload = `${timestamp}.${JSON.stringify(payload)}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signaturePayload)
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
}

// Headers sent
{
  'X-Webhook-Signature': 't=1705312800,v1=abc123...',
  'Content-Type': 'application/json'
}
```

---

## Testing Agents

### Unit Testing

```typescript
// agents/my-agent/tests/agent.test.ts

import { MyAgent } from '../src';
import { createMockPayload, createMockConfig } from '@escalating-reminders/agent-sdk/testing';

describe('MyAgent', () => {
  let agent: MyAgent;

  beforeEach(() => {
    agent = new MyAgent();
  });

  describe('sendNotification', () => {
    it('should send notification successfully', async () => {
      const payload = createMockPayload({
        title: 'Test Reminder',
        message: 'This is a test',
      });

      const result = await agent.sendNotification(payload);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      const payload = createMockPayload({ userId: 'invalid' });

      const result = await agent.sendNotification(payload);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateConfiguration', () => {
    it('should accept valid config', async () => {
      const config = createMockConfig(agent.getConfigurationSchema());

      const result = await agent.validateConfiguration(config);

      expect(result.valid).toBe(true);
    });

    it('should reject invalid config', async () => {
      const result = await agent.validateConfiguration({});

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});
```

### Integration Testing

```bash
# Start test environment
er-agent test --env=integration

# Test workflow:
# 1. Validates manifest
# 2. Validates interface implementation
# 3. Sends test notification with mock config
# 4. Tests command handling
# 5. Reports results
```

---

## Publishing Agents

### Submission Process

1. **Validate**: `er-agent validate` passes
2. **Submit**: `er-agent publish` creates submission
3. **Review**: Team reviews code and manifest
4. **Testing**: Automated tests run
5. **Approval**: Agent goes live (or feedback provided)

### Review Criteria

| Criteria | Description |
|----------|-------------|
| **Security** | No malicious code, proper secret handling |
| **Reliability** | Error handling, timeout handling |
| **Documentation** | Clear README, configuration help |
| **Quality** | Tests pass, clean code |
| **Compliance** | Follows SDK guidelines |

---

*The Agent SDK enables a rich ecosystem of notification channels while maintaining security and quality standards.*

