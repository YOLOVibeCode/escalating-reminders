# Security Specification

> **Version**: 1.0.0  
> **Last Updated**: December 2024

---

## Overview

This document defines the security architecture for Escalating Reminders, covering authentication, authorization, data protection, and operational security.

---

## Security Principles

1. **Defense in Depth**: Multiple layers of security controls
2. **Least Privilege**: Minimal access rights for all operations
3. **Secure by Default**: Security enabled out of the box
4. **Zero Trust**: Verify every request, trust nothing implicitly

---

## Authentication

### JWT Token System

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         JWT AUTHENTICATION FLOW                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   1. LOGIN                                                               │
│   ────────                                                               │
│   Client ──POST /auth/login──▶ API                                      │
│                                 │                                        │
│                                 ▼                                        │
│                          Validate credentials                           │
│                                 │                                        │
│                                 ▼                                        │
│   Client ◀── { accessToken, refreshToken } ──                           │
│                                                                          │
│   2. API REQUESTS                                                        │
│   ───────────────                                                        │
│   Client ──Authorization: Bearer <accessToken>──▶ API                   │
│                                                                          │
│   3. TOKEN REFRESH                                                       │
│   ────────────────                                                       │
│   When accessToken expires (15 min):                                    │
│   Client ──POST /auth/refresh { refreshToken }──▶ API                   │
│   Client ◀── { newAccessToken } ──                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Token Specifications

| Token Type | Lifetime | Storage | Contents |
|------------|----------|---------|----------|
| Access Token | 15 minutes | Memory | userId, email, tier |
| Refresh Token | 7 days | HTTP-only cookie | userId, sessionId |

### Access Token Structure

```typescript
interface AccessTokenPayload {
  sub: string;          // User ID
  email: string;
  tier: SubscriptionTier;
  iat: number;          // Issued at
  exp: number;          // Expiration
}

// Example JWT payload
{
  "sub": "usr_abc123",
  "email": "user@example.com",
  "tier": "personal",
  "iat": 1705312800,
  "exp": 1705313700
}
```

### Refresh Token Handling

```typescript
// Refresh token stored server-side
interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;      // Hashed token
  deviceInfo: string;     // User agent
  ipAddress: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
}

// Token rotation on refresh
async function refreshAccessToken(refreshToken: string) {
  // 1. Validate refresh token
  const record = await validateRefreshToken(refreshToken);
  
  // 2. Revoke old refresh token
  await revokeRefreshToken(record.id);
  
  // 3. Issue new tokens (rotation)
  const newAccessToken = generateAccessToken(record.userId);
  const newRefreshToken = generateRefreshToken(record.userId);
  
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
```

### OAuth Integration

For calendar and email provider connections:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         OAUTH FLOW (Google Calendar)                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   1. User clicks "Connect Google Calendar"                              │
│                                                                          │
│   2. Client ──POST /calendars/connect { provider: "google" }──▶ API    │
│                                                                          │
│   3. API returns: { authUrl: "https://accounts.google.com/..." }       │
│                                                                          │
│   4. Client redirects user to Google                                    │
│                                                                          │
│   5. User authorizes                                                     │
│                                                                          │
│   6. Google redirects to: /oauth/callback?code=xxx&state=yyy           │
│                                                                          │
│   7. API exchanges code for tokens                                       │
│                                                                          │
│   8. Tokens encrypted and stored                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Authorization

### Role-Based Access Control

| Role | Description | Permissions |
|------|-------------|-------------|
| User | Standard user | Own resources only |
| Admin | System admin | All resources, admin panel |

### Resource-Level Authorization

```typescript
// Every resource access checked against ownership
async function getReminder(reminderId: string, userId: string) {
  const reminder = await prisma.reminder.findUnique({
    where: { id: reminderId },
  });
  
  if (!reminder) {
    throw new NotFoundException('Reminder not found');
  }
  
  // Authorization check
  if (reminder.userId !== userId) {
    throw new ForbiddenException('Access denied');
  }
  
  return reminder;
}
```

### Subscription Tier Enforcement

