/**
 * @er/interfaces - All Domain Interfaces
 *
 * This package contains ALL interfaces following Interface Segregation Principle (ISP).
 * Interfaces are small, focused, and grouped by domain.
 *
 * Usage:
 *   import { IReminderService, IEventBus } from '@er/interfaces';
 */

// Domains
export * from './domains/auth';
export * from './domains/reminders';
export * from './domains/escalation';
export * from './domains/notifications';
export * from './domains/agents';
export * from './domains/watchers';
export * from './domains/billing';
export * from './domains/calendar';
export * from './domains/admin';

// Infrastructure
export * from './infrastructure';

// Specifications (for external agent developers)
export * from './specifications';