```typescript
// Middleware to check tier-based access
@Injectable()
export class TierGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredTier = this.reflector.get<SubscriptionTier>(
      'requiredTier',
      context.getHandler(),
    );
    
    if (!requiredTier) return true;
    
    const request = context.switchToHttp().getRequest();
    const userTier = request.user.tier;
    
    return this.tierMeetsRequirement(userTier, requiredTier);
  }
  
  private tierMeetsRequirement(
    userTier: SubscriptionTier,
    required: SubscriptionTier,
  ): boolean {
    const tierOrder = ['FREE', 'PERSONAL', 'PRO', 'FAMILY'];
    return tierOrder.indexOf(userTier) >= tierOrder.indexOf(required);
  }
}

// Usage
@Get('social-contacts')
@RequiresTier('PRO')
getSocialContacts() {
  // Only PRO and FAMILY can access
}
```

---

## Data Protection

### Encryption at Rest

| Data | Encryption Method | Key Management |
|------|-------------------|----------------|
| Database | Supabase/PostgreSQL encryption | Managed |
| OAuth tokens | AES-256-GCM | App-managed |
| Agent credentials | AES-256-GCM | App-managed |
| API keys | SHA-256 hash | N/A (hashed) |

### Encryption Implementation

```typescript
// utils/encryption.ts

import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:ciphertext
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(ciphertext: string): string {
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### Encryption in Transit

| Connection | Protocol | Certificate |
|------------|----------|-------------|
| Client ↔ API | TLS 1.3 | Let's Encrypt (auto) |
| API ↔ Database | TLS 1.3 | Supabase managed |
| API ↔ Redis | TLS 1.3 | Upstash managed |

### Password Hashing

```typescript
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

---

## API Security

### Rate Limiting

```typescript
// Rate limits per subscription tier
const RATE_LIMITS = {
  FREE: { requests: 100, window: '1h' },
  PERSONAL: { requests: 1000, window: '1h' },
  PRO: { requests: 10000, window: '1h' },
  FAMILY: { requests: 10000, window: '1h' },
};

// Implementation with Redis
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || request.ip;
    const tier = request.user?.tier || 'FREE';
    
    const key = `ratelimit:${userId}`;
    const limit = RATE_LIMITS[tier];
    
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, 3600); // 1 hour
    }
    
    if (current > limit.requests) {
      throw new TooManyRequestsException('Rate limit exceeded');
    }
    
    return true;
  }
}
```

### Input Validation

```typescript
// Using Zod for validation
import { z } from 'zod';

const createReminderSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  importance: z.enum(['low', 'medium', 'high', 'critical']),
  escalationProfileId: z.string().uuid(),
  schedule: z.object({
    type: z.enum(['once', 'recurring', 'interval']),
    timezone: z.string().refine(isValidTimezone),
    triggerAt: z.coerce.date().optional(),
    cronExpression: z.string().optional(),
  }),
});

// Validation pipe
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: z.ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    
    if (!result.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        errors: result.error.errors,
      });
    }
    
    return result.data;
  }
}
```

### SQL Injection Prevention

Using Prisma ORM with parameterized queries:

```typescript
// Safe - Prisma handles parameterization
const reminders = await prisma.reminder.findMany({
  where: {
    userId: userId,
    title: { contains: searchTerm },
  },
});

// NEVER do this (raw SQL without parameters)
// const reminders = await prisma.$queryRaw`
//   SELECT * FROM reminders WHERE title LIKE '%${searchTerm}%'
// `;
```

### XSS Prevention

```typescript
// Content-Security-Policy header
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Adjust for Next.js
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.escalating-reminders.com"],
    },
  },
}));

// Escape user content in responses
function sanitizeOutput(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
```

---

## Webhook Security

### Outbound Webhook Signatures

```typescript
// All outbound webhooks are signed
function signWebhookPayload(
  payload: object,
  secret: string,
  timestamp: number,
): string {
  const signaturePayload = `${timestamp}.${JSON.stringify(payload)}`;
  
  return crypto
    .createHmac('sha256', secret)
    .update(signaturePayload)
    .digest('hex');
}

// Headers sent with webhook
const headers = {
  'Content-Type': 'application/json',
  'X-Webhook-Signature': `t=${timestamp},v1=${signature}`,
  'X-Webhook-Id': webhookId,
};
```

### Inbound Webhook Verification

```typescript
// Verify incoming webhooks (e.g., from Twilio)
function verifyTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>,
  authToken: string,
): boolean {
  // Twilio-specific verification
  const data = url + Object.keys(params)
    .sort()
    .map(key => key + params[key])
    .join('');
  
  const expectedSignature = crypto
    .createHmac('sha1', authToken)
    .update(data)
    .digest('base64');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
}
```

---

## API Key Management

### Key Generation

```typescript
// API keys for external integrations
function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = `esk_live_${crypto.randomBytes(24).toString('hex')}`;
  const prefix = key.substring(0, 12); // First 12 chars for identification
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  
  return { key, prefix, hash };
}

// Store only the hash and prefix
await prisma.apiKey.create({
  data: {
    userId,
    name: 'My API Key',
    keyHash: hash,
    keyPrefix: prefix,
  },
});

// Return full key to user ONCE (never stored)
return { apiKey: key };
```

### Key Verification

```typescript
// Verify API key on request
async function verifyApiKey(key: string): Promise<ApiKey | null> {
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: hash },
    include: { user: true },
  });
  
  if (!apiKey) return null;
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;
  
  // Update last used
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });
  
  return apiKey;
}
```

---

## Audit Logging

### Audit Events

```typescript
// Log security-relevant events
interface AuditEvent {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  changes?: object;
  timestamp: Date;
}

// Actions to audit
const AUDIT_ACTIONS = [
  'user.login',
  'user.logout',
  'user.password_changed',
  'reminder.created',
  'reminder.deleted',
  'agent.subscribed',
  'billing.subscription_changed',
  'api_key.created',
  'api_key.revoked',
];
```

### Audit Implementation

```typescript
@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(event: Partial<AuditEvent>) {
    await this.prisma.auditTrail.create({
      data: {
        userId: event.userId,
        action: event.action,
        resource: event.resource,
        resourceId: event.resourceId,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        changes: event.changes || {},
        createdAt: new Date(),
      },
    });
  }
}

// Usage with decorator
@AuditLog('reminder.deleted')
async deleteReminder(id: string, userId: string) {
  // ...
}
```

---

## Security Headers

```typescript
// security.middleware.ts

import helmet from 'helmet';

app.use(helmet());

// Additional headers
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=()');
  
  next();
});
```

---

## Vulnerability Management

### Dependency Scanning

```bash
# Regular dependency audits
npm audit
npm audit fix

# Automated with Dependabot or Snyk
```

### Security Testing

| Test Type | Tool | Frequency |
|-----------|------|-----------|
| Dependency scan | npm audit, Snyk | Every commit |
| SAST | ESLint security plugin | Every commit |
| Secrets scanning | GitLeaks | Every commit |
| Penetration testing | Manual | Quarterly |

---

## Incident Response

### Security Incident Classification

| Severity | Examples | Response Time |
|----------|----------|---------------|
| Critical | Data breach, auth bypass | Immediate |
| High | XSS, SQL injection found | 4 hours |
| Medium | Rate limit bypass | 24 hours |
| Low | Info disclosure | 1 week |

### Response Steps

1. **Detect**: Monitoring alerts, user reports
2. **Contain**: Disable affected features, rotate credentials
3. **Investigate**: Identify root cause, scope of impact
4. **Remediate**: Fix vulnerability, patch systems
5. **Communicate**: Notify affected users if required
6. **Post-mortem**: Document lessons learned

---

## Compliance Considerations

### Data Handling

| Regulation | Applicability | Key Requirements |
|------------|---------------|------------------|
| GDPR | EU users | Data deletion, consent, breach notification |
| CCPA | California users | Data access, deletion rights |
| SOC 2 | Enterprise customers | Security controls (future) |

### Data Retention

| Data Type | Retention | Deletion Method |
|-----------|-----------|-----------------|
| User accounts | Until deletion requested | Hard delete |
| Audit logs | 1 year | Archived, then deleted |
| Notification logs | 90 days | Hard delete |
| OAuth tokens | Until disconnected | Hard delete |

---

*Security is a continuous process. This document should be reviewed and updated regularly.*

